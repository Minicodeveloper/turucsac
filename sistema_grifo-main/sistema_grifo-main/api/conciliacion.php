<?php
require_once __DIR__ . '/config/headers.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/auth_middleware.php';

$role = strtoupper((string) USER_ROL);
$role = $role === 'ADMIN' ? 'SUPER_ADMIN' : $role;
if (!in_array($role, ['SUPER_ADMIN', 'ADMIN_EMPRESA', 'SUPERVISOR'], true)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'No tienes permisos para consultar la conciliación de caja.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Los cierres se registran desde el formulario de cierre de turno.']);
    exit;
}

$empresaId = USER_EMPRESA_ID ? (int) USER_EMPRESA_ID : null;
if (!$empresaId && $role !== 'SUPER_ADMIN') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Tu usuario no tiene una empresa asignada.']);
    exit;
}

try {
    $db = (new Database())->getConnection();
    $query = 'SELECT c.*, u.nombre_completo AS usuario_nombre
              FROM cierres_caja c
              LEFT JOIN usuarios u ON c.usuario_id = u.id';
    $params = [];
    if ($role !== 'SUPER_ADMIN') {
        $query .= ' WHERE c.empresa_id = :empresa_id';
        $params[':empresa_id'] = $empresaId;
    }
    $query .= ' ORDER BY c.fecha_cierre DESC LIMIT 50';
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
} catch (PDOException $e) {
    error_log('Error al consultar cierres de caja: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'No se pudo cargar el historial de cierres.']);
}
