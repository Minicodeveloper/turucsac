<?php
require_once __DIR__ . '/config.php';

Config::load();

try {
    $host = Config::get('DB_HOST', '127.0.0.1');
    $db   = Config::get('DB_NAME', 'turucsac_db');
    $user = Config::get('DB_USER', 'root');
    $pass = Config::get('DB_PASS', '');

    echo "Conectando a MySQL con usuario '$user' y password: " . ($pass !== '' ? 'SI' : 'NO') . "\n";

    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    $sql = "ALTER TABLE ventas 
            ADD COLUMN IF NOT EXISTS serie VARCHAR(4) DEFAULT 'B001' AFTER tipo_comprobante, 
            ADD COLUMN IF NOT EXISTS correlativo INT(11) DEFAULT NULL AFTER serie, 
            ADD COLUMN IF NOT EXISTS sunat_codigo VARCHAR(10) DEFAULT NULL AFTER correlativo, 
            ADD COLUMN IF NOT EXISTS sunat_mensaje VARCHAR(255) DEFAULT NULL AFTER sunat_codigo, 
            ADD COLUMN IF NOT EXISTS sunat_xml_path VARCHAR(255) DEFAULT NULL AFTER sunat_mensaje, 
            ADD COLUMN IF NOT EXISTS sunat_cdr_path VARCHAR(255) DEFAULT NULL AFTER sunat_xml_path";

    $pdo->exec($sql);
    echo "Tabla ventas actualizada correctamente.\n";

    $cols = $pdo->query("DESCRIBE ventas")->fetchAll(PDO::FETCH_COLUMN);
    echo "Columnas actuales en ventas:\n";
    print_r($cols);

} catch (Throwable $e) {
    echo "Error: " . $e->getMessage() . "\n";
}