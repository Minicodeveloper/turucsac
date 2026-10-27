<?php
// api/customers.php
require_once __DIR__ . '/config/headers.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/auth_middleware.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$currentRole = strtoupper((string) USER_ROL);
$currentRole = $currentRole === 'ADMIN' ? 'SUPER_ADMIN' : $currentRole;
$isSuperAdmin = $currentRole === 'SUPER_ADMIN';
$canManageCustomers = in_array($currentRole, ['SUPER_ADMIN', 'ADMIN_EMPRESA', 'SUPERVISOR'], true);
$empresaId = USER_EMPRESA_ID ? (int) USER_EMPRESA_ID : null;

if (!$isSuperAdmin && !$empresaId) {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Tu usuario no tiene una empresa asignada."]);
    exit;
}

$tenantClause = $isSuperAdmin ? '' : ' AND empresa_id = :empresa_id';
$tenantParams = $isSuperAdmin ? [] : [':empresa_id' => $empresaId];

if ($method === 'GET') {
    if (($_GET['companies'] ?? '') === '1') {
        if (!$isSuperAdmin) {
            http_response_code(403);
            echo json_encode(["success" => false, "message" => "Solo el super administrador puede consultar empresas."]);
            exit;
        }
        try {
            $companies = $db->query("SELECT id, razon_social FROM empresas ORDER BY razon_social ASC")
                ->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(["success" => true, "data" => $companies]);
        } catch (PDOException $e) {
            error_log('No se pudo cargar las empresas para clientes: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "No se pudo cargar la lista de empresas."]);
        }
        exit;
    }

    // Buscar por documento o listar todos
    $doc = $_GET['documento'] ?? null;
    $search = $_GET['search'] ?? null;

    try {
        if ($doc) {
            $query = "SELECT * FROM clientes WHERE documento = :doc{$tenantClause} LIMIT 1";
            $stmt = $db->prepare($query);
            $stmt->execute([':doc' => $doc] + $tenantParams);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
        } elseif ($search) {
            $query = "SELECT * FROM clientes WHERE (documento LIKE :term OR razon_social LIKE :term){$tenantClause} LIMIT 10";
            $stmt = $db->prepare($query);
            $stmt->execute([':term' => "%$search%"] + $tenantParams);
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } else {
            $query = "SELECT * FROM clientes" . ($isSuperAdmin ? '' : ' WHERE empresa_id = :empresa_id') . " ORDER BY razon_social ASC";
            $stmt = $db->prepare($query);
            $stmt->execute($tenantParams);
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        echo json_encode(["success" => true, "data" => $result]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }

} elseif ($method === 'POST') {
    if (!in_array($currentRole, ['SUPER_ADMIN', 'ADMIN_EMPRESA', 'SUPERVISOR', 'CAJERO'], true)) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Tu rol no puede registrar clientes."]);
        exit;
    }

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
        $companyId = $empresaId;
        if ($isSuperAdmin && isset($input['empresa_id'])) {
            $companyId = filter_var($input['empresa_id'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        }
        if (!$companyId) {
            http_response_code(422);
            echo json_encode(["success" => false, "message" => "Selecciona la empresa a la que pertenece el cliente."]);
            exit;
        }
        if ($isSuperAdmin) {
            $companyCheck = $db->prepare("SELECT id FROM empresas WHERE id = :empresa_id");
            $companyCheck->execute([':empresa_id' => $companyId]);
            if (!$companyCheck->fetchColumn()) {
                http_response_code(422);
                echo json_encode(["success" => false, "message" => "La empresa seleccionada no existe."]);
                exit;
            }
        }
        $query = "INSERT INTO clientes (empresa_id, documento, razon_social, direccion, telefono, email, tipo_cliente)
                  VALUES (:empresa_id, :doc, :rs, :dir, :tel, :email, :tipo)";
        $stmt = $db->prepare($query);
        if ($stmt->execute([
            ':empresa_id' => $companyId, ':doc' => $doc, ':rs' => $rs, ':dir' => $dir,
            ':tel' => $tel, ':email' => $email, ':tipo' => $tipo
        ])) {
            echo json_encode(["success" => true, "message" => "Cliente creado"]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "El documento ya existe o hubo un error en la DB"]);
    }

} elseif ($method === 'PUT') {
    if (!$canManageCustomers) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Solo supervisores y administradores pueden editar clientes."]);
        exit;
    }

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
                  WHERE id = :id{$tenantClause}";
        $stmt = $db->prepare($query);
        $stmt->execute([
            ':rs' => $input['razon_social'], ':dir' => $input['direccion'], 
            ':tel' => $input['telefono'], ':email' => $input['email'], 
            ':tipo' => $input['tipo_cliente'], ':id' => $id
        ] + $tenantParams);
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "No se encontró el cliente en tu empresa."]);
            exit;
        }
        echo json_encode(["success" => true, "message" => "Cliente actualizado"]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
} elseif ($method === 'DELETE') {
    if (!$canManageCustomers) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Solo supervisores y administradores pueden eliminar clientes."]);
        exit;
    }

    $id = $_GET['id'] ?? null;
    if (!$id || $id == 1) { // Protegemos al cliente genérico
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "ID inválido o cliente protegido"]);
        exit;
    }

    try {
        $stmt = $db->prepare("DELETE FROM clientes WHERE id = :id{$tenantClause}");
        $stmt->execute([':id' => $id] + $tenantParams);
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "No se encontró el cliente en tu empresa."]);
            exit;
        }
        echo json_encode(["success" => true, "message" => "Cliente eliminado"]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "No se puede eliminar el cliente (tiene historial)"]);
    }
}
?>
