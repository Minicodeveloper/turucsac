<?php
// api/migrate_compras.php
require_once __DIR__ . '/config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $sql = "CREATE TABLE IF NOT EXISTS `compras` (
      `id` bigint(20) NOT NULL AUTO_INCREMENT,
      `combustible_id` int(11) NOT NULL,
      `cantidad_galones` decimal(10,3) NOT NULL,
      `precio_compra` decimal(10,2) NOT NULL,
      `monto_total` decimal(10,2) NOT NULL,
      `proveedor` varchar(150) DEFAULT NULL,
      `nro_factura` varchar(50) DEFAULT NULL,
      `placa_cisterna` varchar(20) DEFAULT NULL,
      `usuario_id` int(11) DEFAULT NULL,
      `fecha_compra` timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (`id`),
      KEY `combustible_id` (`combustible_id`),
      KEY `usuario_id` (`usuario_id`),
      CONSTRAINT `compras_ibfk_1` FOREIGN KEY (`combustible_id`) REFERENCES `combustibles` (`id`),
      CONSTRAINT `compras_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

    $db->exec($sql);
    echo "Tabla 'compras' creada exitosamente.";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
