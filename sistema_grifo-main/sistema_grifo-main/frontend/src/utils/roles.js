export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN_EMPRESA: 'ADMIN_EMPRESA',
  SUPERVISOR: 'SUPERVISOR',
  CAJERO: 'CAJERO',
};

export const ALL_ROLES = Object.values(ROLES);
export const SUPERVISOR_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN_EMPRESA,
  ROLES.SUPERVISOR,
];
export const ADMIN_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN_EMPRESA];

const ROLE_ACCESS_BY_PATH = {
  '/admin': ADMIN_ROLES,
  '/admin/usuarios': ADMIN_ROLES,
  '/admin/configuracion': ADMIN_ROLES,
  '/finanzas': ADMIN_ROLES,
  '/gimnasio/planes': ADMIN_ROLES,
  '/gimnasio/configuracion': ADMIN_ROLES,
  '/dashboard': SUPERVISOR_ROLES,
  '/boletas': SUPERVISOR_ROLES,
  '/compras': SUPERVISOR_ROLES,
  '/conciliacion': SUPERVISOR_ROLES,
  '/inventario': SUPERVISOR_ROLES,
  '/gimnasio/instructores': SUPERVISOR_ROLES,
  '/gimnasio/ingresos': SUPERVISOR_ROLES,
};

export const normalizeRole = (role) => {
  if (typeof role !== 'string') return '';

  const normalizedRole = role.trim().toUpperCase();
  return normalizedRole === 'ADMIN' ? ROLES.SUPER_ADMIN : normalizedRole;
};

export const getUserRole = (user) => normalizeRole(user?.rol || user?.role);

export const hasRole = (role, allowedRoles) =>
  allowedRoles.includes(normalizeRole(role));

export const getAllowedRolesForPath = (path) => ROLE_ACCESS_BY_PATH[path] || ALL_ROLES;

export const getDefaultRoute = (role) => {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === ROLES.SUPER_ADMIN || normalizedRole === ROLES.ADMIN_EMPRESA) {
    return '/admin';
  }

  return '/modulos';
};
