<?php
// api/layout.php
require_once __DIR__ . '/config/headers.php';
require_once __DIR__ . '/config/auth_middleware.php';

$layout_file = __DIR__ . '/config/layout.json';

// Ensure the config directory exists and layout.json is readable/writable
if (!file_exists(__DIR__ . '/config')) {
    mkdir(__DIR__ . '/config', 0755, true);
}
if (!file_exists($layout_file)) {
    file_put_contents($layout_file, '[]');
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $data = file_get_contents($layout_file);
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "data" => json_decode($data)
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Solo administradores pueden cambiar el layout
    if (defined('USER_ROL') && USER_ROL !== 'admin') {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Acceso denegado. Se requiere rol de administrador."]);
        exit;
    }
    
    $inputJSON = file_get_contents('php://input');
    $data = json_decode($inputJSON, TRUE);
    
    if (isset($data['layout'])) {
        $jsonStr = json_encode($data['layout'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        if(file_put_contents($layout_file, $jsonStr) !== false) {
            http_response_code(200);
            echo json_encode(["success" => true, "message" => "Layout actualizado"]);
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Error al guardar el archivo layout.json"]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Formato de datos inválido"]);
    }
    exit;
}

http_response_code(405);
echo json_encode(["success" => false, "message" => "Método no permitido"]);
?>
