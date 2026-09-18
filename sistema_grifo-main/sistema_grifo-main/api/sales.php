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

if ($method === 'GET') {
    try {
        $query = "SELECT v.id, v.ticket_id, c.nombre_producto, v.galones, v.monto_total, v.fecha_venta,
                          v.serie, v.correlativo, v.sunat_codigo, v.sunat_mensaje,
                          v.sunat_xml_path, v.sunat_cdr_path
                  FROM ventas v
                  JOIN combustibles c ON v.combustible_id = c.id
                  ORDER BY v.fecha_venta DESC
                  LIMIT 100";
        $stmt = $db->query($query);
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
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error DB: " . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método HTTP no soportado"]);
}
?>
