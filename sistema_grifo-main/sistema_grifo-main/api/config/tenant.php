<?php
// api/config/tenant.php

/**
 * Función para inyectar automáticamente el filtro por empresa_id en las consultas SQL
 * según el rol del usuario autenticado.
 */
function applyTenantFilter($query, $userRol, $empresaId, &$params) {
    // El Super Administrador de TURUCSAC tiene acceso global a todas las empresas
    if ($userRol === 'SUPER_ADMIN') {
        return $query;
    }

    // Para el resto de roles (ADMIN_EMPRESA, SUPERVISOR, CAJERO), filtramos obligatoriamente por su empresa_id
    $hasWhere = stripos($query, 'WHERE') !== false;
    $filter = $hasWhere ? " AND empresa_id = :tenant_empresa_id " : " WHERE empresa_id = :tenant_empresa_id ";
    
    $params[':tenant_empresa_id'] = $empresaId;
    
    return $query . $filter;
}