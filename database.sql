-- PhpMyAdmin SQL Dump
-- Host: localhost
-- Generation Time: Mar 30, 2026
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `turucsac_db`
--
CREATE DATABASE IF NOT EXISTS `turucsac_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `turucsac_db`;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clientes`
--

CREATE TABLE IF NOT EXISTS `clientes` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `clientes`
--

INSERT INTO `clientes` (`id`, `documento`, `razon_social`, `direccion`) VALUES
(1, '00000000', 'PUBLICO GENERAL', 'N/A'),
(2, '20500000000', 'CLIENTE GENERICO S.A.C.', 'LIMA');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `combustibles`
--

CREATE TABLE IF NOT EXISTS `combustibles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_producto` varchar(100) NOT NULL,
  `precio_por_galon` decimal(10,2) NOT NULL,
  `stock_galones` decimal(10,3) NOT NULL DEFAULT 5000.000,
  `estado` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre_producto` (`nombre_producto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `combustibles`
--

INSERT INTO `combustibles` (`nombre_producto`, `precio_por_galon`, `stock_galones`, `estado`) VALUES
('98 Octanos', 21.50, 5000.000, 1),
('Diesel', 14.80, 5000.000, 1),
('Gasolina 84', 15.20, 5000.000, 1),
('GLP', 7.50, 5000.000, 1),
('GNV', 1.65, 5000.000, 1),
('Premium', 18.90, 5000.000, 1),
('Regular', 16.60, 5000.000, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE IF NOT EXISTS `usuarios` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`nro_documento`, `password_hash`, `nombre_completo`, `rol`, `created_at`) VALUES
('77665544', '$2y$10$v4hXNPFB.JmNPS0qac.90O5pahpNycjotNJM8X1eOUHIOAtW0', 'Admin Sistema Grifos', 'admin', current_timestamp());

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ventas`
--

CREATE TABLE IF NOT EXISTS `ventas` (
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
  KEY `cliente_id` (`cliente_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `movimientos_kardex`
--

CREATE TABLE IF NOT EXISTS `movimientos_kardex` (
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
  KEY `usuario_id` (`usuario_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `ventas`
--
ALTER TABLE `ventas`
  ADD CONSTRAINT `ventas_ibfk_1` FOREIGN KEY (`combustible_id`) REFERENCES `combustibles` (`id`),
  ADD CONSTRAINT `ventas_ibfk_2` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `movimientos_kardex`
--
ALTER TABLE `movimientos_kardex`
  ADD CONSTRAINT `movimientos_kardex_ibfk_1` FOREIGN KEY (`combustible_id`) REFERENCES `combustibles` (`id`),
  ADD CONSTRAINT `movimientos_kardex_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;

-- --------------------------------------------------------
-- GIMNASIO MODULE TABLES (Azure Identity Extension)
-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `gym_planes`
--
CREATE TABLE IF NOT EXISTS `gym_planes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `duracion_dias` int(11) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `gym_planes`
--
INSERT INTO `gym_planes` (`id`, `nombre`, `precio`, `duracion_dias`, `descripcion`) VALUES
(1, 'Mensual Básico', 80.00, 30, 'Acceso ilimitado a equipos de musculación'),
(2, 'Mensual Plus', 120.00, 30, 'Equipos + acceso a clases grupales'),
(3, 'Trimestral', 320.00, 90, 'Ahorra S/ 40 — todo incluido por 3 meses'),
(4, 'Anual VIP', 1100.00, 365, 'Acceso total + sesiones con nutricionista');

--
-- Estructura de tabla para la tabla `gym_socios`
--
CREATE TABLE IF NOT EXISTS `gym_socios` (
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

--
-- Estructura de tabla para la tabla `gym_asistencias`
--
CREATE TABLE IF NOT EXISTS `gym_asistencias` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `socio_id` int(11) NOT NULL,
  `tipo` enum('ENTRADA','SALIDA') NOT NULL,
  `fecha_hora` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `socio_id` (`socio_id`),
  CONSTRAINT `gym_asistencias_ibfk_1` FOREIGN KEY (`socio_id`) REFERENCES `gym_socios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Estructura de tabla para la tabla `gym_instructores`
--
CREATE TABLE IF NOT EXISTS `gym_instructores` (
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

--
-- Estructura de tabla para la tabla `gym_ingresos`
--
CREATE TABLE IF NOT EXISTS `gym_ingresos` (
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

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
