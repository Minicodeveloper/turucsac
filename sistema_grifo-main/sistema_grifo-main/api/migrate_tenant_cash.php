<?php
require_once __DIR__ . '/config/database.php';

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("Ejecute esta migración desde CLI: php migrate_tenant_cash.php <empresa_id>\n");
}

$empresaId = filter_var($argv[1] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
if (!$empresaId) {
    fwrite(STDERR, "Debe indicar el ID de la empresa a la que se asignarán los datos heredados.\n");
    exit(1);
}

$db = (new Database())->getConnection();

function tableExists(PDO $db, string $table): bool
{
    $stmt = $db->prepare(
        'SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table'
    );
    $stmt->execute([':table' => $table]);
    return (int) $stmt->fetchColumn() > 0;
}

function columnExists(PDO $db, string $table, string $column): bool
{
    $stmt = $db->prepare(
        'SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND COLUMN_NAME = :column'
    );
    $stmt->execute([':table' => $table, ':column' => $column]);
    return (int) $stmt->fetchColumn() > 0;
}

try {
    $companyCheck = $db->prepare("SELECT id FROM empresas WHERE id = :id LIMIT 1");
    $companyCheck->execute([':id' => $empresaId]);
    if (!$companyCheck->fetchColumn()) {
        throw new RuntimeException("No existe la empresa con ID {$empresaId}.");
    }

    $db->exec(
        "CREATE TABLE IF NOT EXISTS cierres_caja (
            id BIGINT NOT NULL AUTO_INCREMENT,
            empresa_id INT NOT NULL,
            usuario_id INT NOT NULL,
            monto_inicial DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            efectivo_esperado DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            efectivo_real DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            tarjetas_monto DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            diferencia DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            justificacion TEXT NULL,
            fecha_cierre TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
            monto_sistema DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            monto_real DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            observaciones TEXT NULL,
            PRIMARY KEY (id),
            KEY idx_cierres_empresa_fecha (empresa_id, fecha_cierre),
            KEY idx_cierres_usuario_fecha (usuario_id, fecha_cierre),
            CONSTRAINT fk_cierres_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
            CONSTRAINT fk_cierres_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    $closureColumns = [
        'empresa_id' => 'INT NULL',
        'usuario_id' => 'INT NULL',
        'monto_inicial' => 'DECIMAL(10,2) NOT NULL DEFAULT 0.00',
        'efectivo_esperado' => 'DECIMAL(10,2) NULL',
        'efectivo_real' => 'DECIMAL(10,2) NULL',
        'tarjetas_monto' => 'DECIMAL(10,2) NOT NULL DEFAULT 0.00',
        'diferencia' => 'DECIMAL(10,2) NOT NULL DEFAULT 0.00',
        'justificacion' => 'TEXT NULL',
        'fecha_cierre' => 'TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)',
        'monto_sistema' => 'DECIMAL(10,2) NOT NULL DEFAULT 0.00',
        'monto_real' => 'DECIMAL(10,2) NOT NULL DEFAULT 0.00',
        'observaciones' => 'TEXT NULL',
    ];
    foreach ($closureColumns as $column => $definition) {
        if (!columnExists($db, 'cierres_caja', $column)) {
            $db->exec("ALTER TABLE cierres_caja ADD COLUMN `{$column}` {$definition}");
        }
    }
    $db->exec(
        "UPDATE cierres_caja SET empresa_id = {$empresaId} WHERE empresa_id IS NULL"
    );
    $db->exec(
        "UPDATE cierres_caja
         SET efectivo_esperado = COALESCE(efectivo_esperado, monto_sistema),
             efectivo_real = COALESCE(efectivo_real, monto_real),
             justificacion = COALESCE(justificacion, observaciones)
         WHERE efectivo_esperado IS NULL OR efectivo_real IS NULL"
    );
    $db->exec(
        'ALTER TABLE cierres_caja MODIFY fecha_cierre TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)'
    );

    $tenantTables = [
        'clientes', 'combustibles', 'compras', 'movimientos_kardex', 'ventas', 'gastos',
        'cierres_caja', 'gym_planes', 'gym_socios', 'gym_asistencias', 'gym_ingresos',
        'gym_instructores', 'empleados', 'cuentas_cobrar', 'cuentas_pagar',
        'conciliacion_bancaria', 'otros_egresos', 'otros_ingresos', 'planilla_pagos',
        'sucursales', 'transferencias', 'venta_pagos',
    ];

    foreach ($tenantTables as $table) {
        if (!tableExists($db, $table)) {
            continue;
        }

        if (!columnExists($db, $table, 'empresa_id')) {
            $db->exec("ALTER TABLE `{$table}` ADD COLUMN empresa_id INT NULL");
        }
        $db->exec("UPDATE `{$table}` SET empresa_id = {$empresaId} WHERE empresa_id IS NULL");

        $indexName = "idx_{$table}_empresa";
        $indexCheck = $db->prepare(
            'SELECT COUNT(*) FROM information_schema.STATISTICS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND COLUMN_NAME = \'empresa_id\''
        );
        $indexCheck->execute([':table' => $table]);
        if ((int) $indexCheck->fetchColumn() === 0) {
            $db->exec("ALTER TABLE `{$table}` ADD INDEX `{$indexName}` (empresa_id)");
        }

        $fkCheck = $db->prepare(
            'SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table
               AND COLUMN_NAME = \'empresa_id\' AND REFERENCED_TABLE_NAME = \'empresas\''
        );
        $fkCheck->execute([':table' => $table]);
        if ((int) $fkCheck->fetchColumn() === 0) {
            $constraintName = "fk_{$table}_empresa";
            $db->exec(
                "ALTER TABLE `{$table}` MODIFY empresa_id INT NOT NULL,
                 ADD CONSTRAINT `{$constraintName}` FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE"
            );
        } else {
            $db->exec("ALTER TABLE `{$table}` MODIFY empresa_id INT NOT NULL");
        }
    }

    foreach ([
        'clientes' => 'documento',
        'combustibles' => 'nombre_producto',
        'gym_socios' => 'nro_documento',
        'gym_instructores' => 'nro_documento',
    ] as $table => $column) {
        if (!tableExists($db, $table)) {
            continue;
        }
        $uniqueIndexes = $db->prepare(
            'SELECT INDEX_NAME FROM information_schema.STATISTICS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND NON_UNIQUE = 0
             GROUP BY INDEX_NAME
             HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) = :column'
        );
        $uniqueIndexes->execute([':table' => $table, ':column' => $column]);
        foreach ($uniqueIndexes->fetchAll(PDO::FETCH_COLUMN) as $index) {
            $db->exec("ALTER TABLE `{$table}` DROP INDEX `{$index}`");
        }
        $compositeIndex = "uq_{$table}_empresa_{$column}";
        $compositeCheck = $db->prepare(
            'SELECT COUNT(*) FROM information_schema.STATISTICS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND INDEX_NAME = :index_name'
        );
        $compositeCheck->execute([':table' => $table, ':index_name' => $compositeIndex]);
        if ((int) $compositeCheck->fetchColumn() === 0) {
            $db->exec("ALTER TABLE `{$table}` ADD UNIQUE KEY `{$compositeIndex}` (empresa_id, `{$column}`)");
        }
    }

    if (columnExists($db, 'ventas', 'fecha_venta')) {
        $db->exec(
            'ALTER TABLE ventas MODIFY fecha_venta TIMESTAMP(6) NULL DEFAULT CURRENT_TIMESTAMP(6)'
        );
    }

    echo "Migración aplicada. Los registros heredados sin empresa se asignaron a empresa_id={$empresaId}.\n";
} catch (Throwable $e) {
    fwrite(STDERR, "Error en migración: " . $e->getMessage() . PHP_EOL);
    exit(1);
}
