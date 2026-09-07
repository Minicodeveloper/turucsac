<?php
// api/gym_planes.php
require_once __DIR__ . '/config/headers.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/auth_middleware.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $query = "SELECT * FROM gym_planes ORDER BY precio ASC";
        $stmt = $db->query($query);
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["success" => true, "data" => $result]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $nombre = $input['nombre'] ?? '';
    $precio = $input['precio'] ?? 0;
    $duracion = $input['duracion_dias'] ?? 30;
    $desc = $input['descripcion'] ?? '';

    if (!$nombre || $precio <= 0) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Nombre y precio son obligatorios"]);
        exit;
    }

    try {
        $query = "INSERT INTO gym_planes (nombre, precio, duracion_dias, descripcion) VALUES (:nom, :pre, :dur, :des)";
        $stmt = $db->prepare($query);
        $stmt->execute([':nom' => $nombre, ':pre' => $precio, ':dur' => $duracion, ':des' => $desc]);
        echo json_encode(["success" => true, "message" => "Plan creado correctamente"]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
} elseif ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "ID de plan requerido"]);
        exit;
    }

    try {
        $query = "UPDATE gym_planes SET nombre = :nom, precio = :pre, duracion_dias = :dur, descripcion = :des, estado = :est WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->execute([
            ':nom' => $input['nombre'],
            ':pre' => $input['precio'],
            ':dur' => $input['duracion_dias'],
            ':des' => $input['descripcion'],
            ':est' => $input['estado'] ?? 1,
            ':id' => $id
        ]);
        echo json_encode(["success" => true, "message" => "Plan actualizado"]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
}
?>
