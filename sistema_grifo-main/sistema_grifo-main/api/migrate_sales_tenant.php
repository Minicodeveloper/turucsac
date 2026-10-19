<?php
require_once __DIR__ . '/config/database.php';

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("Run this migration from the command line.\n");
}

$db = (new Database())->getConnection();

try {
    $columns = $db->query("SHOW COLUMNS FROM ventas")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('empresa_id', $columns, true)) {
        throw new RuntimeException("La tabla ventas no tiene empresa_id; aplique primero la migración de empresas.");
    }

    if (!in_array('usuario_id', $columns, true)) {
        $db->exec("ALTER TABLE ventas ADD COLUMN usuario_id INT(11) DEFAULT NULL AFTER empresa_id");
    }

    $indexStmt = $db->prepare(
        "SELECT COUNT(*) FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ventas' AND COLUMN_NAME = 'usuario_id'"
    );
    $indexStmt->execute();
    if ((int) $indexStmt->fetchColumn() === 0) {
        $db->exec("ALTER TABLE ventas ADD INDEX idx_ventas_usuario_id (usuario_id)");
    }

    $constraints = $db->query(
        "SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ventas'
           AND COLUMN_NAME = 'usuario_id' AND REFERENCED_TABLE_NAME = 'usuarios'"
    )->fetchAll(PDO::FETCH_COLUMN);
    if (!$constraints) {
        $db->exec(
            "ALTER TABLE ventas
             ADD CONSTRAINT fk_ventas_usuario
             FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL"
        );
    }

    echo "Migración de ventas por empresa y usuario aplicada.\n";
} catch (Throwable $e) {
    fwrite(STDERR, "Error en migración: " . $e->getMessage() . PHP_EOL);
    exit(1);
}
