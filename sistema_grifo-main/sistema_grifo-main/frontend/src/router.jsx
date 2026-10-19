import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Auth pages
import Login from './pages/Auth/Login';
import Landing from './pages/Landing/Landing';
import ModuleSelector from './pages/ModuleSelector/ModuleSelector';

// ─── Admin ────────────────────────────────────────────────
import AdminPanel from './pages/Admin/AdminPanel';
import AdminUsuarios from './pages/Admin/AdminUsuarios';
import AdminConfiguracion from './pages/Admin/AdminConfiguracion';

// ─── Grifo ────────────────────────────────────────────────
import Panel from './pages/Panel/Panel';
import Dashboard from './pages/Dashboard/Dashboard';
import POS from './pages/POS/POS';
import HistorialBoletas from './pages/Boletas/HistorialBoletas';
import Inventory from './pages/Inventory/Inventory';
import Compras from './pages/Compras/Compras';
import Finanzas from './pages/Finanzas/Finanzas';
import Conciliacion from './pages/Conciliacion/Conciliacion';
import Express from './pages/Express/Express';
import Customers from './pages/Customers/Customers';

// ─── Gimnasio ─────────────────────────────────────────────
import GymPanel from './pages/Gimnasio/GymPanel';
import Gimnasio from './pages/Gimnasio/Gimnasio';
import GymPlanes from './pages/Gimnasio/GymPlanes';
import GymAsistencias from './pages/Gimnasio/GymAsistencias';
import GymInstructores from './pages/Gimnasio/GymInstructores';
import GymIngresos from './pages/Gimnasio/GymIngresos';
import GymConfiguracion from './pages/Gimnasio/GymConfiguracion';

// ─── Guards Resilient a Mayúsculas y Minúsculas ───────────

// 1. Guard Autenticado Básico
const ProtectedRoute = ({ children }) => {
  const userStr = sessionStorage.getItem('usuario');
  if (!userStr) return <Navigate to="/login" replace />;
  return children;
};

// 2. Guard Flexible por Roles
const RoleRoute = ({ allowedRoles, children }) => {
  const userStr = sessionStorage.getItem('usuario');
  if (!userStr) return <Navigate to="/login" replace />;

  const user = JSON.parse(userStr);
  
  if (!user.id) return <Navigate to="/login" replace />;

  // Normalizar el rol a mayúsculas
  const currentRole = (user.rol || user.role || '').toUpperCase();

  // Mapear equivalencias legacy
  const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());
  if (normalizedAllowed.includes('SUPER_ADMIN')) normalizedAllowed.push('ADMIN');
  if (normalizedAllowed.includes('ADMIN_EMPRESA')) normalizedAllowed.push('ADMIN');

  // Si el rol no está permitido, redirige dinámicamente según su jerarquía
  if (!normalizedAllowed.includes(currentRole)) {
    if (['SUPER_ADMIN', 'ADMIN'].includes(currentRole)) {
      return <Navigate to="/admin" replace />;
    }
    if (currentRole === 'ADMIN_EMPRESA') {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/modulos" replace />;
  }

  return children;
};

// Alias de conveniencia
const P = ({ children }) => <ProtectedRoute>{children}</ProtectedRoute>;
const SuperAdminOnly = ({ children }) => <RoleRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>{children}</RoleRoute>;
const AdminCompanyOnly = ({ children }) => <RoleRoute allowedRoles={['SUPER_ADMIN', 'ADMIN_EMPRESA', 'ADMIN']}>{children}</RoleRoute>;
const SupervisorAndAbove = ({ children }) => <RoleRoute allowedRoles={['SUPER_ADMIN', 'ADMIN_EMPRESA', 'SUPERVISOR', 'ADMIN']}>{children}</RoleRoute>;

const router = createBrowserRouter([
  { path: '/',       element: <Landing /> },
  { path: '/login', element: <Login /> },

  // ─── Selector de Módulos (Sin bloqueos para ningún usuario logueado) ─────
  { path: '/modulos', element: <P><ModuleSelector /></P> },

  // ─── MUNDO ADMIN Y CONFIGURACIÓN DE EMPRESA ──────────────────────────
  { path: '/admin',               element: <SuperAdminOnly><AdminPanel /></SuperAdminOnly> },
  { path: '/admin/usuarios',      element: <AdminCompanyOnly><AdminUsuarios /></AdminCompanyOnly> },
  { path: '/admin/configuracion', element: <AdminCompanyOnly><AdminConfiguracion /></AdminCompanyOnly> },

  // ─── MUNDO GRIFO ────────────────────────────────────────────────────
  { path: '/panel',        element: <P><Panel /></P> },
  { path: '/dashboard',    element: <SupervisorAndAbove><Dashboard /></SupervisorAndAbove> },
  { path: '/pos',          element: <P><POS /></P> },
  { path: '/boletas',      element: <SupervisorAndAbove><HistorialBoletas /></SupervisorAndAbove> },
  { path: '/compras',      element: <SupervisorAndAbove><Compras /></SupervisorAndAbove> },
  { path: '/finanzas',     element: <AdminCompanyOnly><Finanzas /></AdminCompanyOnly> },
  { path: '/conciliacion', element: <SupervisorAndAbove><Conciliacion /></SupervisorAndAbove> },
  { path: '/express',      element: <P><Express /></P> },
  { path: '/inventario',   element: <SupervisorAndAbove><Inventory /></SupervisorAndAbove> },
  { path: '/clientes',     element: <P><Customers /></P> },

  // ─── MUNDO GIMNASIO ─────────────────────────────────────────────────
  { path: '/gimnasio',              element: <P><GymPanel /></P> },
  { path: '/gimnasio/socios',       element: <P><Gimnasio /></P> },
  { path: '/gimnasio/planes',       element: <AdminCompanyOnly><GymPlanes /></AdminCompanyOnly> },
  { path: '/gimnasio/asistencias',  element: <P><GymAsistencias /></P> },
  { path: '/gimnasio/instructores', element: <SupervisorAndAbove><GymInstructores /></SupervisorAndAbove> },
  { path: '/gimnasio/ingresos',     element: <SupervisorAndAbove><GymIngresos /></SupervisorAndAbove> },
  { path: '/gimnasio/configuracion',element: <AdminCompanyOnly><GymConfiguracion /></AdminCompanyOnly> },

], {
  basename: '/'
});

export default router;