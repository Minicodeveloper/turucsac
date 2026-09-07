<?php
// api/config/auth_middleware.php

require_once __DIR__ . '/database.php';

// Obtener cabeceras
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

if (strpos($authHeader, 'Bearer ') === 0) {
    $token = substr($authHeader, 7);
} else {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Acceso denegado. Token no proporcionado."]);
    exit();
}

$database = new Database();
$db = $database->getConnection();

try {
    // Verificar token y expiración
    $query = "SELECT id, nro_documento, nombre_completo, rol FROM usuarios 
              WHERE token = :token AND token_expiry > NOW() LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':token', $token);
    $stmt->execute();

    if ($user = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // Token válido. Opcionalmente guardar info del usuario en una variable global o constante
        define('USER_ID', $user['id']);
        define('USER_ROL', $user['rol']);
        define('USER_NAME', $user['nombre_completo']);
    } else {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Token inválido o expirado."]);
        exit();
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error de autenticación: " . $e->getMessage()]);
    exit();
}
?>
