# 🛡️ Sistema Grifo ERP - Modernizado

Bienvenido al sistema de gestión operativa para estaciones de servicio (grifos). Esta versión ha sido completamente modernizada y securizada, migrando de una arquitectura Vanilla JS a un entorno robusto con **React** y **PHP API**.

## 🚀 Tecnologías
- **Frontend**: React 19, Vite, Tailwind CSS, Chart.js, jsPDF.
- **Backend**: PHP 8 (PDO), Middleware de Autenticación por Tokens Bearer.
- **Base de Datos**: MySQL (XAMPP).

## 💎 Características Principales

1. **Arquitectura Multi-Empresa (Multi-Tenant)**: 
   - Aislamiento estricto de datos. Cada empresa cliente administra exclusivamente su propia información (ventas, inventario, clientes y reportes) sin cruzar datos con otras organizaciones.
2. **Jerarquía de 4 Roles y Accesos (RBAC)**:
   - **Super Administrador**: Dueño global de la plataforma ERP encargado de crear empresas, administrar suscripciones y accesos.
   - **Administrador de Empresa**: Dueño del negocio particular; gestiona su configuración, sube su certificado digital y crea supervisores y cajeros.
   - **Supervisor**: Controla turnos, arqueos de caja, auditorías y supervisión operativa.
   - **Cajero / Bombero**: Operador en pista o counter enfocado exclusivamente en ventas rápidas en el POS y registro de asistencias.
3. **Gestión Dinámica de Certificados Digitales (`.p12`)**:
   - Cada empresa sube su propio archivo de certificado y clave privada directamente desde el panel de **Configuración**. Los comprobantes se firman dinámicamente con la identidad fiscal activa en sesión.
4. **Módulo de Anulación y Notas de Crédito**:
   - Anulación formal e irreversible de comprobantes aceptados mediante Notas de Crédito Electrónicas (Motivo 01 - Anulación de la operación), asegurando el registro en los servidores de la SUNAT y la obtención de los archivos CDR oficiales.
5. **Dashboard y Punto de Venta (POS) en Tiempo Real**:
   - Gráficas interactivas de ventas, alertas de stock crítico, kardex avanzado y generación de tickets y comprobantes profesionales.

## 🛠️ Instalación y Configuración

### 1. Requisitos
- XAMPP (Apache + MySQL).
- Node.js (v18 o superior).

### 2. Configuración Backend
1.  Copia la carpeta del proyecto a `C:\xampp\htdocs\Sistema_grifo`.
2.  Inicia Apache y MySQL desde el Panel de XAMPP.
3.  Accede a `http://localhost/Sistema_grifo/api/install.php` para inicializar la base de datos automáticamente.

### 3. Configuración Frontend
1.  Abre una terminal en `C:\xampp\htdocs\Sistema_grifo\frontend`.
2.  Ejecuta `npm install` para instalar las dependencias.
3.  Crea un archivo `.env` en esa misma carpeta con:
    ```env
    VITE_API_URL=http://localhost/Sistema_grifo/api
    ```
4.  Inicia el servidor de desarrollo: `npm run dev`.

## 👤 Credenciales por Defecto (Admin)
- **Documento (Usuario)**: `77665544`
- **Contraseña**: `12345`

---
*Desarrollado con ❤️ para TURUCSAC ERP.*


