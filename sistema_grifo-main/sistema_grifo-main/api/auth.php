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
    $nro_documento = trim($input['nro_documento'] ?? '');
    $password = $input['password'] ?? '';

    if (!empty($nro_documento) && !empty($password)) {
        try {
            $logoColumn = $db->query(
                "SELECT COUNT(*) FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'empresas'
                   AND COLUMN_NAME = 'logo_path'"
            )->fetchColumn();
            $logoSelect = (int) $logoColumn > 0 ? 'e.logo_path' : 'NULL AS logo_path';

            // Traemos los datos del usuario e información de su empresa vinculada
            $query = "SELECT u.id, u.nro_documento, u.password_hash, u.nombre_completo, u.rol, u.empresa_id,
                             e.razon_social, {$logoSelect}, e.estado AS empresa_estado
                      FROM usuarios u 
                      LEFT JOIN empresas e ON u.empresa_id = e.id 
                      WHERE u.nro_documento = :dni LIMIT 1";
            
            $stmt = $db->prepare($query);
            $stmt->bindParam(':dni', $nro_documento);
            $stmt->execute();

            if ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                
                // Normalizar rol para evitar fallas de casing
                $rolUsuario = strtoupper((string) $row['rol']);

                // Mapeo retrocompatible si en BD dice 'ADMIN'
                if ($rolUsuario === 'ADMIN') {
                    $rolUsuario = 'SUPER_ADMIN';
                }

                $storedPassword = (string) $row['password_hash'];
                $passwordVerified = password_verify($password, $storedPassword);
                $legacyPlaintextPassword = !$passwordVerified
                    && hash_equals($storedPassword, $password);

                if ($passwordVerified || $legacyPlaintextPassword) {
                    if ($legacyPlaintextPassword || password_needs_rehash($storedPassword, PASSWORD_BCRYPT)) {
                        $rehashStmt = $db->prepare(
                            "UPDATE usuarios SET password_hash = :password_hash WHERE id = :id"
                        );
                        $rehashStmt->execute([
                            ':password_hash' => password_hash($password, PASSWORD_BCRYPT),
                            ':id' => $row['id'],
                        ]);
                    }

                    // Validar si la empresa está suspendida (se omite para el SUPER_ADMIN)
                    if ($rolUsuario !== 'SUPER_ADMIN' && $row['empresa_estado'] === 'suspendido') {
                        http_response_code(403);
                        echo json_encode([
                            "success" => false, 
                            "message" => "Su empresa se encuentra suspendida. Contacte al administrador."
                        ]);
                        exit;
                    }

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
                            "nombre_completo" => $row['nombre_completo'],
                            "rol" => $rolUsuario,
                            "role" => $rolUsuario,
                            "empresa_id" => $row['empresa_id'],
                            "razon_social" => $row['razon_social'] ?? 'TURUCSAC Global',
                            "logo_path" => $row['logo_path'] ?? null
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
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
}
?>