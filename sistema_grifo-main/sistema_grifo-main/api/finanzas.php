<?php
require_once __DIR__ . '/config/headers.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/auth_middleware.php';

$db = (new Database())->getConnection();
$role = strtoupper((string) USER_ROL);
$isSuperAdmin = $role === 'SUPER_ADMIN' || $role === 'ADMIN';
$empresaId = USER_EMPRESA_ID ? (int) USER_EMPRESA_ID : null;

if (!in_array($role, ['SUPER_ADMIN', 'ADMIN', 'ADMIN_EMPRESA'], true)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Tu rol no tiene permiso para consultar finanzas.']);
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
    $sales = $db->prepare(
        "SELECT COALESCE(SUM(monto_total), 0) AS total FROM ventas
         WHERE (anulacion_estado IS NULL OR anulacion_estado <> 'ANULADO'){$tenantClause}"
    );
    $sales->execute($params);
    $ingresos = (float) $sales->fetchColumn();

    $purchases = $db->prepare("SELECT COALESCE(SUM(monto_total), 0) FROM compras WHERE 1 = 1{$tenantClause}");
    $purchases->execute($params);
    $egresosCompras = (float) $purchases->fetchColumn();

    $expenses = $db->prepare("SELECT COALESCE(SUM(monto), 0) FROM gastos WHERE 1 = 1{$tenantClause}");
    $expenses->execute($params);
    $egresosGastos = (float) $expenses->fetchColumn();

    $paymentMethods = $db->prepare(
        "SELECT metodo_pago AS label, COALESCE(SUM(monto_total), 0) AS value FROM ventas
         WHERE (anulacion_estado IS NULL OR anulacion_estado <> 'ANULADO'){$tenantClause}
         GROUP BY metodo_pago"
    );
    $paymentMethods->execute($params);
    $methods = $paymentMethods->fetchAll(PDO::FETCH_ASSOC);

    $egresos = $egresosCompras + $egresosGastos;
    echo json_encode([
        'success' => true,
        'data' => [
            'ingresos' => $ingresos,
            'egresos' => $egresos,
            'balance' => $ingresos - $egresos,
            'detalle_egresos' => ['compras' => $egresosCompras, 'gastos' => $egresosGastos],
            'metodos_pago' => $methods,
        ],
    ]);
} catch (PDOException $e) {
    error_log('Error al consultar finanzas: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'No se pudieron cargar las finanzas de la empresa. Verifica la migración multiempresa.']);
}
