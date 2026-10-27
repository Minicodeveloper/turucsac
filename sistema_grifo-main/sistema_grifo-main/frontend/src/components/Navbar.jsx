import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROLES, getUserRole } from '../utils/roles';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Leer datos del usuario directamente desde la sesión
  const user = JSON.parse(sessionStorage.getItem('usuario') || '{}');
  const userRole = getUserRole(user) || ROLES.CAJERO;
  const userName = user.nombre_completo || user.name || 'Usuario';
  const empresaNombre = user.razon_social || 'TURUCSAC';
  const companyLogo = user.logo_path
    ? `/logos/${encodeURIComponent(user.logo_path)}`
    : '/assets/default-logo.png';
  
  // Detectar módulo basado en la URL para mayor robustez
  const isGymPath = location.pathname.startsWith('/gimnasio');
  const moduloActivo = isGymPath ? 'gimnasio' : 'grifo';

  // Helper para formatear la etiqueta del rol correctamente
  const getRoleLabel = (role) => {
    switch (role) {
      case ROLES.SUPER_ADMIN:
        return 'Super Admin';
      case ROLES.ADMIN_EMPRESA:
        return 'Admin Empresa';
      case ROLES.SUPERVISOR:
        return 'Supervisor';
      case ROLES.CAJERO:
        return 'Cajero / Bombero';
      default:
        return role;
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/');
  };

  const handlePanelClick = () => {
    if (userRole === ROLES.SUPER_ADMIN || userRole === ROLES.ADMIN_EMPRESA) {
      navigate('/admin');
    } else if (moduloActivo === 'gimnasio') {
      navigate('/gimnasio');
    } else {
      navigate('/panel');
    }
  };

  return (
    <header className="fixed top-0 w-full z-50 glass-nav shadow-sm shadow-slate-900/5">
      <div className="flex items-center justify-between px-8 h-16 w-full">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl border border-[var(--color-outline-variant)]/20 flex items-center justify-center p-1 flex-shrink-0 bg-primary-container/5">
              {location.pathname.includes('/gimnasio') ? (
                <i className="fi fi-sr-gym text-2xl text-primary-container"></i>
              ) : (
                <img
                  src={companyLogo}
                  alt="Logo Empresa"
                  className="w-full h-full object-contain"
                  onError={(event) => {
                    if (event.currentTarget.src.endsWith('/assets/default-logo.png')) return;
                    event.currentTarget.src = '/assets/default-logo.png';
                  }}
                />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tighter text-on-secondary-fixed uppercase leading-none">
                {empresaNombre}
              </span>
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">ERP Platform</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <button onClick={handlePanelClick} className="text-primary font-semibold border-b-2 border-primary py-5 transition-colors">
              Panel de Control
            </button>
            <button 
              onClick={() => navigate(moduloActivo === 'gimnasio' ? '/gimnasio/socios' : '/pos')} 
              className="text-on-surface-variant hover:text-on-secondary-fixed py-5 transition-colors"
            >
              {moduloActivo === 'gimnasio' ? 'Gestión Socios' : 'Operaciones (POS)'}
            </button>
            <button
              onClick={() => navigate('/cierres-caja')}
              className="text-on-surface-variant hover:text-on-secondary-fixed py-5 transition-colors"
            >
              Cierres de Caja
            </button>
            
            {/* Opciones visibles para Supervisor, Admin Empresa y Super Admin */}
            {[ROLES.SUPER_ADMIN, ROLES.ADMIN_EMPRESA, ROLES.SUPERVISOR].includes(userRole) && (
              <button 
                onClick={() => navigate(moduloActivo === 'gimnasio' ? '/gimnasio/ingresos' : '/dashboard')} 
                className="text-on-surface-variant hover:text-on-secondary-fixed py-5 transition-colors"
              >
                {moduloActivo === 'gimnasio' ? 'Ingresos Gym' : 'Finanzas & Reportes'}
              </button>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button id="btnNotificaciones" className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors active:scale-95 duration-200">
            <span className="material-symbols-outlined">notifications</span>
          </button>

          {/* Botón de panel admin de empresa / plataforma */}
          {[ROLES.SUPER_ADMIN, ROLES.ADMIN_EMPRESA].includes(userRole) && (
            <button 
              id="btnConfiguracion" 
              onClick={() => navigate(userRole === ROLES.SUPER_ADMIN ? '/admin' : '/admin/configuracion')}
              className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors active:scale-95 duration-200" 
              title="Configuración de Empresa / Sistema"
            >
              <span className="material-symbols-outlined text-red-400">shield_person</span>
            </button>
          )}

          <div className="h-8 w-[1px] bg-outline-variant/20 mx-2"></div>
          <div className="flex items-center gap-3 pl-2">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-on-secondary-fixed leading-tight uppercase tracking-tight">{userName}</p>
              <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">
                {getRoleLabel(userRole)}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="h-10 w-10 rounded-lg bg-error-container hover:bg-error flex items-center justify-center text-on-error font-bold shadow-sm transition-colors cursor-pointer"
              title="Cerrar Sesión"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;