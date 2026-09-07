<?php
// api/gym_ingresos.php
require_once __DIR__ . '/config/headers.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/auth_middleware.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $mes = $_GET['mes'] ?? date('Y-m'); // Formato: YYYY-MM
    try {
        $query = "SELECT i.*, s.nombre_completo as socio, s.nro_documento as documento, p.nombre as plan 
                  FROM gym_ingresos i
                  JOIN gym_socios s ON i.socio_id = s.id
                  JOIN gym_planes p ON i.plan_id = p.id
                  WHERE DATE_FORMAT(i.fecha_pago, '%Y-%m') = :mes
                  ORDER BY i.fecha_pago DESC";
        $stmt = $db->prepare($query);
        $stmt->execute([':mes' => $mes]);
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
        $query = "INSERT INTO gym_ingresos (socio_id, plan_id, monto, metodo_pago) 
                  VALUES (:sid, :pid, :mon, :met)";
        $stmt = $db->prepare($query);
        $stmt->execute([
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
