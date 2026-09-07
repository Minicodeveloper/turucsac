# 🛡️ Sistema Grifo ERP - Modernizado

Bienvenido al sistema de gestión operativa para estaciones de servicio (grifos). Esta versión ha sido completamente modernizada y securizada, migrando de una arquitectura Vanilla JS a un entorno robusto con **React** y **PHP API**.

## 🚀 Tecnologías
- **Frontend**: React 19, Vite, Tailwind CSS, Chart.js, jsPDF.
- **Backend**: PHP 8 (PDO), Middleware de Autenticación por Tokens Bearer.
- **Base de Datos**: MySQL (XAMPP).

## 💎 Características Principales
1.  **Dashboard en Tiempo Real**: Gráficas interactivas de ventas y alertas de stock crítico.
2.  **Punto de Venta (POS)**: Interfaz rápida con búsqueda automática de clientes y generación de tickets PDF profesionales.
3.  **Kardex Avanzado**: Auditoría completa de cada gota de combustible que entra o sale del sistema.
4.  **Gestión de Clientes**: Base de datos centralizada para Personas y Empresas (DNI/RUC).
5.  **Seguridad P2**: 100% de consultas protegidas contra SQL Injection y autenticación persistente.

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
