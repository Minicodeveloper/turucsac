<?php
// api/sales.php
require_once __DIR__ . '/config/headers.php';
require_once __DIR__ . '/config/auth_middleware.php';
require_once __DIR__ . '/config/database.php';

$database = new Database();
$db = $database->getConnection();

function toPublicUrl(string $absolutePath): string
{
    if ($absolutePath === '') {
        return '';
    }

    $absolutePath = str_replace('\\', '/', $absolutePath);
    $projectRoot = str_replace('\\', '/', dirname(__DIR__));
    $relativePath = str_replace($projectRoot . '/', '', $absolutePath);

    return 'http://localhost:8081/' . ltrim($relativePath, '/');
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// ==========================================
// 1. OBTENER VENTAS / COMPROBANTES (GET)
// ==========================================
if ($method === 'GET') {
    try {
        $isSuperAdmin = strtoupper((string) USER_ROL) === 'SUPER_ADMIN';
        $query = "SELECT v.id, v.ticket_id, c.nombre_producto, v.galones, v.monto_total, v.fecha_venta,
                         v.serie, v.correlativo, v.sunat_codigo, v.sunat_mensaje,
                         v.sunat_xml_path, v.sunat_cdr_path, v.empresa_id, v.usuario_id,
                         e.razon_social AS empresa_nombre, e.ruc AS empresa_ruc,
                         u.nro_documento AS vendedor_documento, u.nombre_completo AS vendedor_nombre
                  FROM ventas v
                  LEFT JOIN combustibles c ON v.combustible_id = c.id
                  LEFT JOIN empresas e ON v.empresa_id = e.id
                  LEFT JOIN usuarios u ON v.usuario_id = u.id";
        if (!$isSuperAdmin) {
            $query .= " WHERE v.empresa_id = :empresa_id";
        }
        $query .= " ORDER BY v.fecha_venta DESC
                  LIMIT 100";
        $stmt = $db->prepare($query);
        if (!$isSuperAdmin) {
            $stmt->bindValue(':empresa_id', USER_EMPRESA_ID, PDO::PARAM_INT);
        }
        $stmt->execute();
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($result as &$row) {
            $row['sunat_xml_path'] = !empty($row['sunat_xml_path']) ? toPublicUrl($row['sunat_xml_path']) : null;
            $row['sunat_cdr_path'] = !empty($row['sunat_cdr_path']) ? toPublicUrl($row['sunat_cdr_path']) : null;

            $row['pdf_path'] = null;
            if (!empty($row['serie']) && !empty($row['correlativo'])) {
                $ticketPattern = __DIR__ . '/../storage/tickets/' . $row['serie'] . '-' . $row['correlativo'] . '-*.pdf';
                $files = glob($ticketPattern);

                if (!empty($files)) {
                    $row['pdf_path'] = 'http://localhost:8081/storage/tickets/' . basename($files[0]);
                }
            }
        }
        unset($row);

        echo json_encode([
            "success" => true,
            "data" => $result
        ]);
        exit;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error DB: " . $e->getMessage()]);
        exit;
    }
}

// ==========================================
// 2. ELIMINACIÓN Y DEPURACIÓN (DELETE / POST)
// ==========================================
if ($method === 'DELETE' || $action === 'delete_batch' || $action === 'purge_all') {
    // 2.1 Purgar todo el sandbox a cero
    if ($action === 'purge_all' || ($_GET['all'] ?? '') === 'true') {
        if (strtoupper((string) USER_ROL) !== 'SUPER_ADMIN') {
            http_response_code(403);
            echo json_encode(["success" => false, "message" => "Solo el superadministrador puede purgar todas las ventas."]);
            exit;
        }
        try {
            $db->exec("SET FOREIGN_KEY_CHECKS = 0;");
            $db->exec("TRUNCATE TABLE ventas;");
            try {
                $db->exec("DELETE FROM movimientos_kardex WHERE tipo_movimiento = 'VENTA';");
            } catch (Exception $e) {}
            $db->exec("SET FOREIGN_KEY_CHECKS = 1;");

            echo json_encode(["success" => true, "message" => "Base de datos purgada a cero."]);
            exit;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => $e->getMessage()]);
            exit;
        }
    }

    // 2.2 Eliminar lote seleccionado por IDs
    $rawInput = file_get_contents('php://input');
    $body = json_decode($rawInput, true);
    $ids = $body['ids'] ?? [];

    if (!empty($_GET['id'])) {
        $ids = [$_GET['id']];
    }

    if (empty($ids) || !is_array($ids)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "No se enviaron comprobantes para eliminar."]);
        exit;
    }

    try {
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $query = "DELETE FROM ventas WHERE (id IN ($placeholders) OR ticket_id IN ($placeholders))";
        if (strtoupper((string) USER_ROL) !== 'SUPER_ADMIN') {
            $query .= " AND empresa_id = ?";
        }
        $stmt = $db->prepare($query);
        $params = array_merge($ids, $ids);
        if (strtoupper((string) USER_ROL) !== 'SUPER_ADMIN') {
            $params[] = USER_EMPRESA_ID;
        }
        $stmt->execute($params);

        echo json_encode(["success" => true, "message" => "Comprobantes eliminados correctamente."]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
        exit;
    }
}

// Si no coincide con ninguno
http_response_code(405);
echo json_encode(["success" => false, "message" => "Método HTTP no soportado"]);
exit;