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

    public function __construct()
    {
        $this->inicializarGreenter();
    }

    private function inicializarGreenter(): void
    {
        $certPath = __DIR__ . '/' . Config::get('CERT_PATH', 'storage/certs/certificado_export.pfx');
        $certPass = Config::get('CERT_PASS', '');

        if (!file_exists($certPath)) {
            throw new RuntimeException("No se encontró el certificado en: {$certPath}");
        }

        $pfxContent = file_get_contents($certPath);
        $certificate = new X509Certificate($pfxContent, $certPass);

        $this->see = new See();
        $this->see->setCertificate($certificate->export(X509ContentType::PEM));
        $this->see->setCredentials(Config::get('SUNAT_USUARIO'), Config::get('SUNAT_CLAVE'));

        $endpoint = (strtoupper((string) Config::get('SUNAT_ENV', 'BETA')) === 'PRODUCCION')
            ? SunatEndpoints::FE_PRODUCCION
            : SunatEndpoints::FE_BETA;

        $this->see->setService($endpoint);

        $address = (new Address())
            ->setUbigueo(Config::get('EMPRESA_UBIGEO'))
            ->setDepartamento(Config::get('EMPRESA_DEPARTAMENTO'))
            ->setProvincia(Config::get('EMPRESA_PROVINCIA'))
            ->setDistrito(Config::get('EMPRESA_DISTRITO'))
            ->setUrbanizacion('-')
            ->setDireccion(Config::get('EMPRESA_DIRECCION'));

        $this->company = (new Company())
            ->setRuc(Config::get('EMPRESA_RUC'))
            ->setRazonSocial(Config::get('EMPRESA_RAZON_SOCIAL'))
            ->setAddress($address);
    }

    public function emitirBoleta(array $data): array
    {
        $payload = $this->normalizarDatosVenta($data, '03');
        $invoice = $this->crearInvoice($payload, '03');

        return $this->procesarEnvio($invoice, $invoice->getName(), $payload);
    }

    public function emitirFactura(array $data): array
    {
        $payload = $this->normalizarDatosVenta($data, '01');
        $invoice = $this->crearInvoice($payload, '01');

        return $this->procesarEnvio($invoice, $invoice->getName(), $payload);
    }

    public function anularComprobante(array $data): array
    {
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
        $dbName = Config::get('DB_NAME', 'turucsac_db');
        $dbUser = Config::get('DB_USER', 'root');
        $dbPass = Config::get('DB_PASS', '');

        if ($host === '' || $dbName === '') {
            throw new RuntimeException('No hay configuración de base de datos disponible.');
        }

        $this->pdo = new PDO(
            "mysql:host={$host};dbname={$dbName};charset=utf8mb4",
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
        $rucEmisor = Config::get('EMPRESA_RUC', '');
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
                <h3 class="bold">' . htmlspecialchars(Config::get('EMPRESA_RAZON_SOCIAL', 'TURUC S.A.C.')) . '</h3>
                <p class="bold">R.U.C. ' . htmlspecialchars(Config::get('EMPRESA_RUC', '20613708457')) . '</p>
                <p>' . htmlspecialchars(Config::get('EMPRESA_DIRECCION', 'AV. PRINCIPAL 123')) . '</p>
                <p>' . htmlspecialchars(Config::get('EMPRESA_DISTRITO', 'LIMA')) . ' - ' . htmlspecialchars(Config::get('EMPRESA_PROVINCIA', 'LIMA')) . '</p>
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