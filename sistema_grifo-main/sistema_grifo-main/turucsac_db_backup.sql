/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.14-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: turucsac_db
-- ------------------------------------------------------
-- Server version	10.11.14-MariaDB-0+deb12u2

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `cierres_caja`
--

DROP TABLE IF EXISTS `cierres_caja`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cierres_caja` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) DEFAULT NULL,
  `fecha_cierre` timestamp NULL DEFAULT current_timestamp(),
  `total_ventas` decimal(12,2) DEFAULT 0.00,
  `total_efectivo` decimal(12,2) DEFAULT 0.00,
  `total_tarjeta` decimal(12,2) DEFAULT 0.00,
  `total_yape` decimal(12,2) DEFAULT 0.00,
  `observaciones` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `cierres_caja_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cierres_caja`
--

LOCK TABLES `cierres_caja` WRITE;
/*!40000 ALTER TABLE `cierres_caja` DISABLE KEYS */;
/*!40000 ALTER TABLE `cierres_caja` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clientes`
--

DROP TABLE IF EXISTS `clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `documento` varchar(15) NOT NULL,
  `razon_social` varchar(150) NOT NULL,
  `direccion` varchar(200) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `tipo_cliente` enum('PERSONA','EMPRESA') NOT NULL DEFAULT 'PERSONA',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `documento` (`documento`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientes`
--

