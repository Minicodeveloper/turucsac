<?php
require_once __DIR__ . '/config/headers.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/auth_middleware.php';

$db = (new Database())->getConnection();
$role = strtoupper((string) USER_ROL);
$isSuperAdmin = $role === 'SUPER_ADMIN' || $role === 'ADMIN';
$empresaId = USER_EMPRESA_ID ? (int) USER_EMPRESA_ID : null;

if (!in_array($role, ['SUPER_ADMIN', 'ADMIN', 'ADMIN_EMPRESA', 'SUPERVISOR'], true)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Tu rol no tiene permiso para consultar el panel.']);
    exit;
}

if (!$isSuperAdmin && !$empresaId) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Tu usuario no tiene una empresa asignada.']);
    exit;
}

$tenantClause = $isSuperAdmin ? '' : ' AND empresa_id = :empresa_id';
$params = $isSuperAdmin ? [] : [':empresa_id' => $empresaId];

try {
    $today = $db->prepare(
        "SELECT COALESCE(SUM(monto_total), 0) FROM ventas
         WHERE DATE(fecha_venta) = CURDATE()
           AND (anulacion_estado IS NULL OR anulacion_estado <> 'ANULADO'){$tenantClause}"
    );
    $today->execute($params);
    $salesToday = (float) $today->fetchColumn();

    $transactions = $db->prepare(
        "SELECT COUNT(*) FROM ventas
         WHERE (anulacion_estado IS NULL OR anulacion_estado <> 'ANULADO'){$tenantClause}"
    );
    $transactions->execute($params);
    $totalTransactions = (int) $transactions->fetchColumn();

    $weekly = $db->prepare(
        "SELECT DATE(fecha_venta) AS fecha, COALESCE(SUM(monto_total), 0) AS total
         FROM ventas
         WHERE fecha_venta >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
           AND (anulacion_estado IS NULL OR anulacion_estado <> 'ANULADO'){$tenantClause}
         GROUP BY DATE(fecha_venta) ORDER BY DATE(fecha_venta)"
    );
    $weekly->execute($params);
    $weeklyRows = $weekly->fetchAll(PDO::FETCH_ASSOC);
    $weeklySales = array_map(
        static fn (array $row): array => [
            'dia' => date('D', strtotime($row['fecha'])),
            'total' => (float) $row['total'],
        ],
        $weeklyRows
    );

    $stock = $db->prepare(
        "SELECT nombre_producto AS nombre, stock_galones AS stock FROM combustibles
         WHERE stock_galones <= 500{$tenantClause} ORDER BY stock_galones ASC"
    );
    $stock->execute($params);

    echo json_encode([
        'success' => true,
        'data' => [
            'ventas_hoy' => $salesToday,
            'total_ventas_mes' => $totalTransactions,
            'stock_critico' => $stock->fetchAll(PDO::FETCH_ASSOC),
            'ventas_semanales' => $weeklySales,
        ],
    ]);
} catch (PDOException $e) {
    error_log('Error al consultar el dashboard: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'No se pudo cargar el panel de la empresa. Verifica la migración multiempresa.']);
}
