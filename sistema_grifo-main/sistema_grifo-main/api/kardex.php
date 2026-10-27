<?php
// api/kardex.php
require_once __DIR__ . '/config/headers.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/auth_middleware.php';

$database = new Database();
$db = $database->getConnection();

$combustible_id = $_GET['combustible_id'] ?? null;
$empresaId = USER_EMPRESA_ID ? (int) USER_EMPRESA_ID : null;
$role = strtoupper((string) USER_ROL);

if (!in_array($role, ['SUPER_ADMIN', 'ADMIN', 'ADMIN_EMPRESA', 'SUPERVISOR'], true)) {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Tu rol no tiene permiso para consultar el kardex."]);
    exit;
}
if (!$combustible_id || !$empresaId) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Falta el producto o la empresa activa."]);
    exit;
}

try {
    $query = "SELECT k.*, u.nombre_completo as usuario_nombre 
              FROM movimientos_kardex k
              LEFT JOIN usuarios u ON k.usuario_id = u.id
              WHERE k.combustible_id = :cid AND k.empresa_id = :empresa_id
              ORDER BY k.fecha_movimiento DESC
              LIMIT 50";
    
    $stmt = $db->prepare($query);
    $stmt->execute([':cid' => $combustible_id, ':empresa_id' => $empresaId]);
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
