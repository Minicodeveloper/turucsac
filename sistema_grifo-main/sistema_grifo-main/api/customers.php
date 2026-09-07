<?php
// api/customers.php
require_once __DIR__ . '/config/headers.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/auth_middleware.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Buscar por documento o listar todos
    $doc = $_GET['documento'] ?? null;
    $search = $_GET['search'] ?? null;

    try {
        if ($doc) {
            $query = "SELECT * FROM clientes WHERE documento = :doc LIMIT 1";
            $stmt = $db->prepare($query);
            $stmt->execute([':doc' => $doc]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
        } elseif ($search) {
            $query = "SELECT * FROM clientes WHERE documento LIKE :term OR razon_social LIKE :term LIMIT 10";
            $stmt = $db->prepare($query);
            $stmt->execute([':term' => "%$search%"]);
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } else {
            $query = "SELECT * FROM clientes ORDER BY razon_social ASC";
            $stmt = $db->query($query);
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        echo json_encode(["success" => true, "data" => $result]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }

} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $doc = $input['documento'] ?? '';
    $rs = $input['razon_social'] ?? '';
    $dir = $input['direccion'] ?? '';
    $tel = $input['telefono'] ?? '';
    $email = $input['email'] ?? '';
    $tipo = $input['tipo_cliente'] ?? 'PERSONA';

    if (!$doc || !$rs) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Documento y Razón Social son requeridos"]);
        exit;
    }

    try {
        $query = "INSERT INTO clientes (documento, razon_social, direccion, telefono, email, tipo_cliente) 
                  VALUES (:doc, :rs, :dir, :tel, :email, :tipo)";
        $stmt = $db->prepare($query);
        if ($stmt->execute([
            ':doc' => $doc, ':rs' => $rs, ':dir' => $dir, 
            ':tel' => $tel, ':email' => $email, ':tipo' => $tipo
        ])) {
            echo json_encode(["success" => true, "message" => "Cliente creado"]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "El documento ya existe o hubo un error en la DB"]);
    }

} elseif ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "ID es requerido"]);
        exit;
    }

    try {
        $query = "UPDATE clientes SET 
                  razon_social = :rs, direccion = :dir, 
                  telefono = :tel, email = :email, 
                  tipo_cliente = :tipo 
                  WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->execute([
            ':rs' => $input['razon_social'], ':dir' => $input['direccion'], 
            ':tel' => $input['telefono'], ':email' => $input['email'], 
            ':tipo' => $input['tipo_cliente'], ':id' => $id
        ]);
        echo json_encode(["success" => true, "message" => "Cliente actualizado"]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id || $id == 1) { // Protegemos al cliente genérico
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "ID inválido o cliente protegido"]);
        exit;
    }

    try {
        $stmt = $db->prepare("DELETE FROM clientes WHERE id = :id");
        $stmt->execute([':id' => $id]);
        echo json_encode(["success" => true, "message" => "Cliente eliminado"]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "No se puede eliminar el cliente (tiene historial)"]);
    }
}
?>
