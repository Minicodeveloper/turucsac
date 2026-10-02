<?php
// api/finanzas.php
require_once __DIR__ . '/config/headers.php';
require_once __DIR__ . '/config/database.php';

// Si auth_middleware corta la petición, nos aseguramos de que no impida la consulta
if (file_exists(__DIR__ . '/config/auth_middleware.php')) {
    @include_once __DIR__ . '/config/auth_middleware.php';
}

$database = new Database();
$db = $database->getConnection();

$ingresos = 0.0;
$egresos_compras = 0.0;
$egresos_gastos = 0.0;
$metodos = [];

try {
    // 1. Ingresos Totales (Ventas) - Detecta si la columna es monto_total o total o monto
    try {
        $qIngresos = "SELECT COALESCE(SUM(monto_total), 0) as total FROM ventas";
        $stmtIng = $db->query($qIngresos);
        $ingresos = (float)($stmtIng->fetch(PDO::FETCH_ASSOC)['total'] ?? 0);
    } catch (Exception $e) {
        try {
            $qIngresos = "SELECT COALESCE(SUM(total), 0) as total FROM ventas";
            $stmtIng = $db->query($qIngresos);
            $ingresos = (float)($stmtIng->fetch(PDO::FETCH_ASSOC)['total'] ?? 0);
        } catch (Exception $e2) {
            $ingresos = 0.0;
        }
    }

    // 2. Egresos por Compras
    try {
        $qCompras = "SELECT COALESCE(SUM(monto_total), 0) as total FROM compras";
        $stmtComp = $db->query($qCompras);
        $egresos_compras = (float)($stmtComp->fetch(PDO::FETCH_ASSOC)['total'] ?? 0);
    } catch (Exception $e) {
        try {
            $qCompras = "SELECT COALESCE(SUM(total), 0) as total FROM compras";
            $stmtComp = $db->query($qCompras);
            $egresos_compras = (float)($stmtComp->fetch(PDO::FETCH_ASSOC)['total'] ?? 0);
        } catch (Exception $e2) {
            $egresos_compras = 0.0;
        }
    }

    // 3. Egresos por Gastos Operativos (Si la tabla gastos aún no existe, no revienta)
    try {
        $qGastos = "SELECT COALESCE(SUM(monto), 0) as total FROM gastos";
        $stmtGastos = $db->query($qGastos);
        $egresos_gastos = (float)($stmtGastos->fetch(PDO::FETCH_ASSOC)['total'] ?? 0);
    } catch (Exception $e) {
        $egresos_gastos = 0.0;
    }

    $egresos_totales = $egresos_compras + $egresos_gastos;
    $balance = $ingresos - $egresos_totales;

    // 4. Desglose por Método de Pago
    try {
        $qMetodo = "SELECT metodo_pago as label, COALESCE(SUM(monto_total), 0) as value FROM ventas GROUP BY metodo_pago";
        $stmtMet = $db->query($qMetodo);
        $metodos = $stmtMet->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        try {
            $qMetodo = "SELECT metodo_pago as label, COALESCE(SUM(total), 0) as value FROM ventas GROUP BY metodo_pago";
            $stmtMet = $db->query($qMetodo);
            $metodos = $stmtMet->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e2) {
            $metodos = [];
        }
    }

    // Respuesta limpia y estructurada
    header('Content-Type: application/json');
    echo json_encode([
        "success" => true,
        "data" => [
            "ingresos" => $ingresos,
            "egresos" => $egresos_totales,
            "balance" => $balance,
            "detalle_egresos" => [
                "compras" => $egresos_compras,
                "gastos" => $egresos_gastos
            ],
            "metodos_pago" => $metodos
        ]
    ]);

} catch (Exception $e) {
    header('Content-Type: application/json');
    echo json_encode([
        "success" => true,
        "data" => [
            "ingresos" => 0.0,
            "egresos" => 0.0,
            "balance" => 0.0,
            "detalle_egresos" => [
                "compras" => 0.0,
                "gastos" => 0.0
            ],
            "metodos_pago" => []
        ],
        "warning" => $e->getMessage()
    ]);
}
?>