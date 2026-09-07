<?php
require __DIR__ . '/vendor/autoload.php';

use DateTime;
use Greenter\Model\Client\Client;
use Greenter\Model\Company\Address;
use Greenter\Model\Company\Company;
use Greenter\Model\Sale\Invoice;
use Greenter\Model\Sale\SaleDetail;
use Greenter\Model\Sale\Legend;
use Greenter\Model\Sale\FormaPagos\FormaPagoContado;
use Greenter\See;
use Greenter\Ws\Services\SunatEndpoints;
use Greenter\XMLSecLibs\Certificate\X509Certificate;
use Greenter\XMLSecLibs\Certificate\X509ContentType;

// 1. Cargar el certificado digital exportado
$certificatePath = __DIR__ . '/storage/certs/certificado_export.pfx';
$certificatePassword = 'Salchipapa123';

$pfxContent = file_get_contents($certificatePath);
$certificate = new X509Certificate($pfxContent, $certificatePassword);

$see = new See();
$see->setCertificate($certificate->export(X509ContentType::PEM));

// 2. Credenciales SOL para SUNAT Beta
$see->setCredentials('20000000001MODDATOS', 'moddatos');
$see->setService(SunatEndpoints::FE_BETA);

// 3. Datos del emisor
$address = (new Address())
    ->setUbigueo('150101')
    ->setDepartamento('LIMA')
    ->setProvincia('LIMA')
    ->setDistrito('LIMA')
    ->setUrbanizacion('-')
    ->setDireccion('AV. PRINCIPAL 123');

$company = (new Company())
    ->setRuc('20613708457')
    ->setRazonSocial('TURUC S.A.C.')
    ->setAddress($address);

// 4. Datos del receptor (Cliente)
$client = (new Client())
    ->setTipoDoc('1') // 1 = DNI
    ->setNumDoc('12345678')
    ->setRznSocial('CLIENTE DE PRUEBA');

// 5. Línea de detalle (Producto)
$item = (new SaleDetail())
    ->setCodProducto('P001')
    ->setUnidad('NIU')
    ->setCantidad(1)
    ->setDescripcion('COMBUSTIBLE DIESEL B5 DE PRUEBA')
    ->setMtoBaseIgv(100.00)
    ->setPorcentajeIgv(18.00)
    ->setIgv(18.00)
    ->setTipAfeIgv('10') // Gravado - Operación Onerosa
    ->setTotalImpuestos(18.00)
    ->setMtoValorVenta(100.00)
    ->setMtoValorUnitario(100.00)
    ->setMtoPrecioUnitario(118.00);

// 6. Cabecera del comprobante (Boleta B001-1)
$invoice = (new Invoice())
    ->setUblVersion('2.1')
    ->setTipoOperacion('0101') // Venta interna
    ->setTipoDoc('03')        // 03 = Boleta de Venta
    ->setSerie('B001')
    ->setCorrelativo('1')
    ->setFechaEmision(new DateTime())
    ->setFormaPago(new FormaPagoContado())
    ->setTipoMoneda('PEN')
    ->setCompany($company)
    ->setClient($client)
    ->setMtoOperGravadas(100.00)
    ->setMtoIGV(18.00)
    ->setTotalImpuestos(18.00)
    ->setValorVenta(100.00)
    ->setSubTotal(118.00)
    ->setMtoImpVenta(118.00)
    ->setDetails([$item])
    ->setLegends([
        (new Legend())
            ->setCode('1000')
            ->setValue('CIENTO DIECIOCHO CON 00/100 SOLES')
    ]);

// 7. Envío del comprobante a SUNAT
/** @var \Greenter\Model\Response\BillResult $result */
$result = $see->send($invoice);

// Guardar XML generado y firmado
file_put_contents(__DIR__ . '/storage/xml/' . $invoice->getName() . '.xml', $see->getFactory()->getLastXml());

// Validar respuesta de SUNAT
if (!$result->isSuccess()) {
    $error = $result->getError();
    echo "Error de envío: " . ($error ? $error->getCode() . " - " . $error->getMessage() : 'Desconocido') . "\n";
    exit(1);
}

// Guardar constancia de recepción (CDR)
/** @var \Greenter\Model\Response\CdrResponse $cdr */
$cdr = $result->getCdrResponse();
file_put_contents(__DIR__ . '/storage/cdr/R-' . $invoice->getName() . '.zip', $result->getCdrZip());

echo "=== COMPROBANTE EMITIDO CON ÉXITO ===\n";
echo "Estado: " . $cdr->getDescription() . "\n";
echo "Código SUNAT: " . $cdr->getCode() . "\n";
echo "XML: storage/xml/" . $invoice->getName() . ".xml\n";
echo "CDR: storage/cdr/R-" . $invoice->getName() . ".zip\n";