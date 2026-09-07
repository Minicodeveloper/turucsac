<?php
// api/config/headers.php

// 1. Establecer cabeceras CORS de inmediato para que afecten incluso a pre-flight requests
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// 2. Manejo de la petición pre-flight de CORS (método OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

function jsonResponse($status, $message, $data = null, $http_code = 200) {
    http_response_code($http_code);
    echo json_encode([
        "success" => $status,
        "message" => $message,
        "data" => $data
    ]);
    exit;
}
?>
