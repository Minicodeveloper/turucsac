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
        $isSuperAdmin = strtoupper((string) USER_ROL) === 'SUPER_ADMIN';
        $query = "SELECT id, nro_documento, nombre_completo, rol, created_at FROM usuarios";
        if (!$isSuperAdmin) {
            $query .= " WHERE empresa_id = :empresa_id";
        }
        $query .= " ORDER BY nombre_completo ASC";

        $stmt = $db->prepare($query);
        if (!$isSuperAdmin) {
            $stmt->bindValue(':empresa_id', USER_EMPRESA_ID, PDO::PARAM_INT);
        }
        $stmt->execute();
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $companies = [];
        if ($isSuperAdmin) {
            $companies = $db->query("SELECT id, razon_social FROM empresas ORDER BY razon_social ASC")
                ->fetchAll(PDO::FETCH_ASSOC);
        }

        echo json_encode([
            "success" => true,
            "data" => $result,
            "companies" => $companies
        ]);
    } catch (PDOException $e) {
        error_log('Error al cargar usuarios: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error al cargar la lista de usuarios."]);
    }
} elseif ($method === 'POST') {
    $currentRole = strtoupper((string) USER_ROL);
    if (!in_array($currentRole, ['SUPER_ADMIN', 'ADMIN_EMPRESA', 'ADMIN'], true)) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "No tiene permisos para crear usuarios."]);
        exit;
    }

    $inputJSON = file_get_contents('php://input');
    $input = json_decode($inputJSON, TRUE);

    $nro = trim((string) ($input['nro_documento'] ?? ''));
    $nombre = trim((string) ($input['nombre_completo'] ?? ''));
    $password = (string) ($input['password'] ?? '');
    $rolInput = strtoupper(trim((string) ($input['rol'] ?? 'CAJERO')));
    $roleAliases = ['ADMIN' => 'ADMIN_EMPRESA'];
    $rol = $roleAliases[$rolInput] ?? $rolInput;
    $allowedRoles = $currentRole === 'ADMIN_EMPRESA'
        ? ['SUPERVISOR', 'CAJERO']
        : ['ADMIN_EMPRESA', 'SUPERVISOR', 'CAJERO'];
    $empresaId = $currentRole === 'ADMIN_EMPRESA'
        ? (int) USER_EMPRESA_ID
        : filter_var($input['empresa_id'] ?? null, FILTER_VALIDATE_INT);

    if ($nro === '' || $nombre === '' || $password === '') {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Faltan datos obligatorios."]);
        exit;
    }
    if (!in_array($rol, $allowedRoles, true)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "El rol seleccionado no está permitido para su cuenta."]);
        exit;
    }
    if (!$empresaId || $empresaId < 1) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Seleccione una empresa para el nuevo usuario."]);
        exit;
    }

    try {
        if ($currentRole !== 'ADMIN_EMPRESA') {
            $companyCheck = $db->prepare("SELECT id FROM empresas WHERE id = :empresa_id");
            $companyCheck->execute([':empresa_id' => $empresaId]);
            if (!$companyCheck->fetchColumn()) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "La empresa seleccionada no existe."]);
                exit;
            }
        }

        $check = $db->prepare("SELECT id FROM usuarios WHERE nro_documento = :dni");
        $check->execute([':dni' => $nro]);
        if ($check->fetchColumn()) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "El número de documento ya está registrado."]);
            exit;
        }

        $insert = "INSERT INTO usuarios (empresa_id, nro_documento, password_hash, nombre_completo, rol)
                   VALUES (:empresa_id, :dni, :hash, :nombre, :rol)";
        $stmt = $db->prepare($insert);
        $stmt->execute([
            ':empresa_id' => $empresaId,
            ':dni' => $nro,
            ':hash' => password_hash($password, PASSWORD_BCRYPT),
            ':nombre' => $nombre,
            ':rol' => $rol,
        ]);

        echo json_encode([
            "success" => true,
            "message" => "Usuario creado exitosamente"
        ]);
    } catch (PDOException $e) {
        error_log('Error al guardar usuario: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error al guardar el usuario. Revise los datos e intente nuevamente."]);
    }
} elseif ($method === 'DELETE') {
    $currentRole = strtoupper((string) USER_ROL);
    if (!in_array($currentRole, ['SUPER_ADMIN', 'ADMIN_EMPRESA', 'ADMIN'], true)) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Acceso prohibido."]);
        exit;
    }

    $id = $_GET['id'] ?? null;
    if (!$id || (int) $id === (int) USER_ID || (int) $id === 1) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "ID inválido o usuario protegido."]);
        exit;
    }

    try {
        $query = "DELETE FROM usuarios WHERE id = :id";
        if ($currentRole === 'ADMIN_EMPRESA') {
            $query .= " AND empresa_id = :empresa_id AND rol IN ('SUPERVISOR', 'CAJERO')";
        } else {
            $query .= " AND rol <> 'SUPER_ADMIN'";
        }
        $stmt = $db->prepare($query);
        $params = [':id' => $id];
        if ($currentRole === 'ADMIN_EMPRESA') {
            $params[':empresa_id'] = USER_EMPRESA_ID;
        }
        $stmt->execute($params);
        if ($stmt->rowCount() > 0) {
            echo json_encode(["success" => true, "message" => "Usuario eliminado."]);
        } else {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "No se encontró el usuario o no tiene permiso para eliminarlo."]);
        }
    } catch (PDOException $e) {
        error_log('Error al eliminar usuario: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error al eliminar: El usuario tiene registros vinculados."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método HTTP no soportado"]);
}
?>