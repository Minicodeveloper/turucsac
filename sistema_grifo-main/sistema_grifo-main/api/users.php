<?php
// api/users.php
require_once __DIR__ . '/config/headers.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/auth_middleware.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $query = "SELECT id, nro_documento, nombre_completo, rol, created_at FROM usuarios ORDER BY nombre_completo ASC";
        $stmt = $db->query($query);
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "success" => true,
            "data" => $result
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error al cargar la lista de usuarios."]);
    }
} elseif ($method === 'POST') {
    // Solo administradores pueden crear usuarios
    if (USER_ROL !== 'admin') {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Acceso prohibido. Se requiere rol de administrador."]);
        exit;
    }

    $inputJSON = file_get_contents('php://input');
    $input = json_decode($inputJSON, TRUE);

    $nro = $input['nro_documento'] ?? null;
    $nombre = $input['nombre_completo'] ?? null;
    $password = $input['password'] ?? null;
    $rol = $input['rol'] ?? 'cajero';

    if ($nro && $nombre && $password) {
        try {
            // Verificar si existe el DNI
            $check = $db->prepare("SELECT id FROM usuarios WHERE nro_documento = :dni");
            $check->execute([':dni' => $nro]);
            if ($check->rowCount() > 0) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "El número de documento ya está registrado."]);
                exit;
            }

            $hash = password_hash($password, PASSWORD_BCRYPT);
            
            $insert = "INSERT INTO usuarios (nro_documento, password_hash, nombre_completo, rol) VALUES (:dni, :hash, :nombre, :rol)";
            $stmt = $db->prepare($insert);
            
            if ($stmt->execute([':dni' => $nro, ':hash' => $hash, ':nombre' => $nombre, ':rol' => $rol])) {
                echo json_encode([
                    "success" => true,
                    "message" => "Usuario creado exitosamente"
                ]);
            } else {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "No se pudo crear el usuario."]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Error al guardar el usuario."]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Faltan datos obligatorios."]);
    }
} elseif ($method === 'DELETE') {
    // Solo administradores pueden eliminar usuarios
    if (USER_ROL !== 'admin') {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Acceso prohibido."]);
        exit;
    }

    $id = $_GET['id'] ?? null;
    if (!$id || $id == 1) { // Protegemos al admin inicial ID 1
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "ID inválido o usuario protegido."]);
        exit;
    }

    try {
        $stmt = $db->prepare("DELETE FROM usuarios WHERE id = :id");
        if ($stmt->execute([':id' => $id])) {
            echo json_encode(["success" => true, "message" => "Usuario eliminado."]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error al eliminar: El usuario tiene registros vinculados."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método HTTP no soportado"]);
}
?>
