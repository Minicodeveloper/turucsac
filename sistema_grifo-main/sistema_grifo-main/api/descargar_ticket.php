<?php
require_once __DIR__ . '/config/headers.php';
require_once dirname(__DIR__, 3) . '/config.php';
Config::load();
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/auth_middleware.php';

$ticketId = trim((string) ($_GET['ticket_id'] ?? ''));
$saleId = trim((string) ($_GET['id'] ?? ''));
$type = strtolower((string) ($_GET['tipo'] ?? 'pdf'));

if (($ticketId === '' && $saleId === '') || !in_array($type, ['pdf', 'xml', 'cdr'], true)) {
    http_response_code(400);
    exit('Solicitud de comprobante no válida.');
}

$database = new Database();
$db = $database->getConnection();
$query = "SELECT v.id, v.ticket_id, v.serie, v.correlativo, v.tipo_comprobante,
                 v.sunat_codigo, v.sunat_xml_path, v.sunat_cdr_path, v.empresa_id,
                 v.fecha_venta, v.monto_total, v.galones, v.placa, v.metodo_pago,
                 c.documento AS cliente_doc, c.razon_social AS cliente_nombre,
                 f.nombre_producto, e.razon_social AS empresa_nombre, e.ruc AS empresa_ruc,
                 e.direccion AS empresa_direccion, u.nombre_completo AS vendedor_nombre
          FROM ventas v
          LEFT JOIN clientes c ON c.id = v.cliente_id
          LEFT JOIN combustibles f ON f.id = v.combustible_id
          LEFT JOIN empresas e ON e.id = v.empresa_id
          LEFT JOIN usuarios u ON u.id = v.usuario_id
          WHERE " . ($ticketId !== '' ? 'v.ticket_id = :sale_id' : 'v.id = :sale_id');
if (strtoupper((string) USER_ROL) !== 'SUPER_ADMIN') {
    $query .= ' AND v.empresa_id = :empresa_id';
}
$query .= ' LIMIT 1';

$stmt = $db->prepare($query);
$stmt->bindValue(':sale_id', $ticketId !== '' ? $ticketId : $saleId);
if (strtoupper((string) USER_ROL) !== 'SUPER_ADMIN') {
    $stmt->bindValue(':empresa_id', USER_EMPRESA_ID, PDO::PARAM_INT);
}
$stmt->execute();
$sale = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$sale) {
    http_response_code(404);
    exit('Comprobante no encontrado.');
}

if ($type === 'pdf' && $sale['tipo_comprobante'] === 'Nota de Venta') {
    $escape = static fn ($value): string => htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
    $amount = number_format((float) $sale['monto_total'], 2, '.', '');
    $date = $sale['fecha_venta'] ? date('d/m/Y H:i', strtotime($sale['fecha_venta'])) : '';
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><html lang="es"><meta charset="utf-8"><title>Nota de venta</title>'
        . '<style>body{font:14px Arial;max-width:320px;margin:24px auto}.center{text-align:center}.line{border-top:1px dashed #333;margin:12px 0}</style>'
        . '<section><header class="center"><strong>' . $escape($sale['empresa_nombre'] ?? '') . '</strong><br>'
        . 'RUC: ' . $escape($sale['empresa_ruc'] ?? '') . '<br>' . $escape($sale['empresa_direccion'] ?? '') . '</header>'
        . '<div class="line"></div><h3 class="center">NOTA DE VENTA INTERNA</h3>'
        . '<p><b>NO ES COMPROBANTE ELECTRÓNICO SUNAT</b></p>'
        . '<p>Ticket: ' . $escape($sale['ticket_id']) . '<br>Fecha: ' . $escape($date)
        . '<br>Cliente: ' . $escape($sale['cliente_nombre'] ?? 'CLIENTES VARIOS')
        . '<br>Documento: ' . $escape($sale['cliente_doc'] ?? '00000000')
        . '<br>Producto: ' . $escape($sale['nombre_producto'] ?? 'Combustible')
        . '<br>Galones: ' . $escape(number_format((float) $sale['galones'], 3))
        . '<br>Placa: ' . $escape($sale['placa'] ?? '')
        . '<br>Pago: ' . $escape($sale['metodo_pago'] ?? '') . '</p>'
        . '<div class="line"></div><p><strong>TOTAL S/ ' . $escape($amount) . '</strong></p>'
        . '<p>Vendedor: ' . $escape($sale['vendedor_nombre'] ?? '') . '</p></section>'
        . '<script>window.onload=function(){window.print()}</script></html>';
    exit;
}

$sunatCode = filter_var($sale['sunat_codigo'] ?? null, FILTER_VALIDATE_INT);
if ($sunatCode !== 0 && ($sunatCode === false || $sunatCode < 4000)) {
    http_response_code(409);
    exit('SUNAT no ha confirmado este comprobante; no hay archivos fiscales para descargar.');
}

$projectRoot = realpath(dirname(__DIR__, 3));
if ($projectRoot === false) {
    http_response_code(500);
    exit('No se pudo localizar el almacenamiento de comprobantes.');
}

$filePath = null;
$contentType = 'application/octet-stream';
$fileName = '';

if ($type === 'pdf') {
    $serie = (string) ($sale['serie'] ?? '');
    $correlativo = (int) ($sale['correlativo'] ?? 0);
    if (!preg_match('/^[A-Z0-9]{4}$/', $serie) || $correlativo < 1) {
        http_response_code(404);
        exit('El comprobante aceptado no tiene una serie y correlativo válidos.');
    }

    $ticketSuffix = preg_replace('/[^A-Za-z0-9_-]/', '', (string) ($sale['ticket_id'] ?? ''));
    $matches = glob(
        $projectRoot . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'tickets'
        . DIRECTORY_SEPARATOR . $serie . '-' . $correlativo . '-' . $ticketSuffix . '-*.pdf'
    );
    $filePath = $matches[0] ?? null;
    $contentType = 'application/pdf';
    $fileName = $serie . '-' . $correlativo . '.pdf';
} elseif ($type === 'xml') {
    $filePath = (string) ($sale['sunat_xml_path'] ?? '');
    $contentType = 'application/xml; charset=utf-8';
    $fileName = basename($filePath);
} else {
    $filePath = (string) ($sale['sunat_cdr_path'] ?? '');
    $contentType = 'application/zip';
    $fileName = basename($filePath);
}

$resolvedPath = is_string($filePath) && $filePath !== '' ? realpath($filePath) : false;
$rootPrefix = rtrim($projectRoot, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;
if ($resolvedPath === false
    || !is_file($resolvedPath)
    || strncasecmp($resolvedPath, $rootPrefix, strlen($rootPrefix)) !== 0) {
    http_response_code(404);
    exit('El archivo fiscal real de SUNAT no está disponible.');
}

header('Content-Type: ' . $contentType);
header('Content-Disposition: inline; filename="' . str_replace('"', '', $fileName) . '"');
header('Content-Length: ' . filesize($resolvedPath));
header('X-Content-Type-Options: nosniff');
readfile($resolvedPath);
