<?php
// api/dashboard.php
require_once __DIR__ . '/config/headers.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/auth_middleware.php';

$database = new Database();
$db = $database->getConnection();

try {
    // 1. Ventas de Hoy
    $queryHoy = "SELECT SUM(monto_total) as total FROM ventas WHERE DATE(fecha_operacion) = CURDATE()";
    $stmtHoy = $db->query($queryHoy);
    $ventas_hoy = (float)($stmtHoy->fetch(PDO::FETCH_ASSOC)['total'] ?? 0);

    // 2. Transacciones del Mes
    $queryMes = "SELECT COUNT(*) as total FROM ventas WHERE MONTH(fecha_operacion) = MONTH(CURRENT_DATE()) AND YEAR(fecha_operacion) = YEAR(CURRENT_DATE())";
    $stmtMes = $db->query($queryMes);
    $total_ventas_mes = (int)($stmtMes->fetch(PDO::FETCH_ASSOC)['total'] ?? 0);

    // 3. Stock Crítico (< 500 galones)
    $queryStock = "SELECT nombre_producto as nombre, stock_galones as stock FROM combustibles WHERE stock_galones < 500 AND estado = 1";
    $stmtStock = $db->query($queryStock);
    $stock_critico = $stmtStock->fetchAll(PDO::FETCH_ASSOC);

    // 4. Ventas Semanales (Gráfico)
    $querySemana = "SELECT 
                        DATE_FORMAT(fecha_operacion, '%d/%m') as dia, 
                        SUM(monto_total) as total 
                    FROM ventas 
                    WHERE fecha_operacion >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                    GROUP BY DATE(fecha_operacion)
                    ORDER BY fecha_operacion ASC";
    $stmtSemana = $db->query($querySemana);
    $ventas_semanales = $stmtSemana->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "data" => [
            "ventas_hoy" => $ventas_hoy,
            "total_ventas_mes" => $total_ventas_mes,
            "stock_critico" => $stock_critico,
            "ventas_semanales" => $ventas_semanales
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error DB: " . $e->getMessage()]);
}
?>
