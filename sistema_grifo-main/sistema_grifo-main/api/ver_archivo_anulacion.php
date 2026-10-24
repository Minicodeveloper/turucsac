<?php
require_once __DIR__ . '/config/headers.php';
require_once __DIR__ . '/config/auth_middleware.php';

$saleId = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
$type = strtolower(trim((string) ($_GET['tipo'] ?? '')));
if (!$saleId || !in_array($type, ['xml', 'cdr'], true)) {
    http_response_code(400);
    exit('Solicitud de archivo de anulación no válida.');
}

$isSuperAdmin = strtoupper((string) USER_ROL) === 'SUPER_ADMIN';
$query = "SELECT v.anulacion_estado, v.anulacion_serie, v.anulacion_correlativo,
                 v.anulacion_xml_path, v.anulacion_cdr_path, e.ruc
          FROM ventas v
          LEFT JOIN empresas e ON e.id = v.empresa_id
          WHERE v.id = :id";
if (!$isSuperAdmin) {
    $query .= ' AND v.empresa_id = :empresa_id';
}
$query .= ' LIMIT 1';

$stmt = $db->prepare($query);
$stmt->bindValue(':id', $saleId, PDO::PARAM_INT);
if (!$isSuperAdmin) {
    $stmt->bindValue(':empresa_id', USER_EMPRESA_ID, PDO::PARAM_INT);
}
$stmt->execute();
$sale = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$sale) {
    http_response_code(404);
    exit('Comprobante no encontrado.');
}
if ($sale['anulacion_estado'] !== 'ANULADO') {
    http_response_code(409);
    exit('La anulación aún no fue aceptada por SUNAT.');
}

$serie = (string) ($sale['anulacion_serie'] ?? '');
$correlativo = filter_var($sale['anulacion_correlativo'] ?? null, FILTER_VALIDATE_INT);
$ruc = (string) ($sale['ruc'] ?? '');
if (!preg_match('/^[A-Z0-9]{4}$/', $serie)
    || $correlativo === false
    || $correlativo < 1
    || !preg_match('/^\d{11}$/', $ruc)) {
    http_response_code(404);
    exit('La anulación no tiene una serie y correlativo válidos.');
}

$projectRoot = realpath(dirname(__DIR__, 3));
if ($projectRoot === false) {
    http_response_code(500);
    exit('No se pudo localizar el almacenamiento de comprobantes.');
}

$directory = $type === 'xml' ? 'xml' : 'cdr';
$expectedName = sprintf(
    '%s%s-07-%s-%d.%s',
    $type === 'cdr' ? 'R-' : '',
    $ruc,
    $serie,
    $correlativo,
    $type === 'cdr' ? 'zip' : 'xml'
);
$storedPath = (string) ($sale[$type === 'xml' ? 'anulacion_xml_path' : 'anulacion_cdr_path'] ?? '');
$resolvedPath = $storedPath !== '' ? realpath($storedPath) : false;
$storageRoot = realpath($projectRoot . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . $directory);
$storagePrefix = $storageRoot !== false
    ? rtrim($storageRoot, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR
    : '';

if ($resolvedPath === false
    || $storageRoot === false
    || !is_file($resolvedPath)
    || strncasecmp($resolvedPath, $storagePrefix, strlen($storagePrefix)) !== 0
    || basename($resolvedPath) !== $expectedName) {
    http_response_code(404);
    exit('El archivo oficial de anulación no está disponible.');
}

header('Content-Type: ' . ($type === 'xml' ? 'application/xml; charset=utf-8' : 'application/zip'));
header(
    'Content-Disposition: ' . ($type === 'xml' ? 'inline' : 'attachment')
    . '; filename="' . $expectedName . '"'
);
header('Content-Length: ' . filesize($resolvedPath));
header('X-Content-Type-Options: nosniff');
readfile($resolvedPath);
