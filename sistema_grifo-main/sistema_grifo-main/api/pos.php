<?php
// api/pos.php
require_once __DIR__ . '/config/headers.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/auth_middleware.php';

$database = new Database();
$db = $database->getConnection();

$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'prices') {
        try {
            // Extraer Combustibles y sus Precios desde la Base de Datos
            $query = "SELECT id, nombre_producto, precio_por_galon FROM combustibles WHERE estado = 1";
            $stmt = $db->prepare($query);
            $stmt->execute();
            
            $precios = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                // Formateamos como el Key/Value pair que espera Vue / Vanilla JS ('Gasolina 84': 15.20)
                $precios[$row['nombre_producto']] = (float)$row['precio_por_galon'];
            }
            
            http_response_code(200);
            echo json_encode([
                "success" => true,
                "data" => $precios,
                "message" => "Precios cargados desde MySQL"
            ]);
        } catch (PDOException $e) {
             http_response_code(500);
             echo json_encode(["success" => false, "message" => "Error al obtener los precios de combustible."]);
        }
    } else {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Endpoint no encontrado"]);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($action === 'sale') {
        $inputJSON = file_get_contents('php://input');
        $saleData = json_decode($inputJSON, TRUE);
        
        $monto = $saleData['monto'] ?? 0;
        $combustible_nombre = $saleData['combustible'] ?? '';
        $galones = $saleData['galones'] ?? 0;
        $cliente_dni = $saleData['cliente_dni'] ?? '00000000';
        $placa = $saleData['placa'] ?? '';
        $metodo_pago = $saleData['metodo_pago'] ?? 'Efectivo';
        $tipo_comprobante = $saleData['tipo_comprobante'] ?? 'Boleta';
        
        if ($monto > 0 && !empty($combustible_nombre)) {
            try {
                // 1. Obtener el ID del Combustible basándonos en su nombre
                $queryComb = "SELECT id FROM combustibles WHERE nombre_producto = :nombre LIMIT 1";
                $stmtComb = $db->prepare($queryComb);
                $stmtComb->bindParam(':nombre', $combustible_nombre);
                $stmtComb->execute();
                
                if($row = $stmtComb->fetch(PDO::FETCH_ASSOC)) {
                    $combustible_id = $row['id'];
                    $ticket_id = "TKT-" . date('Ymd-His-') . rand(1000, 9999);
                    
                    $db->beginTransaction();
                    
                    // 2. Insertar o buscar cliente
                    $cId = 1;
                    if($cliente_dni !== '00000000' && !empty($cliente_dni)){
                        $cleanDni = preg_replace('/[^0-9]/', '', $cliente_dni);
                        $stmtCheck = $db->prepare("INSERT IGNORE INTO clientes (documento, razon_social, direccion) VALUES (:dni, 'N/A', '')");
                        $stmtCheck->execute([':dni' => $cleanDni]);
                        
                        $stmtC = $db->prepare("SELECT id FROM clientes WHERE documento = :dni LIMIT 1");
                        $stmtC->execute([':dni' => $cleanDni]);
                        if($rowC = $stmtC->fetch(PDO::FETCH_ASSOC)){
                            $cId = $rowC['id'];
                        }
                    }

                    // 3. Insertar venta
                    $insertVenta = "INSERT INTO ventas (ticket_id, combustible_id, galones, monto_total, cliente_id, placa, metodo_pago, tipo_comprobante) 
                                    VALUES (:ticket, :cid, :gal, :monto, :clid, :placa, :pago, :comp)";
                    $stmtVenta = $db->prepare($insertVenta);
                    $stmtVenta->bindParam(':ticket', $ticket_id);
                    $stmtVenta->bindParam(':cid', $combustible_id);
                    $stmtVenta->bindParam(':gal', $galones);
                    $stmtVenta->bindParam(':monto', $monto);
                    $stmtVenta->bindParam(':clid', $cId);
                    $stmtVenta->bindParam(':placa', $placa);
                    $stmtVenta->bindParam(':pago', $metodo_pago);
                    $stmtVenta->bindParam(':comp', $tipo_comprobante);
                    
                    if($stmtVenta->execute()){
                        // 3. Obtener stock actual antes de deducir
                        $stmtS = $db->prepare("SELECT stock_galones FROM combustibles WHERE id = :cid FOR UPDATE");
                        $stmtS->execute([':cid' => $combustible_id]);
                        $stock_anterior = (float)$stmtS->fetch(PDO::FETCH_ASSOC)['stock_galones'];
                        $stock_actual = $stock_anterior - (float)$galones;

                        // 4. Deducir stock del inventario
                        $updateStock = "UPDATE combustibles SET stock_galones = :new_stock WHERE id = :cid";
                        $stmtUpdate = $db->prepare($updateStock);
                        $stmtUpdate->bindParam(':new_stock', $stock_actual);
                        $stmtUpdate->bindParam(':cid', $combustible_id);
                        $stmtUpdate->execute();

                        // 5. Registrar movimiento en Kardex
                        $insertKardex = "INSERT INTO movimientos_kardex (combustible_id, tipo_movimiento, cantidad, stock_anterior, stock_actual, descripcion, usuario_id) 
                                         VALUES (:cid, 'SALIDA', :cant, :ant, :act, :desc, :uid)";
                        $stmtKardex = $db->prepare($insertKardex);
                        $descKardex = "Venta Ticket: $ticket_id";
                        $uid = defined('USER_ID') ? USER_ID : null; // Asumiendo que USER_ID viene del middleware

                        $stmtKardex->execute([
                            ':cid' => $combustible_id,
                            ':cant' => $galones,
                            ':ant' => $stock_anterior,
                            ':act' => $stock_actual,
                            ':desc' => $descKardex,
                            ':uid' => $uid
                        ]);

                        $db->commit();

                        // Simulación de Firma Digital (SUNAT/OSE)
                        $hash = bin2hex(random_bytes(32));
                        $signature = base64_encode(hash('sha256', $ticket_id . $hash, true));
                        
                        http_response_code(200);
                        echo json_encode([
                            "success" => true,
                            "ticket_id" => $ticket_id,
                            "sunat" => [
                                "hash" => $hash,
                                "signature" => substr($signature, 0, 40),
                                "ose_status" => "ACEPTADO",
                                "ose_message" => "Comprobante validado correctamente por OSE-TURUCSAC"
                            ],
                            "message" => "Venta grabada y KARDEX deducido exitosamente"
                        ]);
                    } else {
                        $db->rollBack();
                        http_response_code(500);
                        echo json_encode(["success" => false, "message" => "Error escribiendo en base de datos"]);
                    }
                } else {
                    http_response_code(400);
                    echo json_encode(["success" => false, "message" => "Combustible no reconocido en Base de datos"]);
                }

            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Error al procesar la venta en la base de datos."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Datos de venta inválidos"]);
        }
    } else {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Endpoint HTTP POST no encontrado"]);
    }
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
}
?>