LOCK TABLES `clientes` WRITE;
/*!40000 ALTER TABLE `clientes` DISABLE KEYS */;
INSERT INTO `clientes` VALUES
(1,'00000000','PUBLICO GENERAL','N/A',NULL,NULL,'PERSONA','2026-05-27 02:50:42'),
(2,'20500000000','CLIENTE GENERICO S.A.C.','LIMA',NULL,NULL,'PERSONA','2026-05-27 02:50:42');
/*!40000 ALTER TABLE `clientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `combustibles`
--

DROP TABLE IF EXISTS `combustibles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `combustibles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_producto` varchar(100) NOT NULL,
  `precio_por_galon` decimal(10,2) NOT NULL,
  `stock_galones` decimal(10,3) NOT NULL DEFAULT 5000.000,
  `estado` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre_producto` (`nombre_producto`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `combustibles`
--

LOCK TABLES `combustibles` WRITE;
/*!40000 ALTER TABLE `combustibles` DISABLE KEYS */;
INSERT INTO `combustibles` VALUES
(1,'98 Octanos',21.50,5000.000,1),
(2,'Diesel',14.80,5000.000,1),
(3,'Gasolina 84',15.20,5000.000,1),
(4,'GLP',7.50,5000.000,1),
(5,'GNV',1.65,5000.000,1),
(6,'Premium',18.90,5000.000,1),
(7,'Regular',16.60,5000.000,1);
/*!40000 ALTER TABLE `combustibles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `compras`
--

DROP TABLE IF EXISTS `compras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `compras` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `combustible_id` int(11) NOT NULL,
  `proveedor` varchar(200) DEFAULT NULL,
  `galones` decimal(10,3) NOT NULL,
  `costo_total` decimal(10,2) NOT NULL,
  `nro_factura` varchar(50) DEFAULT NULL,
  `fecha_compra` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `combustible_id` (`combustible_id`),
  CONSTRAINT `compras_ibfk_1` FOREIGN KEY (`combustible_id`) REFERENCES `combustibles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `compras`
--

LOCK TABLES `compras` WRITE;
/*!40000 ALTER TABLE `compras` DISABLE KEYS */;
/*!40000 ALTER TABLE `compras` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conciliacion_bancaria`
--

DROP TABLE IF EXISTS `conciliacion_bancaria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `conciliacion_bancaria` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `fecha` date DEFAULT NULL,
  `concepto` varchar(255) DEFAULT NULL,
  `monto` decimal(10,2) NOT NULL,
  `tipo` enum('INGRESO','EGRESO') DEFAULT 'INGRESO',
  `conciliado` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conciliacion_bancaria`
--

LOCK TABLES `conciliacion_bancaria` WRITE;
/*!40000 ALTER TABLE `conciliacion_bancaria` DISABLE KEYS */;
/*!40000 ALTER TABLE `conciliacion_bancaria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cuentas_cobrar`
--

DROP TABLE IF EXISTS `cuentas_cobrar`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cuentas_cobrar` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `cliente_id` int(11) DEFAULT NULL,
  `monto` decimal(10,2) NOT NULL,
  `saldo` decimal(10,2) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `estado` enum('PENDIENTE','PAGADO','PARCIAL') DEFAULT 'PENDIENTE',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cuentas_cobrar`
--

LOCK TABLES `cuentas_cobrar` WRITE;
/*!40000 ALTER TABLE `cuentas_cobrar` DISABLE KEYS */;
/*!40000 ALTER TABLE `cuentas_cobrar` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cuentas_pagar`
--

DROP TABLE IF EXISTS `cuentas_pagar`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cuentas_pagar` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `proveedor` varchar(200) DEFAULT NULL,
  `monto` decimal(10,2) NOT NULL,
  `saldo` decimal(10,2) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `estado` enum('PENDIENTE','PAGADO','PARCIAL') DEFAULT 'PENDIENTE',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cuentas_pagar`
--

LOCK TABLES `cuentas_pagar` WRITE;
/*!40000 ALTER TABLE `cuentas_pagar` DISABLE KEYS */;
/*!40000 ALTER TABLE `cuentas_pagar` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `empleados`
--

DROP TABLE IF EXISTS `empleados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `empleados` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) NOT NULL,
  `documento` varchar(20) DEFAULT NULL,
  `cargo` varchar(100) DEFAULT NULL,
  `sueldo` decimal(10,2) DEFAULT 0.00,
  `estado` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `empleados`
--

LOCK TABLES `empleados` WRITE;
/*!40000 ALTER TABLE `empleados` DISABLE KEYS */;
/*!40000 ALTER TABLE `empleados` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gastos`
--

DROP TABLE IF EXISTS `gastos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `gastos` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(255) NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `categoria` varchar(100) DEFAULT NULL,
  `fecha_gasto` timestamp NULL DEFAULT current_timestamp(),
  `usuario_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gastos`
--

LOCK TABLES `gastos` WRITE;
/*!40000 ALTER TABLE `gastos` DISABLE KEYS */;
/*!40000 ALTER TABLE `gastos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gym_asistencias`
--

DROP TABLE IF EXISTS `gym_asistencias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `gym_asistencias` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `socio_id` int(11) NOT NULL,
  `tipo` enum('ENTRADA','SALIDA') NOT NULL,
  `fecha_hora` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `socio_id` (`socio_id`),
  CONSTRAINT `gym_asistencias_ibfk_1` FOREIGN KEY (`socio_id`) REFERENCES `gym_socios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gym_asistencias`
--

LOCK TABLES `gym_asistencias` WRITE;
/*!40000 ALTER TABLE `gym_asistencias` DISABLE KEYS */;
/*!40000 ALTER TABLE `gym_asistencias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gym_ingresos`
--

DROP TABLE IF EXISTS `gym_ingresos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `gym_ingresos` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `socio_id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `metodo_pago` varchar(50) DEFAULT 'Efectivo',
  `fecha_pago` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `socio_id` (`socio_id`),
  KEY `plan_id` (`plan_id`),
  CONSTRAINT `gym_ingresos_ibfk_1` FOREIGN KEY (`socio_id`) REFERENCES `gym_socios` (`id`),
  CONSTRAINT `gym_ingresos_ibfk_2` FOREIGN KEY (`plan_id`) REFERENCES `gym_planes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gym_ingresos`
--

LOCK TABLES `gym_ingresos` WRITE;
/*!40000 ALTER TABLE `gym_ingresos` DISABLE KEYS */;
/*!40000 ALTER TABLE `gym_ingresos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gym_instructores`
--

DROP TABLE IF EXISTS `gym_instructores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `gym_instructores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nro_documento` varchar(20) NOT NULL,
  `nombre_completo` varchar(150) NOT NULL,
  `especialidad` varchar(100) DEFAULT NULL,
  `turno` varchar(20) DEFAULT 'Mañana',
  `telefono` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nro_documento` (`nro_documento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gym_instructores`
--

LOCK TABLES `gym_instructores` WRITE;
/*!40000 ALTER TABLE `gym_instructores` DISABLE KEYS */;
/*!40000 ALTER TABLE `gym_instructores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gym_planes`
--

DROP TABLE IF EXISTS `gym_planes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `gym_planes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `duracion_dias` int(11) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gym_planes`
--

LOCK TABLES `gym_planes` WRITE;
/*!40000 ALTER TABLE `gym_planes` DISABLE KEYS */;
INSERT INTO `gym_planes` VALUES
(1,'Mensual Básico',80.00,30,'Acceso ilimitado a equipos de musculación',1),
(2,'Mensual Plus',120.00,30,'Equipos + acceso a clases grupales',1),
(3,'Trimestral',320.00,90,'Ahorra S/ 40 — todo incluido por 3 meses',1),
(4,'Anual VIP',1100.00,365,'Acceso total + sesiones con nutricionista',1);
/*!40000 ALTER TABLE `gym_planes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gym_socios`
--

DROP TABLE IF EXISTS `gym_socios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `gym_socios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nro_documento` varchar(20) NOT NULL,
  `nombre_completo` varchar(150) NOT NULL,
  `plan_id` int(11) DEFAULT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_vencimiento` date NOT NULL,
  `estado` enum('ACTIVO','VENCIDO','INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `nro_documento` (`nro_documento`),
  KEY `plan_id` (`plan_id`),
  CONSTRAINT `gym_socios_ibfk_1` FOREIGN KEY (`plan_id`) REFERENCES `gym_planes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gym_socios`
--

LOCK TABLES `gym_socios` WRITE;
/*!40000 ALTER TABLE `gym_socios` DISABLE KEYS */;
/*!40000 ALTER TABLE `gym_socios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimientos_kardex`
--

DROP TABLE IF EXISTS `movimientos_kardex`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimientos_kardex` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `combustible_id` int(11) NOT NULL,
  `tipo_movimiento` enum('ENTRADA','SALIDA','AJUSTE') NOT NULL,
  `cantidad` decimal(10,3) NOT NULL,
  `stock_anterior` decimal(10,3) NOT NULL,
  `stock_actual` decimal(10,3) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `fecha_movimiento` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `combustible_id` (`combustible_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `movimientos_kardex_ibfk_1` FOREIGN KEY (`combustible_id`) REFERENCES `combustibles` (`id`),
  CONSTRAINT `movimientos_kardex_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimientos_kardex`
--

LOCK TABLES `movimientos_kardex` WRITE;
/*!40000 ALTER TABLE `movimientos_kardex` DISABLE KEYS */;
/*!40000 ALTER TABLE `movimientos_kardex` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `otros_egresos`
--

DROP TABLE IF EXISTS `otros_egresos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `otros_egresos` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(255) NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `fecha` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otros_egresos`
--

LOCK TABLES `otros_egresos` WRITE;
/*!40000 ALTER TABLE `otros_egresos` DISABLE KEYS */;
/*!40000 ALTER TABLE `otros_egresos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `otros_ingresos`
--

DROP TABLE IF EXISTS `otros_ingresos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `otros_ingresos` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(255) NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `fecha` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otros_ingresos`
--

LOCK TABLES `otros_ingresos` WRITE;
/*!40000 ALTER TABLE `otros_ingresos` DISABLE KEYS */;
/*!40000 ALTER TABLE `otros_ingresos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `planilla_pagos`
--

DROP TABLE IF EXISTS `planilla_pagos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `planilla_pagos` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `empleado_id` int(11) DEFAULT NULL,
  `monto` decimal(10,2) NOT NULL,
  `periodo` varchar(20) DEFAULT NULL,
  `fecha_pago` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `planilla_pagos`
--

LOCK TABLES `planilla_pagos` WRITE;
/*!40000 ALTER TABLE `planilla_pagos` DISABLE KEYS */;
/*!40000 ALTER TABLE `planilla_pagos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sucursales`
--

DROP TABLE IF EXISTS `sucursales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sucursales` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) NOT NULL,
  `direccion` varchar(200) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `estado` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sucursales`
--

LOCK TABLES `sucursales` WRITE;
/*!40000 ALTER TABLE `sucursales` DISABLE KEYS */;
/*!40000 ALTER TABLE `sucursales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transferencias`
--

DROP TABLE IF EXISTS `transferencias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `transferencias` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `origen` varchar(100) DEFAULT NULL,
  `destino` varchar(100) DEFAULT NULL,
  `monto` decimal(10,2) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `fecha` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transferencias`
--

LOCK TABLES `transferencias` WRITE;
/*!40000 ALTER TABLE `transferencias` DISABLE KEYS */;
/*!40000 ALTER TABLE `transferencias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nro_documento` varchar(20) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `nombre_completo` varchar(150) NOT NULL,
  `rol` enum('admin','cajero','supervisor') NOT NULL DEFAULT 'cajero',
  `token` varchar(64) DEFAULT NULL,
  `token_expiry` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `nro_documento` (`nro_documento`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES
(1,'77665544','$2y$10$Nxap1Yc7wWrxFqLQfSz7g.YiWQpwz4j3qM28QVYxBa3ahK0XvZSfO','Admin Sistema Grifos','admin','39e95264c0a79e02b540a075d1ca6c63c7eaf5421f41afa5400cedee30681f27','2026-05-28 03:30:23','2026-05-27 02:50:42');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `venta_pagos`
--

DROP TABLE IF EXISTS `venta_pagos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `venta_pagos` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `venta_id` bigint(20) DEFAULT NULL,
  `monto` decimal(10,2) NOT NULL,
  `metodo_pago` varchar(50) DEFAULT 'Efectivo',
  `fecha_pago` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `venta_pagos`
--

LOCK TABLES `venta_pagos` WRITE;
/*!40000 ALTER TABLE `venta_pagos` DISABLE KEYS */;
/*!40000 ALTER TABLE `venta_pagos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ventas`
--

DROP TABLE IF EXISTS `ventas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ventas` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `ticket_id` varchar(50) NOT NULL,
  `combustible_id` int(11) NOT NULL,
  `galones` decimal(10,3) NOT NULL,
  `monto_total` decimal(10,2) NOT NULL,
  `cliente_id` int(11) DEFAULT 1,
  `placa` varchar(15) DEFAULT NULL,
  `metodo_pago` varchar(50) DEFAULT 'Efectivo',
  `tipo_comprobante` varchar(50) DEFAULT 'Boleta',
  `fecha_venta` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ticket_id` (`ticket_id`),
  KEY `combustible_id` (`combustible_id`),
  KEY `cliente_id` (`cliente_id`),
  CONSTRAINT `ventas_ibfk_1` FOREIGN KEY (`combustible_id`) REFERENCES `combustibles` (`id`),
  CONSTRAINT `ventas_ibfk_2` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ventas`
--

LOCK TABLES `ventas` WRITE;
/*!40000 ALTER TABLE `ventas` DISABLE KEYS */;
/*!40000 ALTER TABLE `ventas` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-26 22:32:45
