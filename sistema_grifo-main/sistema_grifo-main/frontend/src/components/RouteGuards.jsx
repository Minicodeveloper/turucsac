import React from 'react';
import { Navigate } from 'react-router-dom';
import { ADMIN_ROLES, SUPERVISOR_ROLES, getUserRole, hasRole } from '../utils/roles';

const ProtectedRoute = ({ children }) => {
  const userStr = sessionStorage.getItem('usuario');
  if (!userStr) return <Navigate to="/login" replace />;
  return children;
};

const AccessDenied = () => (
  <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
    <section
      role="alert"
      className="w-full max-w-lg rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-800 shadow-sm"
    >
      <span className="material-symbols-outlined text-4xl" aria-hidden="true">lock</span>
      <h1 className="mt-3 text-xl font-black">Acceso denegado</h1>
      <p className="mt-2 text-sm">Tu rol no tiene permisos para acceder a este módulo.</p>
    </section>
  </main>
);

const RoleRoute = ({ allowedRoles, children }) => {
  const userStr = sessionStorage.getItem('usuario');
  if (!userStr) return <Navigate to="/login" replace />;

  const user = JSON.parse(userStr);
  if (!user.id) return <Navigate to="/login" replace />;

  const currentRole = getUserRole(user);

  if (!hasRole(currentRole, allowedRoles)) {
    return <AccessDenied />;
  }

  return children;
};

export const P = ({ children }) => <ProtectedRoute>{children}</ProtectedRoute>;
export const AdminOnly = ({ children }) => (
  <RoleRoute allowedRoles={ADMIN_ROLES}>{children}</RoleRoute>
);
export const AdminCompanyOnly = ({ children }) => (
  <RoleRoute allowedRoles={ADMIN_ROLES}>{children}</RoleRoute>
);
export const SupervisorAndAbove = ({ children }) => (
  <RoleRoute allowedRoles={SUPERVISOR_ROLES}>{children}</RoleRoute>
);
