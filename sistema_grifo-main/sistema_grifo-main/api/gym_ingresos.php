<?php
// api/gym_ingresos.php
require_once __DIR__ . '/config/headers.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/auth_middleware.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$empresaId = USER_EMPRESA_ID ? (int) USER_EMPRESA_ID : null;
$role = strtoupper((string) USER_ROL);
if (!in_array($role, ['SUPER_ADMIN', 'ADMIN', 'ADMIN_EMPRESA', 'SUPERVISOR'], true)) {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Tu rol no tiene permiso para consultar o registrar ingresos."]);
    exit;
}
if (!$empresaId) {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Tu usuario no tiene una empresa operativa asignada."]);
    exit;
}

if ($method === 'GET') {
    $mes = $_GET['mes'] ?? date('Y-m'); // Formato: YYYY-MM
    try {
        $query = "SELECT i.*, s.nombre_completo as socio, s.nro_documento as documento, p.nombre as plan 
                  FROM gym_ingresos i
                  JOIN gym_socios s ON i.socio_id = s.id AND s.empresa_id = i.empresa_id
                  JOIN gym_planes p ON i.plan_id = p.id AND p.empresa_id = i.empresa_id
                  WHERE i.empresa_id = :empresa_id AND DATE_FORMAT(i.fecha_pago, '%Y-%m') = :mes
                  ORDER BY i.fecha_pago DESC";
        $stmt = $db->prepare($query);
        $stmt->execute([':empresa_id' => $empresaId, ':mes' => $mes]);
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(["success" => true, "data" => $result]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $socio_id = $input['socio_id'] ?? null;
    $plan_id = $input['plan_id'] ?? null;
    $monto = $input['monto'] ?? 0;
    $metodo = $input['metodo_pago'] ?? 'Efectivo';

    if (!$socio_id || !$plan_id || $monto <= 0) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Socio, Plan y Monto son requeridos"]);
        exit;
    }

    try {
        $check = $db->prepare(
            'SELECT COUNT(*) FROM gym_socios s
             INNER JOIN gym_planes p ON p.id = :plan_id AND p.empresa_id = s.empresa_id
             WHERE s.id = :socio_id AND s.empresa_id = :empresa_id'
        );
        $check->execute([
            ':plan_id' => $plan_id,
            ':socio_id' => $socio_id,
            ':empresa_id' => $empresaId,
        ]);
        if ((int) $check->fetchColumn() === 0) {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "El socio o plan no pertenece a tu empresa."]);
            exit;
        }

        $query = "INSERT INTO gym_ingresos (empresa_id, socio_id, plan_id, monto, metodo_pago) 
                  VALUES (:empresa_id, :sid, :pid, :mon, :met)";
        $stmt = $db->prepare($query);
        $stmt->execute([
            ':empresa_id' => $empresaId,
            ':sid' => $socio_id,
            ':pid' => $plan_id,
            ':mon' => $monto,
            ':met' => $metodo
        ]);
        
        echo json_encode(["success" => true, "message" => "Pago registrado con éxito"]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error al registrar el pago"]);
    }
}
?>
