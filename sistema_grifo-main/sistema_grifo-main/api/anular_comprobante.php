<?php
require_once __DIR__ . '/config/headers.php';
require_once dirname(__DIR__, 3) . '/config.php';
Config::load();
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/auth_middleware.php';
require_once dirname(__DIR__, 3) . '/FacturacionService.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido. Utilice POST.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$saleId = filter_var($input['venta_id'] ?? null, FILTER_VALIDATE_INT);
$reason = trim((string) ($input['motivo'] ?? 'ANULACION DE LA OPERACION'));
if (!$saleId || $reason === '' || strlen($reason) > 250) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Indique una venta válida y un motivo de hasta 250 caracteres.']);
    exit;
}

$db = (new Database())->getConnection();
$isSuperAdmin = strtoupper((string) USER_ROL) === 'SUPER_ADMIN';
$saleQuery = "SELECT v.id, v.ticket_id, v.empresa_id, v.tipo_comprobante, v.serie, v.correlativo,
                     v.sunat_codigo, v.anulacion_estado, v.anulacion_serie, v.anulacion_correlativo,
                     v.monto_total, v.galones, v.combustible_id,
                     c.documento AS cliente_documento, c.razon_social AS cliente_nombre,
                     f.nombre_producto
              FROM ventas v
              LEFT JOIN clientes c ON c.id = v.cliente_id
              LEFT JOIN combustibles f ON f.id = v.combustible_id
              WHERE v.id = :id";
if (!$isSuperAdmin) {
    $saleQuery .= ' AND v.empresa_id = :empresa_id';
}
$saleQuery .= ' LIMIT 1';
$saleStmt = $db->prepare($saleQuery);
$saleStmt->bindValue(':id', $saleId, PDO::PARAM_INT);
if (!$isSuperAdmin) {
    $saleStmt->bindValue(':empresa_id', USER_EMPRESA_ID, PDO::PARAM_INT);
}
$saleStmt->execute();
$sale = $saleStmt->fetch(PDO::FETCH_ASSOC);
if (!$sale) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Comprobante no encontrado.']);
    exit;
}
$sunatCode = filter_var($sale['sunat_codigo'] ?? null, FILTER_VALIDATE_INT);
$sunatAccepted = $sunatCode === 0 || ($sunatCode !== false && $sunatCode >= 4000);
if (!$sunatAccepted) {
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => 'Solo se pueden anular comprobantes aceptados por SUNAT.']);
    exit;
}
if ($sale['anulacion_estado'] === 'ANULADO') {
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => 'Este comprobante ya fue anulado ante SUNAT.']);
    exit;
}
if ($sale['anulacion_estado'] === 'ANULACION_PENDIENTE') {
    http_response_code(409);
    echo json_encode([
        'success' => false,
        'estado' => 'ANULACION_PENDIENTE',
        'message' => 'La solicitud de anulación quedó pendiente de confirmación. Verifique su estado en SUNAT antes de volver a intentarlo.',
    ]);
    exit;
}

$tipoDocAfectado = match ($sale['tipo_comprobante']) {
    'Factura Electrónica' => '01',
    'Boleta de Venta', 'Boleta' => '03',
    default => null,
};
if ($tipoDocAfectado === null || empty($sale['serie']) || (int) $sale['correlativo'] < 1) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'El registro no contiene una factura o boleta electrónica válida para anular.']);
    exit;
}
if ((float) $sale['galones'] <= 0 || (float) $sale['monto_total'] <= 0 || empty($sale['nombre_producto'])) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'No se pudo reconstruir el detalle fiscal de la venta para emitir la Nota de Crédito.']);
    exit;
}

$companyId = (int) $sale['empresa_id'];
$lockName = 'turuc_cancel_' . substr(hash('sha256', (string) $companyId), 0, 48);
$lockStmt = $db->prepare('SELECT GET_LOCK(:lock_name, 15)');
$lockStmt->execute([':lock_name' => $lockName]);
if ((int) $lockStmt->fetchColumn() !== 1) {
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => 'No se pudo reservar el correlativo de Nota de Crédito. Intente nuevamente.']);
    exit;
}

