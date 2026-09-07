<?php
// api/compras.php
require_once __DIR__ . '/config/headers.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/auth_middleware.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $query = "SELECT c.*, b.nombre_producto, u.nombre_completo as usuario_nombre 
                  FROM compras c
                  JOIN combustibles b ON c.combustible_id = b.id
                  LEFT JOIN usuarios u ON c.usuario_id = u.id
                  ORDER BY c.fecha_compra DESC";
        $stmt = $db->query($query);
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(["success" => true, "data" => $result]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error DB: " . $e->getMessage()]);
    }

} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $combustible_id = $input['combustible_id'] ?? null;
    $cantidad = $input['cantidad_galones'] ?? 0;
    $precio = $input['precio_compra'] ?? 0;
    $proveedor = $input['proveedor'] ?? 'PETROPERU';
    $nro_factura = $input['nro_factura'] ?? '';
    $placa = $input['placa_cisterna'] ?? '';
    $usuario_id = USER_ID;

    if (!$combustible_id || $cantidad <= 0) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Datos de compra incompletos"]);
        exit;
    }

    $monto_total = $cantidad * $precio;

    try {
        $db->beginTransaction();

        // 1. Insertar compra
        $query = "INSERT INTO compras (combustible_id, cantidad_galones, precio_compra, monto_total, proveedor, nro_factura, placa_cisterna, usuario_id) 
                  VALUES (:cid, :cant, :prec, :total, :prov, :fac, :placa, :uid)";
        $stmt = $db->prepare($query);
        $stmt->execute([
            ':cid' => $combustible_id, ':cant' => $cantidad, ':prec' => $precio,
            ':total' => $monto_total, ':prov' => $proveedor, ':fac' => $nro_factura,
            ':placa' => $placa, ':uid' => $usuario_id
        ]);

        // 2. Obtener stock actual
        $stmtStock = $db->prepare("SELECT stock_galones FROM combustibles WHERE id = :id FOR UPDATE");
        $stmtStock->execute([':id' => $combustible_id]);
        $comb = $stmtStock->fetch(PDO::FETCH_ASSOC);
        $stock_anterior = (float)$comb['stock_galones'];
        $stock_actual = $stock_anterior + (float)$cantidad;

        // 3. Actualizar stock
        $updStock = $db->prepare("UPDATE combustibles SET stock_galones = :stock WHERE id = :id");
        $updStock->execute([':stock' => $stock_actual, ':id' => $combustible_id]);

        // 4. Registrar en Kardex
        $insKardex = $db->prepare("INSERT INTO movimientos_kardex (combustible_id, tipo_movimiento, cantidad, stock_anterior, stock_actual, descripcion, usuario_id) 
                                   VALUES (:cid, 'ENTRADA', :cant, :ant, :act, :desc, :uid)");
        $insKardex->execute([
            ':cid' => $combustible_id, ':cant' => $cantidad, ':ant' => $stock_anterior,
            ':act' => $stock_actual, ':desc' => "Abastecimiento factura $nro_factura - $proveedor",
            ':uid' => $usuario_id
        ]);

        $db->commit();
        echo json_encode(["success" => true, "message" => "Compra registrada y stock actualizado"]);

    } catch (PDOException $e) {
        if ($db->inTransaction()) $db->rollBack();
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error Transaccional: " . $e->getMessage()]);
    }
}
?>
