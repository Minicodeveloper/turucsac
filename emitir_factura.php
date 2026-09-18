<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/FacturacionService.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'mensaje' => 'Método no permitido. Utilice POST.'
    ]);
    exit;
}

$inputJSON = file_get_contents('php://input');
$data = json_decode($inputJSON, true);

if (!$data) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'mensaje' => 'Formato JSON inválido o cuerpo vacío.'
    ]);
    exit;
}

if (empty($data['cliente']) || empty($data['items'])) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'mensaje' => 'Faltan datos obligatorios (cliente o items).'
    ]);
    exit;
}

try {
    $servicio = new FacturacionService();
    $resultado = $servicio->emitirFactura($data);

    http_response_code($resultado['success'] ? 200 : 400);
    echo json_encode($resultado);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'codigo' => 'SERVER_ERROR',
        'mensaje' => $e->getMessage()
    ]);
}
