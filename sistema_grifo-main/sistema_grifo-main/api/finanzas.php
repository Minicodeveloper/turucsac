<?php
// api/finanzas.php
require_once __DIR__ . '/config/headers.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/auth_middleware.php';

$database = new Database();
$db = $database->getConnection();

try {
    // 1. Ingresos Totales (Ventas)
    $qIngresos = "SELECT SUM(monto_total) as total FROM ventas";
    $stmtIng = $db->query($qIngresos);
    $ingresos = (float)($stmtIng->fetch(PDO::FETCH_ASSOC)['total'] ?? 0);

    // 2. Egresos por Compras
    $qCompras = "SELECT SUM(monto_total) as total FROM compras";
    $stmtComp = $db->query($qCompras);
    $egresos_compras = (float)($stmtComp->fetch(PDO::FETCH_ASSOC)['total'] ?? 0);

    // 3. Egresos por Gastos Operativos
    $qGastos = "SELECT SUM(monto) as total FROM gastos";
    $stmtGastos = $db->query($qGastos);
    $egresos_gastos = (float)($stmtGastos->fetch(PDO::FETCH_ASSOC)['total'] ?? 0);

    $egresos_totales = $egresos_compras + $egresos_gastos;
    $balance = $ingresos - $egresos_totales;

    // 4. Desglose por Método de Pago (Ventas)
    $qMetodo = "SELECT metodo_pago as label, SUM(monto_total) as value FROM ventas GROUP BY metodo_pago";
    $stmtMet = $db->query($qMetodo);
    $metodos = $stmtMet->fetchAll(PDO::FETCH_ASSOC);

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

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error DB: " . $e->getMessage()]);
}
?>
