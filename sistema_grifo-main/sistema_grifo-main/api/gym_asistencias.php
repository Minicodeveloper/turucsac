<?php
// api/gym_asistencias.php
require_once __DIR__ . '/config/headers.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/auth_middleware.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        // Obtener asistencias de HOY
        $query = "SELECT a.*, s.nombre_completo as socio, s.nro_documento as documento, 
                         DATE_FORMAT(a.fecha_hora, '%h:%i %p') as hora 
                  FROM gym_asistencias a
                  JOIN gym_socios s ON a.socio_id = s.id
                  WHERE DATE(a.fecha_hora) = CURDATE()
                  ORDER BY a.fecha_hora DESC";
        $stmt = $db->query($query);
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(["success" => true, "data" => $result]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $dni = $input['nro_documento'] ?? '';
    $tipo = $input['tipo'] ?? 'ENTRADA';

    if (!$dni) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Documento del socio requerido"]);
        exit;
    }

    try {
        // 1. Buscar socio por DNI y ver su estado/vencimiento
        $stmt_socio = $db->prepare("SELECT id, nombre_completo, estado, fecha_vencimiento FROM gym_socios WHERE nro_documento = :dni");
        $stmt_socio->execute([':dni' => $dni]);
        $socio = $stmt_socio->fetch(PDO::FETCH_ASSOC);

        if (!$socio) {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Socio no encontrado"]);
            exit;
        }

        // 2. Verificar vencimiento y estado
        $vencido = false;
        $hoy = date('Y-m-d');
        if ($socio['fecha_vencimiento'] < $hoy || $socio['estado'] !== 'ACTIVO') {
            $vencido = true;
        }

        // 3. Registrar asistencia
        $query = "INSERT INTO gym_asistencias (socio_id, tipo) VALUES (:sid, :tipo)";
        $stmt = $db->prepare($query);
        $stmt->execute([
            ':sid' => $socio['id'],
            ':tipo' => $tipo
        ]);

        $msg = "Asistencia registrada: " . $socio['nombre_completo'];
        if ($vencido) {
            $msg .= " (ALERTA: Membresía Vencida o Inactiva)";
        }

        echo json_encode([
            "success" => true, 
            "message" => $msg, 
            "vencido" => $vencido,
            "socio_id" => $socio['id']
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
}
?>
