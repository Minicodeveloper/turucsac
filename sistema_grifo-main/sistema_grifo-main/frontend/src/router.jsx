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
import Inventory from './pages/Inventory/Inventory';
import Compras from './pages/Compras/Compras';
import Finanzas from './pages/Finanzas/Finanzas';
import Conciliacion from './pages/Conciliacion/Conciliacion';
import Express from './pages/Express/Express';
import Customers from './pages/Customers/Customers';
import Settings from './pages/Settings/Settings';

// ─── Gimnasio ─────────────────────────────────────────────
import GymPanel from './pages/Gimnasio/GymPanel';
import Gimnasio from './pages/Gimnasio/Gimnasio';
import GymPlanes from './pages/Gimnasio/GymPlanes';
import GymAsistencias from './pages/Gimnasio/GymAsistencias';
import GymInstructores from './pages/Gimnasio/GymInstructores';
import GymIngresos from './pages/Gimnasio/GymIngresos';
import GymConfiguracion from './pages/Gimnasio/GymConfiguracion';

// ─── Guards ───────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const user = sessionStorage.getItem('usuario');
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const user = JSON.parse(sessionStorage.getItem('usuario') || '{}');
  if (!user.id) return <Navigate to="/login" replace />;
  if (user.rol !== 'admin') return <Navigate to="/modulos" replace />;
  return children;
};

// Rutas solo para operativos (bloquea admin)
const OperatorRoute = ({ children }) => {
  const user = JSON.parse(sessionStorage.getItem('usuario') || '{}');
  if (!user.id) return <Navigate to="/login" replace />;
  if (user.rol === 'admin') return <Navigate to="/admin" replace />;
  return children;
};

const P = ({ children }) => <ProtectedRoute>{children}</ProtectedRoute>;
const A = ({ children }) => <AdminRoute>{children}</AdminRoute>;
const O = ({ children }) => <OperatorRoute>{children}</OperatorRoute>;

const router = createBrowserRouter([
  { path: '/',      element: <Landing /> },
  { path: '/login', element: <Login /> },

  // ─── Selector de módulos (solo cajero/supervisor) ─────
  { path: '/modulos', element: <O><ModuleSelector /></O> },

  // ─── MUNDO ADMIN ─────────────────────────────────────
  { path: '/admin',                  element: <A><AdminPanel /></A> },
  { path: '/admin/usuarios',         element: <A><AdminUsuarios /></A> },
  { path: '/admin/configuracion',    element: <A><AdminConfiguracion /></A> },
  // Alias legacy

  // ─── MUNDO GRIFO ─────────────────────────────────────
  { path: '/panel',      element: <P><Panel /></P> },
  { path: '/dashboard',  element: <P><Dashboard /></P> },
  { path: '/pos',          element: <P><POS /></P> },
  { path: '/compras',      element: <P><Compras /></P> },
  { path: '/finanzas',     element: <P><Finanzas /></P> },
  { path: '/conciliacion', element: <P><Conciliacion /></P> },
  { path: '/express',      element: <P><Express /></P> },
  { path: '/inventario',   element: <P><Inventory /></P> },
  { path: '/clientes',     element: <P><Customers /></P> },

  // ─── MUNDO GIMNASIO ──────────────────────────────────
  { path: '/gimnasio',                    element: <P><GymPanel /></P> },
  { path: '/gimnasio/socios',             element: <P><Gimnasio /></P> },
  { path: '/gimnasio/planes',             element: <P><GymPlanes /></P> },
  { path: '/gimnasio/asistencias',        element: <P><GymAsistencias /></P> },
  { path: '/gimnasio/instructores',       element: <P><GymInstructores /></P> },
  { path: '/gimnasio/ingresos',           element: <P><GymIngresos /></P> },


], {
  basename: '/'
});

export default router;
