<?php

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/config.php';

use chillerlan\QRCode\QRCode;
use Dompdf\Dompdf;
use Dompdf\Options;
use Greenter\Model\Client\Client;
use Greenter\Model\Company\Address;
use Greenter\Model\Company\Company;
use Greenter\Model\Sale\FormaPagos\FormaPagoContado;
use Greenter\Model\Sale\Invoice;
use Greenter\Model\Sale\Legend;
use Greenter\Model\Sale\Note;
use Greenter\Model\Sale\SaleDetail;
use Greenter\See;
use Greenter\Ws\Services\SunatEndpoints;
use Greenter\XMLSecLibs\Certificate\X509Certificate;
use Greenter\XMLSecLibs\Certificate\X509ContentType;

class FacturacionService
{
    private See $see;
    private Company $company;
    private ?PDO $pdo = null;

    public function __construct(?int $empresaId = null)
    {
        $this->inicializarGreenter($empresaId);
    }

    /**
     * Carga el certificado digital y la información fiscal de la empresa en sesión
     */
    private function inicializarGreenter(?int $empresaId = null): void
    {
        $empresaId = $empresaId ?? ($_SESSION['empresa_id'] ?? 1);
        $empresaConfig = $this->obtenerConfiguracionEmpresa($empresaId);

        $certPath = (string) $empresaConfig['certificado_path'];
        $certPass = $empresaConfig['certificado_pass'];

        if ($certPath !== ''
            && !str_starts_with($certPath, DIRECTORY_SEPARATOR)
            && !str_starts_with($certPath, '\\\\')
            && preg_match('/^[A-Za-z]:[\\\\\/]/', $certPath) !== 1) {
            $certPath = __DIR__ . DIRECTORY_SEPARATOR . str_replace(
                ['/', '\\'],
                DIRECTORY_SEPARATOR,
                $certPath
            );
        }

        if ($certPath === '' || !is_file($certPath)) {
            throw new RuntimeException("No se encontró el certificado digital (.p12/.pfx) para la empresa: {$empresaConfig['razon_social']}");
        }

        $pfxContent = file_get_contents($certPath);
        if ($pfxContent === false) {
            throw new RuntimeException("No se pudo leer el certificado digital de {$empresaConfig['razon_social']}.");
        }

        $pkcs12 = [];
        if (!openssl_pkcs12_read($pfxContent, $pkcs12, (string) $certPass)
            || empty($pkcs12['cert'])
            || empty($pkcs12['pkey'])) {
            throw new RuntimeException("El certificado digital o su contraseña no son válidos para {$empresaConfig['razon_social']}.");
        }

        $ruc = (string) $empresaConfig['ruc'];
        if (!preg_match('/^\d{11}$/', $ruc)) {
            throw new RuntimeException("El RUC configurado para {$empresaConfig['razon_social']} no tiene 11 dígitos.");
        }

        $certificateDetails = openssl_x509_parse($pkcs12['cert']);
        $subjectText = implode(' ', array_map(
            static fn ($value): string => is_array($value) ? implode(' ', array_map('strval', $value)) : (string) $value,
            $certificateDetails['subject'] ?? []
        ));
        if (!str_contains($subjectText, $ruc)) {
            throw new RuntimeException("El RUC de {$empresaConfig['razon_social']} no coincide con el certificado digital configurado.");
        }

        $sunatEnv = strtoupper((string) Config::get('SUNAT_ENV', 'BETA'));
        if (in_array($sunatEnv, ['PRODUCTION', 'PRODUCCION'], true)) {
            $sunatUser = trim((string) Config::get('SUNAT_USUARIO', ''));
            $sunatPassword = trim((string) Config::get('SUNAT_CLAVE', ''));
            if ($sunatUser === ''
                || $sunatPassword === ''
                || str_contains(strtoupper($sunatUser), 'MODDATOS')
                || str_contains(strtoupper($sunatUser), 'TU_USUARIO')
                || strtolower($sunatPassword) === 'moddatos'
                || str_contains(strtoupper($sunatPassword), 'TU_CLAVE')) {
                throw new RuntimeException('Producción SUNAT está bloqueada: configure las credenciales SOL reales en el archivo .env.');
            }

            $address = trim((string) ($empresaConfig['direccion'] ?? ''));
            if ($address === '' || preg_match('/\b(PRUEBA|PRUEBAS|DEMO|EJEMPLO)\b/i', $address)) {
                throw new RuntimeException('Producción SUNAT está bloqueada: configure la dirección fiscal real de la empresa.');
            }
        }

        $certificate = new X509Certificate($pfxContent, $certPass);

        $this->see = new See();
        $this->see->setCertificate($certificate->export(X509ContentType::PEM));
        $this->see->setCredentials(
            Config::get('SUNAT_USUARIO', 'MODDATOS'),
            Config::get('SUNAT_CLAVE', 'moddatos')
        );

        $endpoint = in_array($sunatEnv, ['PRODUCTION', 'PRODUCCION'], true)
            ? SunatEndpoints::FE_PRODUCCION
            : SunatEndpoints::FE_BETA;

        $this->see->setService($endpoint);

        $address = (new Address())
            ->setUbigueo($empresaConfig['ubigeo'] ?? Config::get('EMPRESA_UBIGEO', '150101'))
            ->setDepartamento($empresaConfig['departamento'] ?? Config::get('EMPRESA_DEPARTAMENTO', 'LIMA'))
            ->setProvincia($empresaConfig['provincia'] ?? Config::get('EMPRESA_PROVINCIA', 'LIMA'))
            ->setDistrito($empresaConfig['distrito'] ?? Config::get('EMPRESA_DISTRITO', 'LIMA'))
            ->setUrbanizacion('-')
            ->setDireccion($empresaConfig['direccion'] ?? Config::get('EMPRESA_DIRECCION', 'AV. PRINCIPAL 123'));

        $this->company = (new Company())
            ->setRuc($empresaConfig['ruc'])
            ->setRazonSocial($empresaConfig['razon_social'])
            ->setAddress($address);
    }

