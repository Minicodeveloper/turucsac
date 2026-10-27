<?php
require_once __DIR__ . '/config/headers.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/auth_middleware.php';

$db = (new Database())->getConnection();
$role = strtoupper((string) USER_ROL);
$role = $role === 'ADMIN' ? 'SUPER_ADMIN' : $role;
$empresaId = USER_EMPRESA_ID ? (int) USER_EMPRESA_ID : null;
$method = $_SERVER['REQUEST_METHOD'];

function closureError(int $status, string $message): void
{
    http_response_code($status);
    echo json_encode(['success' => false, 'message' => $message]);
    exit;
}

function getCashSummary(PDO $db, int $empresaId, int $userId): array
{
    $lastClose = $db->prepare(
        'SELECT COALESCE(MAX(fecha_cierre), \'1970-01-01 00:00:00.000000\')
         FROM cierres_caja WHERE empresa_id = :empresa_id AND usuario_id = :usuario_id'
    );
    $lastClose->execute([':empresa_id' => $empresaId, ':usuario_id' => $userId]);
    $startedAt = (string) $lastClose->fetchColumn();

    $sales = $db->prepare(
        "SELECT
            COALESCE(SUM(CASE WHEN LOWER(metodo_pago) LIKE 'efectivo%' THEN monto_total ELSE 0 END), 0) AS efectivo,
            COALESCE(SUM(CASE WHEN LOWER(metodo_pago) LIKE 'tarjeta%' THEN monto_total ELSE 0 END), 0) AS tarjetas
         FROM ventas
         WHERE empresa_id = :empresa_id AND usuario_id = :usuario_id
           AND fecha_venta > :fecha_inicio
           AND (anulacion_estado IS NULL OR anulacion_estado <> 'ANULADO')"
    );
    $sales->execute([
        ':empresa_id' => $empresaId,
        ':usuario_id' => $userId,
        ':fecha_inicio' => $startedAt,
    ]);
    $amounts = $sales->fetch(PDO::FETCH_ASSOC);

    return [
        'fecha_inicio' => $startedAt,
        'ventas_efectivo' => round((float) ($amounts['efectivo'] ?? 0), 2),
        'tarjetas_monto' => round((float) ($amounts['tarjetas'] ?? 0), 2),
    ];
}

if ($method === 'GET') {
    if (!$empresaId && $role !== 'SUPER_ADMIN') {
        closureError(403, 'Tu usuario no tiene una empresa asignada. Contacta al administrador.');
    }

    if (($_GET['action'] ?? '') === 'summary') {
        if ($role !== 'CAJERO') {
            closureError(403, 'El resumen del turno está disponible para el cajero autenticado.');
        }
        try {
            echo json_encode(['success' => true, 'data' => getCashSummary($db, $empresaId, (int) USER_ID)]);
        } catch (PDOException $e) {
            error_log('No se pudo consultar el resumen de caja: ' . $e->getMessage());
            closureError(500, 'No se pudo cargar el resumen de caja. Verifica que la migración esté aplicada.');
        }
        exit;
    }

    if (!in_array($role, ['SUPER_ADMIN', 'ADMIN_EMPRESA', 'SUPERVISOR'], true)) {
        closureError(403, 'No tienes permisos para consultar el historial de cierres.');
    }

    try {
        $query = 'SELECT c.id, c.empresa_id, c.usuario_id, c.monto_inicial,
                         c.efectivo_esperado, c.efectivo_real, c.tarjetas_monto,
                         c.diferencia, c.justificacion, c.fecha_cierre,
                         u.nombre_completo AS usuario_nombre, e.razon_social AS empresa_nombre
                  FROM cierres_caja c
                  INNER JOIN usuarios u ON c.usuario_id = u.id
                  LEFT JOIN empresas e ON c.empresa_id = e.id';
        $params = [];
        if ($role !== 'SUPER_ADMIN') {
            $query .= ' WHERE c.empresa_id = :empresa_id';
            $params[':empresa_id'] = $empresaId;
        }
        $query .= ' ORDER BY c.fecha_cierre DESC LIMIT 100';
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    } catch (PDOException $e) {
        error_log('No se pudo consultar el historial de cierres: ' . $e->getMessage());
        closureError(500, 'No se pudo cargar el historial. Verifica que la migración esté aplicada.');
    }
    exit;
}

