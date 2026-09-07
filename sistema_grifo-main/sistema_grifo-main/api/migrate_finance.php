<?php
// api/migrate_finance.php
require_once __DIR__ . '/config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    // 1. Tabla de Cierres de Caja (Conciliación)
    $sql1 = "CREATE TABLE IF NOT EXISTS `cierres_caja` (
      `id` bigint(20) NOT NULL AUTO_INCREMENT,
      `usuario_id` int(11) NOT NULL,
      `fecha_cierre` timestamp NOT NULL DEFAULT current_timestamp(),
      `monto_sistema` decimal(10,2) NOT NULL, -- Lo que dice el software
      `monto_real` decimal(10,2) NOT NULL,    -- Lo que el cajero cuenta
      `diferencia` decimal(10,2) NOT NULL,
      `observaciones` text DEFAULT NULL,
      PRIMARY KEY (`id`),
      KEY `usuario_id` (`usuario_id`),
      CONSTRAINT `cierres_caja_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

    // 2. Tabla de Gastos (Caja Chica/Egresos directos)
    $sql2 = "CREATE TABLE IF NOT EXISTS `gastos` (
      `id` bigint(20) NOT NULL AUTO_INCREMENT,
      `descripcion` varchar(255) NOT NULL,
      `monto` decimal(10,2) NOT NULL,
      `categoria` varchar(100) DEFAULT 'General',
      `fecha_gasto` timestamp NOT NULL DEFAULT current_timestamp(),
      `usuario_id` int(11) DEFAULT NULL,
      PRIMARY KEY (`id`),
      KEY `usuario_id` (`usuario_id`),
      CONSTRAINT `gastos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

    $db->exec($sql1);
    $db->exec($sql2);
    echo "Tablas 'cierres_caja' y 'gastos' creadas exitosamente.";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
