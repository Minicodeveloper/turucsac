<?php
require_once __DIR__ . '/api/config/database.php';
$database = new Database();
$db = $database->getConnection();
try {
    $sql = "ALTER TABLE gym_instructores 
            ADD COLUMN turno VARCHAR(20) DEFAULT 'Mañana' AFTER especialidad,
            ADD COLUMN telefono VARCHAR(20) DEFAULT NULL AFTER turno,
            ADD COLUMN email VARCHAR(100) DEFAULT NULL AFTER telefono";
    $db->exec($sql);
    echo "Table updated successfully";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
