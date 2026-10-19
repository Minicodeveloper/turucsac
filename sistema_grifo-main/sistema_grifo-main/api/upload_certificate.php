<?php
// api/upload_certificate.php
require_once __DIR__ . '/config/headers.php';
require_once __DIR__ . '/config/database.php';

$database = new Database();
$db = $database->getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $empresa_id = $_POST['empresa_id'] ?? null;
    $cert_password = $_POST['cert_password'] ?? '';

    if (!$empresa_id || empty($cert_password) || !isset($_FILES['certificado'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Datos o archivo incompletos."]);
        exit;
    }

    $file = $_FILES['certificado'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

    if (!in_array($ext, ['p12', 'pfx'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Formato no válido. Debe ser un archivo .p12 o .pfx"]);
        exit;
    }

    // Directorio seguro fuera de acceso público web
    $targetDir = __DIR__ . '/../storage/certificados/' . $empresa_id . '/';
    if (!file_exists($targetDir)) {
        mkdir($targetDir, 0755, true);
    }

    $fileName = 'cert_' . time() . '.' . $ext;
    $targetPath = $targetDir . $fileName;

    if (move_uploaded_file($file['tmp_tmp_name'] ?? $file['tmp_name'], $targetPath)) {
        try {
            // Guardar la ruta relativa y la clave
            $query = "UPDATE empresas SET certificado_path = :path, certificado_pass = :pass WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':path', $targetPath);
            $stmt->bindParam(':pass', $cert_password); // En producción aplicar openssl_encrypt
            $stmt->bindParam(':id', $empresa_id);
            $stmt->execute();

            http_response_code(200);
            echo json_encode([
                "success" => true,
                "message" => "Certificado digital subido y guardado correctamente."
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Error al actualizar la BD: " . $e->getMessage()]);
        }
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error al guardar el archivo en el servidor."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método no permitido."]);
}
?>