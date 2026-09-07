<?php
// api/gym_socios.php
require_once __DIR__ . '/config/headers.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/auth_middleware.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $search = $_GET['search'] ?? null;
    try {
        $query = "SELECT s.*, p.nombre as plan_nombre, p.duracion_dias, p.precio as plan_precio
                  FROM gym_socios s 
                  LEFT JOIN gym_planes p ON s.plan_id = p.id";
        
        if ($search) {
            $query .= " WHERE s.nro_documento LIKE :term OR s.nombre_completo LIKE :term";
            $stmt = $db->prepare($query);
            $stmt->execute([':term' => "%$search%"]);
        } else {
            $query .= " ORDER BY s.created_at DESC";
            $stmt = $db->query($query);
        }

        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Formatear para el frontend
        foreach ($result as &$socio) {
            $socio['activo'] = ($socio['estado'] === 'ACTIVO');
            // Días restantes (lógica básica)
            $hoy = new DateTime();
            $ven = new DateTime($socio['fecha_vencimiento']);
            $diff = $hoy->diff($ven);
            $socio['dias_restantes'] = $ven < $hoy ? -($diff->days) : $diff->days;
        }

        echo json_encode(["success" => true, "data" => $result]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $dni = $input['nro_documento'] ?? '';
    $nom = $input['nombre_completo'] ?? '';
    $plan_id = $input['plan_id'] ?? null;
    $fecha_inicio = $input['fecha_inicio'] ?? date('Y-m-d');

    if (!$dni || !$nom || !$plan_id) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "DNI, Nombre y Plan son obligatorios"]);
        exit;
    }

    try {
        // 1. Obtener duración del plan
        $stmt_plan = $db->prepare("SELECT duracion_dias FROM gym_planes WHERE id = :id");
        $stmt_plan->execute([':id' => $plan_id]);
        $plan = $stmt_plan->fetch(PDO::FETCH_ASSOC);

        if (!$plan) {
            throw new Exception("El plan seleccionado no existe");
        }

        // 2. Calcular fecha de vencimiento
        $duracion = $plan['duracion_dias'];
        $vencimiento = date('Y-m-d', strtotime($fecha_inicio . " + $duracion days"));

        // 3. Insertar socio
        $query = "INSERT INTO gym_socios (nro_documento, nombre_completo, plan_id, fecha_inicio, fecha_vencimiento, estado) 
                  VALUES (:dni, :nom, :pid, :ini, :ven, 'ACTIVO')";
        $stmt = $db->prepare($query);
        $stmt->execute([
            ':dni' => $dni,
            ':nom' => $nom,
            ':pid' => $plan_id,
            ':ini' => $fecha_inicio,
            ':ven' => $vencimiento
        ]);

        echo json_encode(["success" => true, "message" => "Socio registrado con éxito. Vencimiento: $vencimiento"]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
} elseif ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "ID de socio requerido"]);
        exit;
    }

    try {
        $query = "UPDATE gym_socios SET 
                  nombre_completo = :nom, 
                  plan_id = :pid, 
                  estado = :est 
                  WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->execute([
            ':nom' => $input['nombre_completo'],
            ':pid' => $input['plan_id'],
            ':est' => $input['estado'] ?? 'ACTIVO',
            ':id' => $id
        ]);
        echo json_encode(["success" => true, "message" => "Socio actualizado"]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "ID requerido"]);
        exit;
    }

    try {
        $stmt = $db->prepare("DELETE FROM gym_socios WHERE id = :id");
        $stmt->execute([':id' => $id]);
        echo json_encode(["success" => true, "message" => "Socio eliminado"]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error al eliminar socio"]);
    }
}
?>
