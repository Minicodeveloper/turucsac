<?php
// api/dashboard.php
require_once __DIR__ . '/config/headers.php';
require_once __DIR__ . '/config/database.php';

if (file_exists(__DIR__ . '/config/auth_middleware.php')) {
    @include_once __DIR__ . '/config/auth_middleware.php';
}

$database = new Database();
$db = $database->getConnection();

try {
    // 1. Total Ventas Hoy / Turno
    $ventas_hoy = 0.0;
    try {
        $qHoy = "SELECT COALESCE(SUM(monto_total), 0) as total FROM ventas WHERE DATE(fecha_venta) = CURDATE()";
        $stmtHoy = $db->query($qHoy);
        $ventas_hoy = (float)($stmtHoy->fetch(PDO::FETCH_ASSOC)['total'] ?? 0);

        // Si no hay ventas registradas estrictamente con fecha de hoy, toma el total general acumulado
        if ($ventas_hoy == 0) {
            $qAcum = "SELECT COALESCE(SUM(monto_total), 0) as total FROM ventas";
            $stmtAcum = $db->query($qAcum);
            $ventas_hoy = (float)($stmtAcum->fetch(PDO::FETCH_ASSOC)['total'] ?? 0);
        }
    } catch (Exception $e) {
        try {
            $qAcum = "SELECT COALESCE(SUM(total), 0) as total FROM ventas";
            $stmtAcum = $db->query($qAcum);
            $ventas_hoy = (float)($stmtAcum->fetch(PDO::FETCH_ASSOC)['total'] ?? 0);
        } catch (Exception $e2) {
            $ventas_hoy = 0.0;
        }
    }

    // 2. Total de Transacciones (Comprobantes emitidos)
    $total_ventas_mes = 0;
    try {
        $qTrans = "SELECT COUNT(*) as total FROM ventas";
        $stmtTrans = $db->query($qTrans);
        $total_ventas_mes = (int)($stmtTrans->fetch(PDO::FETCH_ASSOC)['total'] ?? 0);
    } catch (Exception $e) {
        $total_ventas_mes = 0;
    }

    // 3. Stock de Combustibles / Alertas de Tanques
    $stock_critico = [];
    try {
        // Busca en la tabla 'combustibles' o 'inventario'
        $qStock = "SELECT nombre, stock FROM combustibles WHERE stock <= 500 ORDER BY stock ASC";
        $stmtStock = $db->query($qStock);
        $stock_critico = $stmtStock->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        try {
            $qStock = "SELECT nombre, stock FROM productos WHERE categoria = 'combustible' AND stock <= 500";
            $stmtStock = $db->query($qStock);
            $stock_critico = $stmtStock->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e2) {
            $stock_critico = [];
        }
    }

    // 4. Ventas Semanales (Día a Día)
    $ventas_semanales = [];
    $diasNombres = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    try {
        $qSemana = "SELECT DAYOFWEEK(fecha_venta) as dia_num, COALESCE(SUM(monto_total), 0) as total 
                    FROM ventas 
                    WHERE fecha_venta >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) 
                    GROUP BY DAYOFWEEK(fecha_venta)";
        $stmtSemana = $db->query($qSemana);
        $rows = $stmtSemana->fetchAll(PDO::FETCH_ASSOC);

        if (!empty($rows)) {
            foreach ($rows as $r) {
                $idx = ((int)$r['dia_num']) - 1;
                $ventas_semanales[] = [
                    "dia" => $diasNombres[$idx] ?? 'Día',
                    "total" => (float)$r['total']
                ];
            }
        } else {
            // Genera los días estándar con el valor de ventas actual en el último punto
            $ventas_semanales = [
                ["dia" => "Lun", "total" => 0],
                ["dia" => "Mar", "total" => 0],
                ["dia" => "Mié", "total" => $ventas_hoy],
                ["dia" => "Jue", "total" => 0],
                ["dia" => "Vie", "total" => 0],
                ["dia" => "Sáb", "total" => 0],
                ["dia" => "Dom", "total" => 0]
            ];
        }
    } catch (Exception $e) {
        $ventas_semanales = [
            ["dia" => "Lun", "total" => 0],
            ["dia" => "Mar", "total" => 0],
            ["dia" => "Mié", "total" => $ventas_hoy],
            ["dia" => "Jue", "total" => 0],
            ["dia" => "Vie", "total" => 0],
            ["dia" => "Sáb", "total" => 0],
            ["dia" => "Dom", "total" => 0]
        ];
    }

    header('Content-Type: application/json');
    echo json_encode([
        "success" => true,
        "data" => [
            "ventas_hoy" => $ventas_hoy,
            "total_ventas_mes" => $total_ventas_mes,
            "stock_critico" => $stock_critico,
            "ventas_semanales" => $ventas_semanales
        ]
    ]);

} catch (Exception $e) {
    header('Content-Type: application/json');
    echo json_encode([
        "success" => true,
        "data" => [
            "ventas_hoy" => 0.0,
            "total_ventas_mes" => 0,
            "stock_critico" => [],
            "ventas_semanales" => []
        ],
        "warning" => $e->getMessage()
    ]);
}
?>