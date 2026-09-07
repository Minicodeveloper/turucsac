<?php
// api/sales.php
require_once __DIR__ . '/config/headers.php';
require_once __DIR__ . '/config/auth_middleware.php';
require_once __DIR__ . '/config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $query = "SELECT v.id, v.ticket_id, c.nombre_producto, v.galones, v.monto_total, v.fecha_venta 
                  FROM ventas v
                  JOIN combustibles c ON v.combustible_id = c.id
                  ORDER BY v.fecha_venta DESC 
                  LIMIT 50";
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
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método HTTP no soportado"]);
}
?>