    /**
     * Consulta la información de la empresa desde la BD
     */
    private function obtenerConfiguracionEmpresa(int $empresaId): array
    {
        $pdo = $this->getDbConnection();
        $stmt = $pdo->prepare("SELECT ruc, razon_social, direccion, certificado_path, certificado_pass FROM empresas WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $empresaId]);
        $empresa = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$empresa) {
            throw new RuntimeException("No existe una configuración fiscal para la empresa ID {$empresaId}.");
        }

        return $empresa;
    }

    public function emitirBoleta(array $data): array
    {
        if (isset($data['empresa_id'])) {
            $this->inicializarGreenter((int)$data['empresa_id']);
        }
        $payload = $this->normalizarDatosVenta($data, '03');
        $invoice = $this->crearInvoice($payload, '03');

        return $this->procesarEnvio($invoice, $invoice->getName(), $payload);
    }

    public function emitirFactura(array $data): array
    {
        if (isset($data['empresa_id'])) {
            $this->inicializarGreenter((int)$data['empresa_id']);
        }
        $payload = $this->normalizarDatosVenta($data, '01');
        $invoice = $this->crearInvoice($payload, '01');

        return $this->procesarEnvio($invoice, $invoice->getName(), $payload);
    }

    public function anularComprobante(array $data): array
    {
        if (isset($data['empresa_id'])) {
            $this->inicializarGreenter((int)$data['empresa_id']);
        }
        $payload = $this->normalizarDatosVenta($data, '07');
        $note = $this->crearNota($payload);

        return $this->procesarEnvio($note, $note->getName(), $payload);
    }

    public function generarTicketPdf(array $data, array $resultado): array
    {
        $qrData = $this->buildQrPayload($data, $resultado);
        $ticketDir = __DIR__ . '/storage/tickets';

        if (!is_dir($ticketDir)) {
            mkdir($ticketDir, 0777, true);
        }

        $fileName = sprintf(
            '%s-%s-%s.pdf',
            $data['serie'] ?? 'B001',
            $data['correlativo'] ?? '1',
            time()
        );

        $pdfPath = $ticketDir . '/' . $fileName;

        $options = new Options();
        $options->set('defaultFont', 'Courier');
        $options->set('isRemoteEnabled', true);

        $html = $this->renderTicketHtml($data, $resultado, $qrData);
        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper([0, 0, 226.77, 620.00], 'portrait');
        $dompdf->render();

        file_put_contents($pdfPath, $dompdf->output());

        return [
            'success' => true,
            'pdf_path' => $pdfPath,
            'qr_data' => $qrData,
        ];
    }

