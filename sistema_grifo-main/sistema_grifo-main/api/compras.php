<?php
// api/compras.php
require_once __DIR__ . '/config/headers.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/auth_middleware.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$empresaId = USER_EMPRESA_ID ? (int) USER_EMPRESA_ID : null;
$role = strtoupper((string) USER_ROL);

if (!$empresaId) {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Tu usuario no tiene una empresa operativa asignada."]);
    exit;
}

if ($method === 'GET') {
    if (!in_array($role, ['SUPER_ADMIN', 'ADMIN', 'ADMIN_EMPRESA', 'SUPERVISOR'], true)) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Tu rol no tiene permiso para consultar compras."]);
        exit;
    }
    try {
        $query = "SELECT c.*, b.nombre_producto, u.nombre_completo as usuario_nombre 
                  FROM compras c
                  JOIN combustibles b ON c.combustible_id = b.id
                  LEFT JOIN usuarios u ON c.usuario_id = u.id
                  WHERE c.empresa_id = :empresa_id
                  ORDER BY c.fecha_compra DESC";
        $stmt = $db->prepare($query);
        $stmt->execute([':empresa_id' => $empresaId]);
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(["success" => true, "data" => $result]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error DB: " . $e->getMessage()]);
    }

} elseif ($method === 'POST') {
    if (!in_array($role, ['SUPER_ADMIN', 'ADMIN_EMPRESA', 'SUPERVISOR'], true)) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Tu rol no tiene permiso para registrar compras."]);
        exit;
    }
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
        $query = "INSERT INTO compras (empresa_id, combustible_id, cantidad_galones, precio_compra, monto_total, proveedor, nro_factura, placa_cisterna, usuario_id) 
                  VALUES (:empresa_id, :cid, :cant, :prec, :total, :prov, :fac, :placa, :uid)";
        $stmt = $db->prepare($query);
        $stmt->execute([
            ':empresa_id' => $empresaId,
            ':cid' => $combustible_id, ':cant' => $cantidad, ':prec' => $precio,
            ':total' => $monto_total, ':prov' => $proveedor, ':fac' => $nro_factura,
            ':placa' => $placa, ':uid' => $usuario_id
        ]);

        // 2. Obtener stock actual
        $stmtStock = $db->prepare("SELECT stock_galones FROM combustibles WHERE id = :id AND empresa_id = :empresa_id FOR UPDATE");
        $stmtStock->execute([':id' => $combustible_id, ':empresa_id' => $empresaId]);
        $comb = $stmtStock->fetch(PDO::FETCH_ASSOC);
        if (!$comb) {
            throw new RuntimeException("El combustible seleccionado no pertenece al inventario de tu empresa.");
        }
        $stock_anterior = (float)$comb['stock_galones'];
        $stock_actual = $stock_anterior + (float)$cantidad;

        // 3. Actualizar stock
        $updStock = $db->prepare("UPDATE combustibles SET stock_galones = :stock WHERE id = :id AND empresa_id = :empresa_id");
        $updStock->execute([':stock' => $stock_actual, ':id' => $combustible_id, ':empresa_id' => $empresaId]);

        // 4. Registrar en Kardex
        $insKardex = $db->prepare("INSERT INTO movimientos_kardex (empresa_id, combustible_id, tipo_movimiento, cantidad, stock_anterior, stock_actual, descripcion, usuario_id) 
                                   VALUES (:empresa_id, :cid, 'ENTRADA', :cant, :ant, :act, :desc, :uid)");
        $insKardex->execute([
            ':empresa_id' => $empresaId,
            ':cid' => $combustible_id, ':cant' => $cantidad, ':ant' => $stock_anterior,
            ':act' => $stock_actual, ':desc' => "Abastecimiento factura $nro_factura - $proveedor",
            ':uid' => $usuario_id
        ]);

        $db->commit();
        echo json_encode(["success" => true, "message" => "Compra registrada y stock actualizado"]);

    } catch (Throwable $e) {
        if ($db->inTransaction()) $db->rollBack();
        error_log('Error al registrar compra: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "No se pudo registrar la compra. Verifica los datos del inventario de tu empresa."]);
    }
}
?>
