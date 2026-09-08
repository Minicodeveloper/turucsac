<?php
require __DIR__ . '/vendor/autoload.php';

use Greenter\Model\Client\Client;
use Greenter\Model\Company\Address;
use Greenter\Model\Company\Company;
use Greenter\Model\Sale\Note;
use Greenter\Model\Sale\SaleDetail;
use Greenter\Model\Sale\Legend;
use Greenter\See;
use Greenter\Ws\Services\SunatEndpoints;
use Greenter\XMLSecLibs\Certificate\X509Certificate;
use Greenter\XMLSecLibs\Certificate\X509ContentType;

// 1. Cargar el certificado generado
$certificatePath = __DIR__ . '/storage/certs/certificado_export.pfx';
$certificatePassword = 'Salchipapa123';

$pfxContent = file_get_contents($certificatePath);
$certificate = new X509Certificate($pfxContent, $certificatePassword);

$see = new See();
$see->setCertificate($certificate->export(X509ContentType::PEM));
$see->setCredentials('20000000001MODDATOS', 'moddatos');
$see->setService(SunatEndpoints::FE_BETA);

// 2. Datos del emisor
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

// 3. Datos del cliente (mismo cliente de la boleta)
$client = (new Client())
    ->setTipoDoc('1')
    ->setNumDoc('12345678')
    ->setRznSocial('CLIENTE DE PRUEBA');

// 4. Detalle exacto de la venta a revertir
$item = (new SaleDetail())
    ->setCodProducto('P001')
    ->setUnidad('NIU')
    ->setCantidad(1)
    ->setDescripcion('COMBUSTIBLE DIESEL B5 DE PRUEBA')
    ->setMtoBaseIgv(100.00)
    ->setPorcentajeIgv(18.00)
    ->setIgv(18.00)
    ->setTipAfeIgv('10')
    ->setTotalImpuestos(18.00)
    ->setMtoValorVenta(100.00)
    ->setMtoValorUnitario(100.00)
    ->setMtoPrecioUnitario(118.00);

// 5. Construcción de la Nota de Crédito
$note = (new Note())
    ->setUblVersion('2.1')
    ->setTipoDoc('07')                // 07 = Nota de Crédito
    ->setSerie('BB01')               // Serie que inicia con B para boletas
    ->setCorrelativo('1')
    ->setFechaEmision(new DateTime())
    ->setTipDocAfectado('03')        // 03 = Boleta de Venta
    ->setNumDocfectado('B001-1')     // Boleta exacta que estamos anulando
    ->setCodMotivo('01')             // 01 = Catálogo 09 SUNAT (Anulación de la operación)
    ->setDesMotivo('ANULACION DE LA OPERACION')
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

// 6. Envío a SUNAT
/** @var \Greenter\Model\Response\BillResult $result */
$result = $see->send($note);

// Guardar XML de la nota de crédito
file_put_contents(__DIR__ . '/storage/xml/' . $note->getName() . '.xml', $see->getFactory()->getLastXml());

if (!$result->isSuccess()) {
    $error = $result->getError();
    echo "Error al anular: " . ($error ? $error->getCode() . " - " . $error->getMessage() : 'Desconocido') . "\n";
    exit(1);
}

// Guardar CDR de la anulación
/** @var \Greenter\Model\Response\CdrResponse $cdr */
$cdr = $result->getCdrResponse();
file_put_contents(__DIR__ . '/storage/cdr/R-' . $note->getName() . '.zip', $result->getCdrZip());

echo "=== ANULACIÓN REALIZADA CON ÉXITO ===\n";
echo "Estado: " . $cdr->getDescription() . "\n";
echo "Código SUNAT: " . $cdr->getCode() . "\n";
echo "XML Nota de Crédito: storage/xml/" . $note->getName() . ".xml\n";
echo "CDR Nota de Crédito: storage/cdr/R-" . $note->getName() . ".zip\n";