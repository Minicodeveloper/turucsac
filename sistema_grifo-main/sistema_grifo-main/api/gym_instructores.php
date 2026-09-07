<?php
// api/gym_instructores.php
require_once __DIR__ . '/config/headers.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/auth_middleware.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $db->query("SELECT * FROM gym_instructores ORDER BY nombre_completo ASC");
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Formatear para el frontend (activo boolean)
        foreach ($result as &$inst) {
            $inst['activo'] = (bool)$inst['estado'];
        }
        
        echo json_encode(["success" => true, "data" => $result]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $dni = $input['nro_documento'] ?? '';
    $nom = $input['nombre_completo'] ?? '';
    $esp = $input['especialidad'] ?? '';
    $tur = $input['turno'] ?? 'Mañana';
    $tel = $input['telefono'] ?? '';
    $ema = $input['email'] ?? '';

    if (!$dni || !$nom) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "DNI y Nombre son obligatorios"]);
        exit;
    }

    try {
        $query = "INSERT INTO gym_instructores (nro_documento, nombre_completo, especialidad, turno, telefono, email, estado) 
                  VALUES (:dni, :nom, :esp, :tur, :tel, :ema, 1)";
        $stmt = $db->prepare($query);
        $stmt->execute([
            ':dni' => $dni,
            ':nom' => $nom,
            ':esp' => $esp,
            ':tur' => $tur,
            ':tel' => $tel,
            ':ema' => $ema
        ]);
        echo json_encode(["success" => true, "message" => "Instructor registrado con éxito"]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "DNI duplicado o error en base de datos"]);
    }
} elseif ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "ID requerido"]);
        exit;
    }

    try {
        $query = "UPDATE gym_instructores SET 
                  nombre_completo = :nom, 
                  nro_documento = :dni,
                  especialidad = :esp, 
                  turno = :tur, 
                  telefono = :tel, 
                  email = :ema, 
                  estado = :est 
                  WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->execute([
            ':nom' => $input['nombre_completo'],
            ':dni' => $input['nro_documento'],
            ':esp' => $input['especialidad'],
            ':tur' => $input['turno'],
            ':tel' => $input['telefono'],
            ':ema' => $input['email'],
            ':est' => isset($input['activo']) ? ($input['activo'] ? 1 : 0) : ($input['estado'] ?? 1),
            ':id' => $id
        ]);
        echo json_encode(["success" => true, "message" => "Instructor actualizado"]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
} elseif ($method === 'DELETE') {
    // Borrado lógico como solicitó el usuario
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "ID requerido"]);
        exit;
    }

    try {
        $stmt = $db->prepare("UPDATE gym_instructores SET estado = 0 WHERE id = :id");
        $stmt->execute([':id' => $id]);
        echo json_encode(["success" => true, "message" => "Instructor marcado como inactivo"]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error al desactivar instructor"]);
    }
}
?>
