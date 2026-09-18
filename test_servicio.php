<?php
require_once __DIR__ . '/FacturacionService.php';

$servicio = new FacturacionService();

$datosBoleta = [
    'serie' => 'B001',
    'correlativo' => '2',
    'cliente' => [
        'tipo_doc' => '1',
        'num_doc' => '87654321',
        'rzn_social' => 'JUAN PEREZ'
    ],
    'items' => [
        [
            'codigo' => 'G90',
            'descripcion' => 'GASOHOL REGULAR',
            'cantidad' => 2,
            'valor_unitario' => 50.00
        ]
    ],
    'leyenda_monto' => 'CIENTO DIECIOCHO CON 00/100 SOLES'
];

$resultado = $servicio->emitirBoleta($datosBoleta);
print_r($resultado);