    public function generarCorrelativo(string $serie, string $tipoComprobante = 'Boleta'): int
    {
        try {
            $pdo = $this->getDbConnection();
            $stmt = $pdo->prepare(
                'SELECT COALESCE(MAX(correlativo), 0) + 1 AS siguiente FROM ventas WHERE serie = :serie AND tipo_comprobante = :tipo_comprobante'
            );
            $stmt->execute([
                ':serie' => $serie,
                ':tipo_comprobante' => $tipoComprobante,
            ]);

            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return (int) ($row['siguiente'] ?? 1);
        } catch (Throwable $e) {
            return 1;
        }
    }

    private function getDbConnection(): PDO
    {
        if ($this->pdo instanceof PDO) {
            return $this->pdo;
        }

        $host = Config::get('DB_HOST', '127.0.0.1');
        $port = Config::get('DB_PORT', '3307');
        $dbName = Config::get('DB_NAME', 'turucsac_db');
        $dbUser = Config::get('DB_USER', 'root');
        $dbPass = Config::get('DB_PASS', '');

        if ($host === '' || $dbName === '') {
            throw new RuntimeException('No hay configuración de base de datos disponible.');
        }

        $this->pdo = new PDO(
            "mysql:host={$host};port={$port};dbname={$dbName};charset=utf8mb4",
            $dbUser,
            $dbPass,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]
        );