$httpStatus = 200;
$response = [];
$attemptRegistered = false;
try {
    $saleStmt->execute();
    $sale = $saleStmt->fetch(PDO::FETCH_ASSOC);
    if (!$sale) {
        $httpStatus = 409;
        $response = ['success' => false, 'message' => 'El comprobante ya no está disponible para anulación.'];
    } elseif (($sunatCode = filter_var($sale['sunat_codigo'] ?? null, FILTER_VALIDATE_INT)) !== 0
        && ($sunatCode === false || $sunatCode < 4000)) {
        $httpStatus = 409;
        $response = ['success' => false, 'message' => 'El comprobante ya no está disponible para anulación.'];
    } elseif ($sale['anulacion_estado'] === 'ANULADO') {
        $httpStatus = 409;
        $response = ['success' => false, 'message' => 'Este comprobante ya fue anulado ante SUNAT.'];
    } elseif ($sale['anulacion_estado'] === 'ANULACION_PENDIENTE') {
        $httpStatus = 409;
        $response = [
            'success' => false,
            'estado' => 'ANULACION_PENDIENTE',
            'message' => 'La solicitud de anulación quedó pendiente de confirmación. Verifique su estado en SUNAT antes de volver a intentarlo.',
        ];
    } else {
        $noteSeries = FacturacionService::resolverSerieNotaCredito($tipoDocAfectado);
        $noteNumber = !empty($sale['anulacion_correlativo'])
            ? (int) $sale['anulacion_correlativo']
            : 0;
        if ($noteNumber === 0 || $sale['anulacion_serie'] !== $noteSeries) {
            $sequenceStmt = $db->prepare(
                'SELECT COALESCE(MAX(anulacion_correlativo), 0) + 1
                 FROM ventas
                 WHERE empresa_id = :empresa_id AND anulacion_serie = :serie'
            );
            $sequenceStmt->execute([':empresa_id' => $companyId, ':serie' => $noteSeries]);
            $noteNumber = (int) $sequenceStmt->fetchColumn();
        }

        $service = new FacturacionService($companyId);
        $pendingStmt = $db->prepare(
            "UPDATE ventas
             SET anulacion_estado = 'ANULACION_PENDIENTE',
                 anulacion_mensaje = :mensaje,
                 anulacion_serie = :serie,
                 anulacion_correlativo = :correlativo
             WHERE id = :id AND empresa_id = :empresa_id"
        );
        $pendingStmt->execute([
            ':mensaje' => 'Solicitud de Nota de Crédito enviada; esperando confirmación de SUNAT.',
            ':serie' => $noteSeries,
            ':correlativo' => $noteNumber,
            ':id' => $saleId,
            ':empresa_id' => $companyId,
        ]);
        if ($pendingStmt->rowCount() !== 1) {
            throw new RuntimeException('El comprobante cambió antes de registrar la solicitud de anulación.');
        }
        $attemptRegistered = true;

        $documentoCliente = preg_replace('/\D/', '', (string) ($sale['cliente_documento'] ?? ''));
        $esClienteGenerico = $documentoCliente === '' || $documentoCliente === '00000000';
        $tipoCliente = $esClienteGenerico
            ? '0'
            : (strlen($documentoCliente) === 11 ? '6' : '1');
        $unitValue = round(
            ((float) $sale['monto_total'] / 1.18) / (float) $sale['galones'],
            6
        );

        try {
            $result = $service->emitirNotaCreditoAnulacion([
                'empresa_id' => $companyId,
                'serie' => $noteSeries,
                'correlativo' => $noteNumber,
                'tipo_doc_afectado' => $tipoDocAfectado,
                'doc_afectado' => $sale['serie'] . '-' . $sale['correlativo'],
                'cod_motivo' => '01',
                'des_motivo' => $reason,
                'cliente' => [
                    'tipo_doc' => $tipoCliente,
                    'num_doc' => $esClienteGenerico ? '00000000' : $documentoCliente,
                    'rzn_social' => $sale['cliente_nombre'] ?: 'CLIENTES VARIOS',
                ],
                'items' => [[
                    'codigo' => (string) $sale['combustible_id'],
                    'unidad' => 'GLL',
                    'cantidad' => (float) $sale['galones'],
                    'descripcion' => $sale['nombre_producto'],
                    'valor_unitario' => $unitValue,
                ]],
            ]);
        } catch (Throwable $e) {
            error_log('No se pudo confirmar la Nota de Crédito en SUNAT: ' . $e->getMessage());
            $message = 'No se pudo confirmar la anulación. Verifique el estado en SUNAT antes de volver a intentarlo.';
            $pendingUpdate = $db->prepare(
                "UPDATE ventas SET anulacion_mensaje = :mensaje WHERE id = :id AND empresa_id = :empresa_id"
            );
            $pendingUpdate->execute([
                ':mensaje' => $message,
                ':id' => $saleId,
                ':empresa_id' => $companyId,
            ]);
            $httpStatus = 502;
            $response = ['success' => false, 'estado' => 'ANULACION_PENDIENTE', 'message' => $message];
        }

        if (isset($result)) {
            $accepted = !empty($result['success']) && !empty($result['aceptado']);
            $state = $accepted ? 'ANULADO' : (!empty($result['success']) ? 'ANULACION_RECHAZADA' : 'ANULACION_PENDIENTE');
            $message = (string) ($result['mensaje'] ?? 'SUNAT no devolvió una respuesta.');
            $resultStmt = $db->prepare(
                'UPDATE ventas
                 SET anulacion_estado = :estado,
                     anulacion_mensaje = :mensaje,
                     anulacion_xml_path = :xml_path,
                     anulacion_cdr_path = :cdr_path
                 WHERE id = :id AND empresa_id = :empresa_id'
            );
            $resultStmt->execute([
                ':estado' => $state,
                ':mensaje' => substr($message, 0, 255),
                ':xml_path' => $result['xml_path'] ?? null,
                ':cdr_path' => $result['cdr_path'] ?? null,
                ':id' => $saleId,
                ':empresa_id' => $companyId,
            ]);
            $httpStatus = $accepted ? 200 : (!empty($result['success']) ? 422 : 502);
            $response = [
                'success' => $accepted,
                'estado' => $state,
                'message' => $accepted
                    ? 'Comprobante anulado y Nota de Crédito aceptada por SUNAT.'
                    : $message,
                'nota_credito' => $noteSeries . '-' . $noteNumber,
            ];
        }
    }
} catch (Throwable $e) {
    error_log('Error al procesar anulación SUNAT: ' . $e->getMessage());
    $httpStatus = 500;
    $response = [
        'success' => false,
        'estado' => $attemptRegistered ? 'ANULACION_PENDIENTE' : null,
        'message' => 'No se pudo completar la solicitud de anulación. Verifique el estado antes de volver a intentarlo.',
    ];
} finally {
    $releaseStmt = $db->prepare('SELECT RELEASE_LOCK(:lock_name)');
    $releaseStmt->execute([':lock_name' => $lockName]);
}

http_response_code($httpStatus);
echo json_encode($response);
