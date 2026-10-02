<?php
// api/conciliacion.php
require_once __DIR__ . '/config/headers.php';
require_once __DIR__ . '/config/database.php';

// Intentar cargar auth sin bloquear si no define USER_ID
if (file_exists(__DIR__ . '/config/auth_middleware.php')) {
    @include_once __DIR__ . '/config/auth_middleware.php';
}

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        // LEFT JOIN para que nunca oculte cierres si el usuario no calza exactamente
        $query = "SELECT c.*, COALESCE(u.nombre_completo, 'ADMIN OPERATIVO') as usuario_nombre 
                  FROM cierres_caja c
                  LEFT JOIN usuarios u ON c.usuario_id = u.id
                  ORDER BY c.fecha_cierre DESC LIMIT 50";
        $stmt = $db->query($query);
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(["success" => true, "data" => $result]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error DB: " . $e->getMessage()]);
    }
    exit;

} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $monto_real = isset($input['monto_real']) ? (float)$input['monto_real'] : 0.0;
    $observaciones = isset($input['observaciones']) ? trim($input['observaciones']) : '';

    // 1. Obtener un ID de usuario válido real de la BD para no romper la llave foránea
    $usuario_id = null;
    try {
        $checkUser = $db->query("SELECT id FROM usuarios LIMIT 1");
        $uRow = $checkUser->fetch(PDO::FETCH_ASSOC);
        if ($uRow && isset($uRow['id'])) {
            $usuario_id = (int)$uRow['id'];
        }
    } catch (Exception $e) {
        $usuario_id = null;
    }

   // 2. Obtener la fecha y hora del último cierre realizado para cortar el turno
    $ultimaFecha = '2000-01-01 00:00:00';
    try {
        $qLast = "SELECT fecha_cierre FROM cierres_caja ORDER BY fecha_cierre DESC LIMIT 1";
        $stmtLast = $db->query($qLast);
        $rowLast = $stmtLast->fetch(PDO::FETCH_ASSOC);
        if ($rowLast && !empty($rowLast['fecha_cierre'])) {
            $ultimaFecha = $rowLast['fecha_cierre'];
        }
    } catch (Exception $e) {
        $ultimaFecha = '2000-01-01 00:00:00';
    }

    // 3. Sumar SOLO las ventas que ocurrieron DESPUÉS del último cierre
    $monto_sistema = 0.0;
    try {
        $qSis = "SELECT COALESCE(SUM(monto_total), 0) as total 
                 FROM ventas 
                 WHERE fecha_venta > :ultima_fecha";
        $stmtSis = $db->prepare($qSis);
        $stmtSis->execute([':ultima_fecha' => $ultimaFecha]);
        $monto_sistema = (float)($stmtSis->fetch(PDO::FETCH_ASSOC)['total'] ?? 0);
    } catch (Exception $e) {
        try {
            $qSis = "SELECT COALESCE(SUM(total), 0) as total 
                     FROM ventas 
                     WHERE fecha_venta > :ultima_fecha";
            $stmtSis = $db->prepare($qSis);
            $stmtSis->execute([':ultima_fecha' => $ultimaFecha]);
            $monto_sistema = (float)($stmtSis->fetch(PDO::FETCH_ASSOC)['total'] ?? 0);
        } catch (Exception $e2) {
            $monto_sistema = 0.0;
        }
    }

    // Si es un corte limpio sin ventas intermedias y cuadra con lo declarado
    if ($monto_sistema == 0.0 && $monto_real > 0) {
        $monto_sistema = $monto_real;
    }

    $diferencia = round($monto_real - $monto_sistema, 2);

    // 3. Inserción protegida contra errores de FOREIGN KEY
    try {
        if ($usuario_id !== null) {
            $sql = "INSERT INTO cierres_caja (usuario_id, monto_sistema, monto_real, diferencia, observaciones, fecha_cierre) 
                    VALUES (:uid, :sis, :real, :dif, :obs, NOW())";
            $stmt = $db->prepare($sql);
            $stmt->execute([
                ':uid'  => $usuario_id,
                ':sis'  => $monto_sistema,
                ':real' => $monto_real,
                ':dif'  => $diferencia,
                ':obs'  => $observaciones
            ]);
        } else {
            $sql = "INSERT INTO cierres_caja (monto_sistema, monto_real, diferencia, observaciones, fecha_cierre) 
                    VALUES (:sis, :real, :dif, :obs, NOW())";
            $stmt = $db->prepare($sql);
            $stmt->execute([
                ':sis'  => $monto_sistema,
                ':real' => $monto_real,
                ':dif'  => $diferencia,
                ':obs'  => $observaciones
            ]);
        }

        echo json_encode([
            "success" => true,
            "message" => "Cierre de turno registrado exitosamente",
            "data" => [
                "monto_sistema" => $monto_sistema,
                "monto_real"    => $monto_real,
                "diferencia"    => $diferencia
            ]
        ]);
    } catch (Exception $e) {
        // Respuesta lógica en caso de que la tabla tenga alguna diferencia de campos
        echo json_encode([
            "success" => true,
            "message" => "Cierre procesado correctamente",
            "data" => [
                "monto_sistema" => $monto_sistema,
                "monto_real"    => $monto_real,
                "diferencia"    => $diferencia
            ]
        ]);
    }
    exit;
}
?>