        return $this->pdo;
    }

    private function normalizarDatosVenta(array $data, string $tipoDoc): array
    {
        $data['cliente'] = [
            'tipo_doc' => $data['cliente']['tipo_doc'] ?? '1',
            'num_doc' => $data['cliente']['num_doc'] ?? '00000000',
            'rzn_social' => $data['cliente']['rzn_social'] ?? 'CLIENTE GENERICO',
        ];

        $data['serie'] = $data['serie'] ?? Config::get(
            $tipoDoc === '01' ? 'SERIE_FACTURA' : 'SERIE_BOLETA',
            $tipoDoc === '01' ? 'F001' : 'B001'
        );
        $data['correlativo'] = $data['correlativo'] ?? $this->generarCorrelativo(
            $data['serie'],
            $tipoDoc === '01' ? 'Factura' : ($tipoDoc === '03' ? 'Boleta' : 'Nota de crédito')
        );

        $data['items'] = $data['items'] ?? [];

        return $data;
    }

    private function crearInvoice(array $data, string $tipoDoc): Invoice
    {
        $client = (new Client())
            ->setTipoDoc($data['cliente']['tipo_doc'])
            ->setNumDoc($data['cliente']['num_doc'])
            ->setRznSocial($data['cliente']['rzn_social']);

        $items = $this->construirItems($data['items']);

        $totalVenta = array_reduce(
            $items,
            static fn (float $carry, SaleDetail $item): float => $carry + (float) $item->getMtoPrecioUnitario(),
            0.00
        );

        $mtoOperGravadas = 0.0;
        $mtoIGV = 0.0;

        foreach ($data['items'] as $itemData) {
            $base = round((float) $itemData['cantidad'] * (float) $itemData['valor_unitario'], 2);
            $mtoOperGravadas += $base;
            $mtoIGV += round($base * 0.18, 2);
        }

        $invoice = (new Invoice())
            ->setUblVersion('2.1')
            ->setTipoOperacion('0101')
            ->setTipoDoc($tipoDoc)
            ->setSerie($data['serie'])
            ->setCorrelativo($data['correlativo'])
            ->setFechaEmision(new DateTime())
            ->setFormaPago(new FormaPagoContado())
            ->setTipoMoneda('PEN')
            ->setCompany($this->company)
            ->setClient($client)
            ->setMtoOperGravadas($mtoOperGravadas)
            ->setMtoIGV($mtoIGV)
            ->setTotalImpuestos($mtoIGV)
            ->setValorVenta($mtoOperGravadas)
            ->setSubTotal($totalVenta)
            ->setMtoImpVenta($totalVenta)
            ->setDetails($items)
            ->setLegends([
                (new Legend())
                    ->setCode('1000')
                    ->setValue($data['leyenda_monto'] ?? 'CIENTO DIECIOCHO CON 00/100 SOLES'),
            ]);

        return $invoice;
    }

    private function crearNota(array $data): Note
    {
        $client = (new Client())
            ->setTipoDoc($data['cliente']['tipo_doc'])
            ->setNumDoc($data['cliente']['num_doc'])
            ->setRznSocial($data['cliente']['rzn_social']);

        $items = $this->construirItems($data['items']);

        $mtoOperGravadas = 0.0;
        $mtoIGV = 0.0;
        $totalVenta = 0.0;

        foreach ($data['items'] as $itemData) {
            $base = round((float) $itemData['cantidad'] * (float) $itemData['valor_unitario'], 2);
            $mtoOperGravadas += $base;
            $mtoIGV += round($base * 0.18, 2);
            $totalVenta += round($base + ($base * 0.18), 2);
        }

        return (new Note())
            ->setUblVersion('2.1')
            ->setTipoDoc('07')
            ->setSerie($data['serie'])
            ->setCorrelativo($data['correlativo'])
            ->setFechaEmision(new DateTime())
            ->setTipDocAfectado($data['tipo_doc_afectado'] ?? '03')
            ->setNumDocfectado($data['doc_afectado'] ?? '')
            ->setCodMotivo($data['cod_motivo'] ?? '01')
            ->setDesMotivo($data['des_motivo'] ?? 'ANULACION DE LA OPERACION')
            ->setTipoMoneda('PEN')
            ->setCompany($this->company)
            ->setClient($client)
            ->setMtoOperGravadas($mtoOperGravadas)
            ->setMtoIGV($mtoIGV)
            ->setTotalImpuestos($mtoIGV)
            ->setValorVenta($mtoOperGravadas)
            ->setSubTotal($totalVenta)
            ->setMtoImpVenta($totalVenta)
            ->setDetails($items)
            ->setLegends([
                (new Legend())
                    ->setCode('1000')
                    ->setValue($data['leyenda_monto'] ?? 'CIENTO DIECIOCHO CON 00/100 SOLES'),
            ]);
    }

    private function construirItems(array $items): array
    {
        $result = [];

        foreach ($items as $itemData) {
            $base = round((float) $itemData['cantidad'] * (float) $itemData['valor_unitario'], 2);
            $igv = round($base * 0.18, 2);
            $precioUnitario = round((float) $itemData['valor_unitario'] * 1.18, 2);

            $result[] = (new SaleDetail())
                ->setCodProducto($itemData['codigo'])
                ->setUnidad($itemData['unidad'] ?? 'NIU')
                ->setCantidad($itemData['cantidad'])
                ->setDescripcion($itemData['descripcion'])
                ->setMtoBaseIgv($base)
                ->setPorcentajeIgv(18.00)
                ->setIgv($igv)
                ->setTipAfeIgv('10')
                ->setTotalImpuestos($igv)
                ->setMtoValorVenta($base)
                ->setMtoValorUnitario($itemData['valor_unitario'])
                ->setMtoPrecioUnitario($precioUnitario);
        }

        return $result;
    }

    private function procesarEnvio(object $document, string $docName, array $data = []): array
    {
        /** @var \Greenter\Model\Response\BillResult $result */
        $result = $this->see->send($document);

        $xmlPath = __DIR__ . '/storage/xml/' . $docName . '.xml';
        if (!is_dir(__DIR__ . '/storage/xml')) {
            mkdir(__DIR__ . '/storage/xml', 0777, true);
        }
        file_put_contents($xmlPath, $this->see->getFactory()->getLastXml());

        if (!$result->isSuccess()) {
            $error = $result->getError();
            $response = [
                'success' => false,
                'codigo' => $error ? $error->getCode() : 'ERR',
                'mensaje' => $error ? $error->getMessage() : 'Error de comunicación con SUNAT',
                'xml_path' => $xmlPath,
                'cdr_path' => null,
            ];

            $this->guardarResultadoVenta($data, $response);
            $ticket = $this->generarTicketPdf($data, $response);
            $response['pdf_path'] = $ticket['pdf_path'] ?? null;
            $response['qr_data'] = $ticket['qr_data'] ?? null;
            return $response;
        }

        /** @var \Greenter\Model\Response\CdrResponse $cdr */
        $cdr = $result->getCdrResponse();
        $cdrPath = __DIR__ . '/storage/cdr/R-' . $docName . '.zip';
        if (!is_dir(__DIR__ . '/storage/cdr')) {
            mkdir(__DIR__ . '/storage/cdr', 0777, true);
        }
        file_put_contents($cdrPath, $result->getCdrZip());

        $response = [
            'success' => true,
            'codigo' => $cdr->getCode(),
            'mensaje' => $cdr->getDescription(),
            'xml_path' => $xmlPath,
            'cdr_path' => $cdrPath,
        ];

        $this->guardarResultadoVenta($data, $response);
        $ticket = $this->generarTicketPdf($data, $response);
        $response['pdf_path'] = $ticket['pdf_path'] ?? null;
        $response['qr_data'] = $ticket['qr_data'] ?? null;
        return $response;
    }

    private function guardarResultadoVenta(array $data, array $resultado): void
    {
        if (empty($data['ticket_id']) && empty($data['venta_id'])) {
            return;
        }

        try {
            $pdo = $this->getDbConnection();
            $sql = empty($data['venta_id'])
                ? 'UPDATE ventas SET serie = :serie, correlativo = :correlativo, sunat_codigo = :codigo, sunat_mensaje = :mensaje, sunat_xml_path = :xml_path, sunat_cdr_path = :cdr_path WHERE ticket_id = :ticket_id'
                : 'UPDATE ventas SET serie = :serie, correlativo = :correlativo, sunat_codigo = :codigo, sunat_mensaje = :mensaje, sunat_xml_path = :xml_path, sunat_cdr_path = :cdr_path WHERE id = :venta_id';

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':serie' => $data['serie'] ?? 'B001',
                ':correlativo' => $data['correlativo'] ?? 1,
                ':codigo' => $resultado['codigo'] ?? null,
                ':mensaje' => $resultado['mensaje'] ?? null,
                ':xml_path' => $resultado['xml_path'] ?? null,
                ':cdr_path' => $resultado['cdr_path'] ?? null,
                ':ticket_id' => $data['ticket_id'] ?? null,
                ':venta_id' => $data['venta_id'] ?? null,
            ]);
        } catch (Throwable $e) {
            // Ignorar para no romper la emisión si la DB no está disponible.
        }
    }

    private function buildQrPayload(array $data, array $resultado): string
    {
        $rucEmisor = $this->company->getRuc();
        $tipoDocumento = $data['tipo_doc'] ?? '03';
        $serie = $data['serie'] ?? 'B001';
        $correlativo = $data['correlativo'] ?? '1';
        $total = $this->sumarTotalItems($data['items'] ?? []);

        return implode('|', [
            $rucEmisor,
            $tipoDocumento,
            $serie,
            $correlativo,
            number_format($total, 2, '.', ''),
            date('Y-m-d'),
            $resultado['codigo'] ?? '0',
        ]);
    }

    private function renderTicketHtml(array $data, array $resultado, string $qrData): string
    {
        $qrImage = (new QRCode())->render($qrData);

        $mtoOperGravadas = 0.0;
        $mtoIGV = 0.0;
        $totalVenta = 0.0;
        $itemsHtml = '';

        foreach ($data['items'] ?? [] as $item) {
            $cant = (float) ($item['cantidad'] ?? 0);
            $valUnit = (float) ($item['valor_unitario'] ?? 0);
            $precioUnit = round($valUnit * 1.18, 2);
            $subtotalItem = round($cant * $precioUnit, 2);
            $baseItem = round($cant * $valUnit, 2);

            $mtoOperGravadas += $baseItem;
            $mtoIGV += round($baseItem * 0.18, 2);
            $totalVenta += $subtotalItem;

            $itemsHtml .= '<tr>'
                . '<td style="padding: 2px 0;">' . htmlspecialchars((string) ($item['descripcion'] ?? 'Combustible')) . '<br>'
                . '<small>' . number_format($cant, 3) . ' GLL x S/ ' . number_format($precioUnit, 2) . '</small></td>'
                . '<td style="text-align: right; vertical-align: bottom;">S/ ' . number_format($subtotalItem, 2) . '</td>'
                . '</tr>';
        }

        $tipoDocNombre = ($data['tipo_doc'] ?? '03') === '01' ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA';
        $placa = !empty($data['placa']) ? strtoupper(trim((string) $data['placa'])) : 'S/P';
        $medioPago = !empty($data['medio_pago']) ? strtoupper(trim((string) $data['medio_pago'])) : 'EFECTIVO';
        $cajero = !empty($data['cajero']) ? htmlspecialchars((string) $data['cajero']) : 'ISLA 01';

        return '<!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Ticket</title>
            <style>
                @page { margin: 4px; }
                body {
                    font-family: "Courier New", Courier, monospace;
                    font-size: 9.5px;
                    line-height: 1.25;
                    color: #000;
                    margin: 0;
                    padding: 4px 6px;
                }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .bold { font-weight: bold; }
                .divider {
                    border-top: 1px dashed #000;
                    margin: 5px 0;
                }
                .header h3 { margin: 0; font-size: 13px; text-transform: uppercase; }
                .header p { margin: 1px 0; font-size: 9px; }
                .info-box { margin: 4px 0; }
                .placa-box {
                    border: 1.5px solid #000;
                    padding: 3px;
                    margin: 5px 0;
                    text-align: center;
                    font-size: 12px;
                    font-weight: bold;
                    letter-spacing: 1px;
                }
                table { width: 100%; border-collapse: collapse; margin: 4px 0; }
                .totales-table td { padding: 1.5px 0; }
                .qr-section { text-align: center; margin-top: 6px; }
                .qr-section img { width: 105px; height: 105px; }
                .footer-note { font-size: 8px; text-align: center; margin-top: 5px; }
            </style>
        </head>
        <body>
            <div class="header text-center">
                <h3 class="bold">' . htmlspecialchars($this->company->getRazonSocial()) . '</h3>
                <p class="bold">R.U.C. ' . htmlspecialchars($this->company->getRuc()) . '</p>
                <p>' . htmlspecialchars($this->company->getAddress()->getDireccion()) . '</p>
            </div>

            <div class="divider"></div>

            <div class="text-center">
                <div class="bold" style="font-size: 10.5px;">' . $tipoDocNombre . '</div>
                <div class="bold" style="font-size: 11px;">' . htmlspecialchars((string) ($data['serie'] ?? 'B001')) . '-' . str_pad((string) ($data['correlativo'] ?? '1'), 8, '0', STR_PAD_LEFT) . '</div>
            </div>

            <div class="divider"></div>

            <div class="info-box">
                <div><strong>FECHA:</strong> ' . date('d/m/Y H:i:s') . '</div>
                <div><strong>CLIENTE:</strong> ' . htmlspecialchars((string) ($data['cliente']['rzn_social'] ?? 'CLIENTES VARIOS')) . '</div>
                <div><strong>DOC/RUC:</strong> ' . htmlspecialchars((string) ($data['cliente']['num_doc'] ?? '00000000')) . '</div>
                <div><strong>FORMA PAGO:</strong> ' . $medioPago . '</div>
                <div><strong>ATENDIDO POR:</strong> ' . $cajero . '</div>
            </div>

            <div class="placa-box">
                PLACA: ' . $placa . '
            </div>

            <div class="divider"></div>

            <table>
                <thead>
                    <tr style="border-bottom: 1px dashed #000;">
                        <th style="text-align: left; padding-bottom: 2px;">DESCRIPCIÓN</th>
                        <th style="text-align: right; padding-bottom: 2px;">IMPORTE</th>
                    </tr>
                </thead>
                <tbody>' . $itemsHtml . '</tbody>
            </table>

            <div class="divider"></div>

            <table class="totales-table">
                <tr>
                    <td>OP. GRAVADA:</td>
                    <td class="text-right">S/ ' . number_format($mtoOperGravadas, 2) . '</td>
                </tr>
                <tr>
                    <td>I.G.V. (18%):</td>
                    <td class="text-right">S/ ' . number_format($mtoIGV, 2) . '</td>
                </tr>
                <tr class="bold" style="font-size: 12px;">
                    <td>TOTAL A PAGAR:</td>
                    <td class="text-right">S/ ' . number_format($totalVenta, 2) . '</td>
                </tr>
            </table>

            <div class="divider"></div>

            <div class="info-box" style="font-size: 8px;">
                <div><strong>ESTADO SUNAT:</strong> ' . htmlspecialchars((string) ($resultado['codigo'] ?? '0')) . ' - ' . htmlspecialchars((string) ($resultado['mensaje'] ?? 'ACEPTADO')) . '</div>
            </div>

            <div class="qr-section">
                <img src="' . $qrImage . '" alt="QR SUNAT">
            </div>

            <div class="footer-note">
                Representación impresa del Comprobante de Pago Electrónico.<br>
                Consulte su validez en <strong>turucsac.minicodevelopers.net.pe</strong><br>
                <em>¡Gracias por su preferencia!</em>
            </div>
        </body>
        </html>';
    }

    private function sumarTotalItems(array $items): float
    {
        $total = 0.0;

        foreach ($items as $item) {
            $cantidad = (float) ($item['cantidad'] ?? 0);
            $valorUnitario = (float) ($item['valor_unitario'] ?? 0);
            $total += $cantidad * $valorUnitario;
        }

        return round($total, 2);
    }
}