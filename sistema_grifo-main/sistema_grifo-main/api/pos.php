<?php
// api/pos.php
require_once __DIR__ . '/config/headers.php';
require_once dirname(__DIR__, 3) . '/config.php';
Config::load();
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/auth_middleware.php';
require_once dirname(__DIR__, 3) . '/FacturacionService.php';

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
        if (!is_array($saleData)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Los datos de venta no son válidos."]);
            exit;
        }
        
        $monto = $saleData['monto'] ?? 0;
        $combustible_nombre = $saleData['combustible'] ?? '';
        $galones = $saleData['galones'] ?? 0;
        $cliente_dni = $saleData['cliente_dni'] ?? '00000000';
        $placa = $saleData['placa'] ?? '';
        $metodo_pago = trim((string) ($saleData['metodo_pago'] ?? $saleData['forma_pago'] ?? 'Efectivo'));
        if ($metodo_pago === '') {
            $metodo_pago = 'Efectivo';
        }
        $tipo_comprobante = $saleData['tipo_comprobante'] ?? 'Boleta';

        if (!in_array($tipo_comprobante, ['Boleta de Venta', 'Factura Electrónica', 'Nota de Venta'], true)) {
            http_response_code(422);
            echo json_encode(["success" => false, "message" => "Tipo de comprobante no válido."]);
            exit;
        }
        
        if ($monto > 0 && $galones > 0 && !empty($combustible_nombre)) {
            try {
                $empresaId = USER_EMPRESA_ID;
                if (!$empresaId) {
                    http_response_code(403);
                    echo json_encode(["success" => false, "message" => "El usuario no tiene una empresa asignada para registrar ventas."]);
                    exit;
                }

                $companyStmt = $db->prepare(
                    "SELECT id, razon_social, ruc, direccion FROM empresas WHERE id = :empresa_id AND estado = 'activo' LIMIT 1"
                );
                $companyStmt->execute([':empresa_id' => $empresaId]);
                $company = $companyStmt->fetch(PDO::FETCH_ASSOC);
                if (!$company) {
                    http_response_code(403);
                    echo json_encode(["success" => false, "message" => "La empresa del usuario no existe o está suspendida."]);
                    exit;
                }

                $sellerStmt = $db->prepare("SELECT id, nro_documento, nombre_completo, rol FROM usuarios WHERE id = :id LIMIT 1");
                $sellerStmt->execute([':id' => USER_ID]);
                $seller = $sellerStmt->fetch(PDO::FETCH_ASSOC);
                if (!$seller) {
                    http_response_code(401);
                    echo json_encode(["success" => false, "message" => "No se pudo validar al usuario que registra la venta."]);
                    exit;
                }

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
                    $insertVenta = "INSERT INTO ventas
                                        (ticket_id, combustible_id, galones, monto_total, cliente_id, placa,
                                         metodo_pago, tipo_comprobante, empresa_id, usuario_id)
                                    VALUES
                                        (:ticket, :cid, :gal, :monto, :clid, :placa,
                                         :pago, :comp, :empresa_id, :usuario_id)";
                    $stmtVenta = $db->prepare($insertVenta);
                    $stmtVenta->execute([
                        ':ticket' => $ticket_id,
                        ':cid' => $combustible_id,
                        ':gal' => $galones,
                        ':monto' => $monto,
                        ':clid' => $cId,
                        ':placa' => $placa,
                        ':pago' => $metodo_pago,
                        ':comp' => $tipo_comprobante,
                        ':empresa_id' => $empresaId,
                        ':usuario_id' => USER_ID,
                    ]);

                    if($stmtVenta->rowCount() > 0){
                        $ventaId = (int) $db->lastInsertId();

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

                        $sunat = [
                            'success' => false,
                            'codigo' => null,
                            'mensaje' => 'Nota de venta interna; no se envió a SUNAT.',
                            'serie' => null,
                            'correlativo' => null,
                            'pdf_disponible' => false,
                        ];

                        if ($tipo_comprobante !== 'Nota de Venta') {
                            $docType = $tipo_comprobante === 'Factura Electrónica' ? '01' : '03';
                            $serie = FacturacionService::resolverSerie(null, $docType);
                            $lockName = substr(
                                'turuc_' . hash('sha256', $empresaId . '|' . $serie),
                                0,
                                64
                            );
                            $lockAcquired = false;
                            $correlativo = null;

                            try {
                                $lockStmt = $db->prepare('SELECT GET_LOCK(:lock_name, 15)');
                                $lockStmt->execute([':lock_name' => $lockName]);
                                $lockAcquired = (int) $lockStmt->fetchColumn() === 1;
                                if (!$lockAcquired) {
                                    throw new RuntimeException('No se pudo reservar el correlativo SUNAT; la venta quedó registrada como pendiente.');
                                }

                                $facturacion = new FacturacionService((int) $empresaId);
                                $correlativo = $facturacion->generarCorrelativo($serie);
                                $updateFolio = $db->prepare(
                                    'UPDATE ventas SET serie = :serie, correlativo = :correlativo WHERE id = :id'
                                );
                                $updateFolio->execute([
                                    ':serie' => $serie,
                                    ':correlativo' => $correlativo,
                                    ':id' => $ventaId,
                                ]);

                                $documentoCliente = preg_replace('/\D/', '', (string) $cliente_dni);
                                $esClienteGenerico = $documentoCliente === '' || $documentoCliente === '00000000';
                                $valorUnitario = round(((float) $monto / 1.18) / (float) $galones, 6);
                                $payload = [
                                    'empresa_id' => (int) $empresaId,
                                    'venta_id' => $ventaId,
                                    'ticket_id' => $ticket_id,
                                    'placa' => strtoupper(trim((string) $placa)),
                                    'medio_pago' => $metodo_pago,
                                    'cajero' => strtoupper(trim((string) $seller['nombre_completo']))
                                        . ' (' . strtoupper(trim((string) $seller['rol'])) . ')',
                                    'serie' => $serie,
                                    'correlativo' => $correlativo,
                                    'cliente' => [
                                        'tipo_doc' => $esClienteGenerico ? '0' : (strlen($documentoCliente) === 11 ? '6' : '1'),
                                        'num_doc' => $esClienteGenerico ? '00000000' : $documentoCliente,
                                        'rzn_social' => $esClienteGenerico
                                            ? 'CLIENTES VARIOS'
                                            : trim((string) ($saleData['cliente_nombre'] ?? '')),
                                    ],
                                    'items' => [[
                                        'codigo' => (string) $combustible_id,
                                        'unidad' => 'GLL',
                                        'cantidad' => (float) $galones,
                                        'descripcion' => $combustible_nombre,
                                        'valor_unitario' => $valorUnitario,
                                    ]],
                                ];

                                $resultado = $docType === '01'
                                    ? $facturacion->emitirFactura($payload)
                                    : $facturacion->emitirBoleta($payload);

                                $sunat = [
                                    'success' => (bool) ($resultado['success'] ?? false),
                                    'codigo' => $resultado['codigo'] ?? null,
                                    'mensaje' => $resultado['mensaje'] ?? 'SUNAT no devolvió una respuesta.',
                                    'pdf_error' => $resultado['pdf_error'] ?? null,
                                    'serie' => $serie,
                                    'correlativo' => $correlativo,
                                    'pdf_disponible' => !empty($resultado['pdf_path']) && is_file($resultado['pdf_path']),
                                ];
                            } catch (Throwable $e) {
                                error_log('Error al emitir comprobante SUNAT: ' . $e->getMessage());
                                $mensajeSunat = substr(
                                    'No se pudo confirmar la emisión SUNAT. Verifique el estado antes de volver a emitir. ' . $e->getMessage(),
                                    0,
                                    255
                                );
                                $updatePendiente = $db->prepare(
                                    'UPDATE ventas SET serie = :serie, correlativo = :correlativo, sunat_codigo = NULL, sunat_mensaje = :mensaje WHERE id = :id'
                                );
                                $updatePendiente->execute([
                                    ':serie' => $serie,
                                    ':correlativo' => $correlativo,
                                    ':mensaje' => $mensajeSunat,
                                    ':id' => $ventaId,
                                ]);
                                $sunat = [
                                    'success' => false,
                                    'codigo' => null,
                                    'mensaje' => $mensajeSunat,
                                    'serie' => $serie,
                                    'correlativo' => $correlativo,
                                    'pdf_disponible' => false,
                                ];
                            } finally {
                                if ($lockAcquired) {
                                    $releaseStmt = $db->prepare('SELECT RELEASE_LOCK(:lock_name)');
                                    $releaseStmt->execute([':lock_name' => $lockName]);
                                }
                            }
                        }
                        
                        http_response_code(200);
                        echo json_encode([
                            "success" => true,
                            "ticket_id" => $ticket_id,
                            "company" => [
                                "razon_social" => $company['razon_social'],
                                "ruc" => $company['ruc'],
                                "direccion" => $company['direccion'],
                            ],
                            "seller" => [
                                "nombre_completo" => $seller['nombre_completo'],
                                "nro_documento" => $seller['nro_documento'],
                                "rol" => $seller['rol'],
                            ],
                            "sunat" => $sunat,
                            "message" => $tipo_comprobante === 'Nota de Venta'
                                ? "Nota de venta guardada; no es un comprobante electrónico SUNAT."
                                : ($sunat['success']
                                    ? "Comprobante aceptado por SUNAT."
                                    : "La venta quedó registrada, pero SUNAT no confirmó la emisión. Revise el estado antes de volver a emitir."),
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
                if ($db->inTransaction()) {
                    $db->rollBack();
                }
                error_log('Error al procesar venta: ' . $e->getMessage());
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
