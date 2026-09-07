<?php
// api/auth.php
require_once __DIR__ . '/config/headers.php'; // Incluye el manejo de OPTIONS/CORS
require_once __DIR__ . '/config/database.php';

$database = new Database();
$db = $database->getConnection();

// Leer JSON del cuerpo de la petición
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, TRUE);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nro_documento = $input['nro_documento'] ?? '';
    $password = $input['password'] ?? '';

    if (!empty($nro_documento) && !empty($password)) {
        try {
            $query = "SELECT id, nro_documento, password_hash, nombre_completo, rol FROM usuarios WHERE nro_documento = :dni LIMIT 1";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':dni', $nro_documento);
            $stmt->execute();

            if ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                if (password_verify($password, $row['password_hash'])) {
                    $token = bin2hex(random_bytes(32));
                    $expiry = date('Y-m-d H:i:s', strtotime('+24 hours'));

                    // Guardar token en DB
                    $updateQuery = "UPDATE usuarios SET token = :token, token_expiry = :expiry WHERE id = :id";
                    $updateStmt = $db->prepare($updateQuery);
                    $updateStmt->bindParam(':token', $token);
                    $updateStmt->bindParam(':expiry', $expiry);
                    $updateStmt->bindParam(':id', $row['id']);
                    $updateStmt->execute();

                    http_response_code(200);
                    echo json_encode([
                        "success" => true,
                        "token" => $token,
                        "user" => [
                            "id" => $row['id'],
                            "name" => $row['nombre_completo'],
                            "rol" => $row['rol']
                        ],
                        "message" => "Acceso concedido"
                    ]);
                } else {
                    http_response_code(401);
                    echo json_encode(["success" => false, "message" => "Contraseña incorrecta"]);
                }
            } else {
                http_response_code(401);
                echo json_encode(["success" => false, "message" => "Usuario no registrado"]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Error de BD: " . $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Datos incompletos"]);
    }
} else {
    // Si no es POST, ya debería haber sido filtrado por headers.php si es OPTIONS
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
}
?>
