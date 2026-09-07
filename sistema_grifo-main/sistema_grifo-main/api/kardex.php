<?php
// api/kardex.php
require_once __DIR__ . '/config/headers.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/auth_middleware.php';

$database = new Database();
$db = $database->getConnection();

$combustible_id = $_GET['combustible_id'] ?? null;

if (!$combustible_id) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Falta combustible_id"]);
    exit;
}

try {
    $query = "SELECT k.*, u.nombre_completo as usuario_nombre 
              FROM movimientos_kardex k
              LEFT JOIN usuarios u ON k.usuario_id = u.id
              WHERE k.combustible_id = :cid
              ORDER BY k.fecha_movimiento DESC
              LIMIT 50";
    
    $stmt = $db->prepare($query);
    $stmt->execute([':cid' => $combustible_id]);
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "data" => $result
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error DB: " . $e->getMessage()]);
}
?>