if ($method === 'POST') {
    if ($role !== 'CAJERO') {
        closureError(403, 'Solo el cajero puede registrar el cierre de su turno.');
    }
    if (!$empresaId) {
        closureError(403, 'Tu usuario no tiene una empresa asignada. Contacta al administrador.');
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        closureError(400, 'Los datos del cierre no son válidos.');
    }
    foreach (['monto_inicial', 'efectivo_real'] as $field) {
        if (!isset($input[$field]) || !is_numeric($input[$field]) || (float) $input[$field] < 0) {
            closureError(422, 'El fondo inicial y el efectivo contado deben ser importes válidos y no negativos.');
        }
    }

    $openingAmount = round((float) $input['monto_inicial'], 2);
    $actualCash = round((float) $input['efectivo_real'], 2);
    $justification = trim((string) ($input['justificacion'] ?? ''));
    if (mb_strlen($justification) > 2000) {
        closureError(422, 'La justificación no puede superar los 2000 caracteres.');
    }

    try {
        $db->beginTransaction();
        $lockUser = $db->prepare('SELECT id FROM usuarios WHERE id = :usuario_id FOR UPDATE');
        $lockUser->execute([':usuario_id' => USER_ID]);
        if (!$lockUser->fetchColumn()) {
            $db->rollBack();
            closureError(401, 'No se pudo validar el usuario del turno.');
        }

        $summary = getCashSummary($db, $empresaId, (int) USER_ID);
        $expectedCash = round($openingAmount + $summary['ventas_efectivo'], 2);
        $difference = round($actualCash - $expectedCash, 2);
        if (abs($difference) >= 0.01 && $justification === '') {
            $db->rollBack();
            closureError(422, 'Registra una justificación cuando el efectivo contado no coincide con el esperado.');
        }

        $insert = $db->prepare(
            'INSERT INTO cierres_caja
                (empresa_id, usuario_id, monto_inicial, efectivo_esperado, efectivo_real,
                 tarjetas_monto, diferencia, justificacion, monto_sistema, monto_real, observaciones)
             VALUES
                (:empresa_id, :usuario_id, :monto_inicial, :efectivo_esperado, :efectivo_real,
                 :tarjetas_monto, :diferencia, :justificacion, :monto_sistema, :monto_real, :observaciones)'
        );
        $insert->execute([
            ':empresa_id' => $empresaId,
            ':usuario_id' => USER_ID,
            ':monto_inicial' => $openingAmount,
            ':efectivo_esperado' => $expectedCash,
            ':efectivo_real' => $actualCash,
            ':tarjetas_monto' => $summary['tarjetas_monto'],
            ':diferencia' => $difference,
            ':justificacion' => $justification !== '' ? $justification : null,
            ':monto_sistema' => $expectedCash,
            ':monto_real' => $actualCash,
            ':observaciones' => $justification !== '' ? $justification : null,
        ]);
        $closeId = (int) $db->lastInsertId();
        $db->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Cierre de turno registrado.',
            'data' => [
                'id' => $closeId,
                'monto_inicial' => $openingAmount,
                'efectivo_esperado' => $expectedCash,
                'efectivo_real' => $actualCash,
                'tarjetas_monto' => $summary['tarjetas_monto'],
                'diferencia' => $difference,
            ],
        ]);
    } catch (PDOException $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        error_log('No se pudo registrar el cierre de caja: ' . $e->getMessage());
        closureError(500, 'No se pudo registrar el cierre. Verifica que la migración esté aplicada e inténtalo nuevamente.');
    }
    exit;
}

closureError(405, 'Método HTTP no permitido.');
