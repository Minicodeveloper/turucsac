<?php
// api/install.php
// SEGURIDAD: Desactivado tras instalación inicial. 
// Comenta las siguientes líneas si realmente necesitas reinstalar.
die("ERROR: El asistente de instalacion esta desactivado por seguridad.");

require_once __DIR__ . '/config/database.php';

echo "<h1>Asistente de Instalación de Base de Datos TURUCSAC</h1>";
echo "<pre>";

$db = new Database();
$conn = $db->getConnection();
$dbName = $db->getDbName();

try {
    // 1. Crear Base de Datos si no existe
    echo "[*] Verificando base de datos '$dbName'...\n";
    $conn->exec("CREATE DATABASE IF NOT EXISTS `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $conn->exec("USE `$dbName`");
    echo "[OK] Base de datos lista.\n\n";

    // 2. Crear Tablas
    echo "[*] Creando estructura de tablas...\n";
    
    // Tabla Usuarios
    $sqlUsuarios = "CREATE TABLE IF NOT EXISTS `usuarios` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `nro_documento` varchar(20) NOT NULL UNIQUE,
        `password_hash` varchar(255) NOT NULL,
        `nombre_completo` varchar(150) NOT NULL,
        `rol` enum('admin','cajero','supervisor') NOT NULL DEFAULT 'cajero',
        `token` varchar(64) DEFAULT NULL,
        `token_expiry` datetime DEFAULT NULL,
        `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    $conn->exec($sqlUsuarios);
    
    // Tabla Clientes
    $sqlClientes = "CREATE TABLE IF NOT EXISTS `clientes` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `documento` varchar(15) NOT NULL UNIQUE,
        `razon_social` varchar(150) NOT NULL,
        `direccion` varchar(200) DEFAULT NULL,
        `telefono` varchar(20) DEFAULT NULL,
        `email` varchar(100) DEFAULT NULL,
        `tipo_cliente` enum('PERSONA','EMPRESA') NOT NULL DEFAULT 'PERSONA',
        `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    $conn->exec($sqlClientes);

    // Tabla Combustibles
    $sqlCombustibles = "CREATE TABLE IF NOT EXISTS `combustibles` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `nombre_producto` varchar(100) NOT NULL UNIQUE,
        `precio_por_galon` decimal(10,2) NOT NULL,
        `stock_galones` decimal(10,3) NOT NULL DEFAULT 5000.000,
        `estado` tinyint(1) NOT NULL DEFAULT 1,
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    $conn->exec($sqlCombustibles);

    // Tabla Ventas
    $sqlVentas = "CREATE TABLE IF NOT EXISTS `ventas` (
        `id` bigint(20) NOT NULL AUTO_INCREMENT,
        `ticket_id` varchar(50) NOT NULL UNIQUE,
        `combustible_id` int(11) NOT NULL,
        `galones` decimal(10,3) NOT NULL,
        `monto_total` decimal(10,2) NOT NULL,
        `cliente_id` int(11) DEFAULT 1,
        `placa` varchar(15) DEFAULT NULL,
        `metodo_pago` varchar(50) DEFAULT 'Efectivo',
        `tipo_comprobante` varchar(50) DEFAULT 'Boleta',
        `fecha_venta` timestamp DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        FOREIGN KEY (`combustible_id`) REFERENCES `combustibles`(`id`),
        FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    $conn->exec($sqlVentas);

    // Tabla Movimientos Kardex
    $sqlKardex = "CREATE TABLE IF NOT EXISTS `movimientos_kardex` (
        `id` bigint(20) NOT NULL AUTO_INCREMENT,
        `combustible_id` int(11) NOT NULL,
        `tipo_movimiento` ENUM('ENTRADA', 'SALIDA', 'AJUSTE') NOT NULL,
        `cantidad` decimal(10,3) NOT NULL,
        `stock_anterior` decimal(10,3) NOT NULL,
        `stock_actual` decimal(10,3) NOT NULL,
        `descripcion` varchar(255) DEFAULT NULL,
        `usuario_id` int(11) DEFAULT NULL,
        `fecha_movimiento` timestamp DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        FOREIGN KEY (`combustible_id`) REFERENCES `combustibles`(`id`),
        FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    $conn->exec($sqlKardex);
    
    echo "[OK] Estructura completa creada.\n\n";

    // 3. Insertar Datos por Defecto (Seed)
    echo "[*] Insertando datos iniciales...\n";

    // Clientes Base
    $stmtCli = $conn->query("SELECT COUNT(*) FROM `clientes` WHERE `documento` = '00000000'");
    if ($stmtCli->fetchColumn() == 0) {
        $conn->exec("INSERT INTO `clientes` (`id`, `documento`, `razon_social`, `direccion`) VALUES (1, '00000000', 'PUBLICO GENERAL', 'N/A')");
        echo "[+] Cliente Genérico creado.\n";
    }

    // Administrador (DNI: 77665544 / Pass: 12345)
    $stmtUser = $conn->prepare("SELECT COUNT(*) FROM `usuarios` WHERE `nro_documento` = '77665544'");
    $stmtUser->execute();
    if ($stmtUser->fetchColumn() == 0) {
        $hashObj = password_hash('12345', PASSWORD_BCRYPT);
        $insertUser = $conn->prepare("INSERT INTO `usuarios` (`nro_documento`, `password_hash`, `nombre_completo`, `rol`) VALUES (?, ?, ?, ?)");
        $insertUser->execute(['77665544', $hashObj, 'Admin Sistema Grifos', 'admin']);
        echo "[+] Usuario administrador creado (77665544/12345).\n";
    }

    // Combustibles Base
    $stmtComb = $conn->query("SELECT COUNT(*) FROM `combustibles`");
    if ($stmtComb->fetchColumn() == 0) {
        $combustibles_default = [
            ['Gasolina 84', 15.20],
            ['Regular', 16.60], 
            ['Premium', 18.90],
            ['98 Octanos', 21.50],
            ['Diesel', 14.80],
            ['GNV', 1.65],
            ['GLP', 7.50]
        ];
        
        $insertComb = $conn->prepare("INSERT INTO `combustibles` (`nombre_producto`, `precio_por_galon`) VALUES (?, ?)");
        foreach ($combustibles_default as $c) {
            $insertComb->execute($c);
            echo "[+] Producto insertado: " . $c[0] . "\n";
        }
    }

    echo "\n<h3>¡Instalación completada exitosamente!</h3>";
    echo "<p>Cierra esta ventana y utiliza el sistema de Login.</p>";

} catch(PDOException $e) {
    echo "\n\n[ERROR CRÍTICO]: " . $e->getMessage();
}
echo "</pre>";
?>
