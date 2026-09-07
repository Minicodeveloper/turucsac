<?php
// api/conciliacion.php
require_once __DIR__ . '/config/headers.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/auth_middleware.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        // Historial de cierres
        $query = "SELECT c.*, u.nombre_completo as usuario_nombre 
                  FROM cierres_caja c
                  JOIN usuarios u ON c.usuario_id = u.id
                  ORDER BY c.fecha_cierre DESC";
        $stmt = $db->query($query);
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(["success" => true, "data" => $result]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error DB: " . $e->getMessage()]);
    }

} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $monto_real = $input['monto_real'] ?? 0;
    $observaciones = $input['observaciones'] ?? '';
    $usuario_id = USER_ID;

    try {
        // 1. Calcular lo que el sistema dice que hay (Ventas de HOY o del turno actual)
        // Para simplificar, tomaremos ventas desde el último cierre o del día.
        $qSistema = "SELECT SUM(monto_total) as total FROM ventas WHERE DATE(fecha_venta) = CURDATE()";
        $stmtSis = $db->query($qSistema);
        $monto_sistema = (float)($stmtSis->fetch(PDO::FETCH_ASSOC)['total'] ?? 0);

        $diferencia = (float)$monto_real - $monto_sistema;

        $insert = "INSERT INTO cierres_caja (usuario_id, monto_sistema, monto_real, diferencia, observaciones) 
                   VALUES (:uid, :sis, :real, :dif, :obs)";
        $stmt = $db->prepare($insert);
        $stmt->execute([
            ':uid' => $usuario_id, ':sis' => $monto_sistema, ':real' => $monto_real,
            ':dif' => $diferencia, ':obs' => $observaciones
        ]);

        echo json_encode([
            "success" => true, 
            "message" => "Cierre de caja registrado exitosamente",
            "data" => [
                "sistema" => $monto_sistema,
                "diferencia" => $diferencia
            ]
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error al cerrar caja: " . $e->getMessage()]);
    }
}
?>
