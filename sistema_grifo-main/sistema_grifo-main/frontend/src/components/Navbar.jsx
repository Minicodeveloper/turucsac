import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine logo based on context
  const getContextLogo = () => {
    const path = location.pathname;
    if (path.includes('/gimnasio')) return '/sistema_grifo-main/frontend/dist/logos/brand_gym.svg';
    if (path.includes('/admin')) return '/sistema_grifo-main/frontend/dist/logos/brand_admin.svg';
    return '/sistema_grifo-main/frontend/dist/logos/brand_grifo.svg';
  };

  // Leer datos del usuario directamente desde la sesión
  const user = JSON.parse(sessionStorage.getItem('usuario') || '{}');
  const userRole = user.rol || 'cajero';
  const userName = user.nombre_completo || 'Usuario';
  
  // Detectar módulo basado en la URL para mayor robustez
  const isGymPath = location.pathname.startsWith('/gimnasio');
  const moduloActivo = isGymPath ? 'gimnasio' : 'grifo';

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/');
  };

  const handlePanelClick = () => {
    if (moduloActivo === 'gimnasio') navigate('/gimnasio');
    else navigate('/panel');
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
                <img src={getContextLogo()} alt="Logo" className="w-full h-full object-contain" />
              )}
            </div>
            <span className="text-xl font-black tracking-tighter text-on-secondary-fixed uppercase">TURUCSAC</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <button onClick={handlePanelClick} className="text-primary font-semibold border-b-2 border-primary py-5 transition-colors">Panel de Control</button>
            <button 
              onClick={() => navigate(moduloActivo === 'gimnasio' ? '/gimnasio/socios' : '/pos')} 
              className="text-on-surface-variant hover:text-on-secondary-fixed py-5 transition-colors"
            >
              {moduloActivo === 'gimnasio' ? 'Gestión Socios' : 'Operaciones'}
            </button>
            {userRole === 'admin' && (
              <button 
                onClick={() => navigate(moduloActivo === 'gimnasio' ? '/gimnasio/ingresos' : '/dashboard')} 
                className="text-on-surface-variant hover:text-on-secondary-fixed py-5 transition-colors"
              >
                {moduloActivo === 'gimnasio' ? 'Ingresos Gym' : 'Finanzas'}
              </button>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button id="btnNotificaciones" className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors active:scale-95 duration-200">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          {userRole === 'admin' && (
            <button id="btnConfiguracion" onClick={() => navigate('/admin')} className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors active:scale-95 duration-200" title="Panel Admin">
              <span className="material-symbols-outlined text-red-400">shield_person</span>
            </button>
          )}
          <div className="h-8 w-[1px] bg-outline-variant/20 mx-2"></div>
          <div className="flex items-center gap-3 pl-2">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-on-secondary-fixed leading-tight uppercase tracking-tight">{userName}</p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                {userRole === 'admin' ? 'Administrador' : userRole === 'supervisor' ? 'Supervisor' : 'Cajero'}
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
