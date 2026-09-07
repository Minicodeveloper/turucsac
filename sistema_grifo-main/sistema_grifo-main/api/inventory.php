<?php
// api/inventory.php
require_once __DIR__ . '/config/headers.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/auth_middleware.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Listar todos los combustibles y su stock
    try {
        $query = "SELECT id, nombre_producto, precio_por_galon, estado, stock_galones FROM combustibles ORDER BY nombre_producto ASC";
        $stmt = $db->query($query);
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "success" => true,
            "data" => $result
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error DB: " . $e->getMessage()]);
    }
} elseif ($method === 'POST' || $method === 'PUT') {
    // Solo administradores pueden realizar cambios en el inventario o precios
    if (USER_ROL !== 'admin') {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Acceso prohibido. Solo el administrador puede ajustar stock o precios."]);
        exit;
    }

    // Actualizar precio y stock
    $inputJSON = file_get_contents('php://input');
    $input = json_decode($inputJSON, TRUE);

    $id = $input['id'] ?? null;
    $precio = $input['precio_por_galon'] ?? null;
    $stock = $input['stock_galones'] ?? null;
    $estado = $input['estado'] ?? 1;

    // Solo actualizamos si nos pasan el ID
    if ($id) {
        try {
            $db->beginTransaction();

            // 1. Obtener stock anterior
            $stmtS = $db->prepare("SELECT stock_galones FROM combustibles WHERE id = :id FOR UPDATE");
            $stmtS->execute([':id' => $id]);
            $old_stock = (float)$stmtS->fetch(PDO::FETCH_ASSOC)['stock_galones'];
            
            // 2. Determinar diferencia y tipo de movimiento
            $new_stock = (float)$stock;
            $diff = $new_stock - $old_stock;
            $tipo = 'AJUSTE';
            if ($diff > 0) $tipo = 'ENTRADA';
            if ($diff < 0) $tipo = 'SALIDA';

            // 3. Actualizar producto
            $update = "UPDATE combustibles SET 
                        precio_por_galon = :precio, 
                        stock_galones = :stock, 
                        estado = :estado 
                       WHERE id = :id";
            $stmt = $db->prepare($update);
            $stmt->bindParam(':precio', $precio);
            $stmt->bindParam(':stock', $stock);
            $stmt->bindParam(':estado', $estado);
            $stmt->bindParam(':id', $id);

            if ($stmt->execute()) {
                // 4. Registrar en Kardex si hubo cambio de stock
                if (abs($diff) > 0.0001) {
                    $insertKardex = "INSERT INTO movimientos_kardex (combustible_id, tipo_movimiento, cantidad, stock_anterior, stock_actual, descripcion, usuario_id) 
                                     VALUES (:cid, :tipo, :cant, :ant, :act, :desc, :uid)";
                    $stmtKardex = $db->prepare($insertKardex);
                    $descKardex = "Ajuste manual de inventario";
                    $uid = defined('USER_ID') ? USER_ID : null;

                    $stmtKardex->execute([
                        ':cid' => $id,
                        ':tipo' => $tipo,
                        ':cant' => abs($diff),
                        ':ant' => $old_stock,
                        ':act' => $new_stock,
                        ':desc' => $descKardex,
                        ':uid' => $uid
                    ]);
                }

                $db->commit();
                echo json_encode([
                    "success" => true,
                    "message" => "Producto petrolífero actualizado y auditeado en el Kardex"
                ]);
            } else {
                $db->rollBack();
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Ocurrió un error al actualizar los datos."]);
            }

        } catch (PDOException $e) {
            $db->rollBack();
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Error DB: " . $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Falta especificar el ID del producto."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método HTTP no soportado"]);
}
?>
