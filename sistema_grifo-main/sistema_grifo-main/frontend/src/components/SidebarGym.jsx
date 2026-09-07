import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const SidebarGym = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(sessionStorage.getItem('usuario') || '{}');
  const userRole = user.rol || 'cajero';

  const allItems = [
    { name: 'Panel de Control', icon: 'space_dashboard', path: '/gimnasio' },
    { name: 'Socios', icon: 'how_to_reg', path: '/gimnasio/socios' },
    { name: 'Planes', icon: 'workspace_premium', path: '/gimnasio/planes' },
    { name: 'Asistencias', icon: 'event_available', path: '/gimnasio/asistencias' },
    { name: 'Instructores', icon: 'sports', path: '/gimnasio/instructores' },
    { name: 'Ingresos', icon: 'payments', path: '/gimnasio/ingresos' },

  ];

  const isOnMainPanel = location.pathname === '/gimnasio';
  const menuItems = isOnMainPanel
    ? [{ name: 'Panel de Control', icon: 'space_dashboard', path: '/gimnasio' }]
    : allItems;

  return (
    <aside className="hidden md:flex flex-col pt-20 pb-8 h-screen w-64 glass fixed left-0 top-0 z-40 shadow-[16px_0_32px_rgba(11,29,45,0.04)]">
      <div className="px-8 mb-6 flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl shadow-sm border border-[var(--outline-variant)]/20 flex items-center justify-center overflow-hidden flex-shrink-0 bg-primary-container/10 text-primary-container">
          <i className="fi fi-sr-gym text-xl"></i>
        </div>
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] mb-1">Operaciones</h2>
          <p className="text-[11px] text-[var(--outline-variant)] font-bold tracking-tight text-primary-container lowercase first-letter:uppercase">Centro Deportivo</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto space-y-1 mb-4 custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className={`flex items-center w-full px-8 py-3 transition-all duration-300 relative group ${
                isActive
                  ? 'text-primary-container'
                  : 'text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-low)]'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 w-[4px] h-6 bg-primary-container rounded-r-full shadow-[0_0_8px_rgba(0,174,239,0.3)]"></div>
              )}
              <span className={`material-symbols-outlined mr-4 text-[20px] transition-transform ${isActive ? 'scale-110' : 'group-hover:translate-x-1'}`}>
                {item.icon}
              </span>
              <span className={`text-[11px] font-bold tracking-tight uppercase ${isActive ? 'font-black' : ''}`}>
                {item.name}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="px-8 mt-auto pt-4 border-t border-[var(--outline-variant)]/10 space-y-2">
        {/* Cambiar Módulo */}
        <button
          onClick={() => navigate('/modulos')}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-[var(--on-surface-variant)] hover:text-primary-container hover:bg-primary-container/10 transition-all group"
        >
          <span className="material-symbols-outlined text-[20px] group-hover:rotate-180 transition-transform duration-300 text-primary-container">swap_horiz</span>
          <span className="text-[10px] font-black uppercase tracking-[0.15em]">Cambiar Módulo</span>
        </button>

        {/* User pill */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/5 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-primary-container flex items-center justify-center text-white text-xs font-black shadow-lg shadow-primary-container/20 flex-shrink-0">
            {user.nombre_completo?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-black text-[var(--on-secondary-fixed)] truncate uppercase tracking-tight leading-none mb-1">{user.nombre_completo || 'Operativo'}</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
              <span className="text-[8px] font-bold text-[var(--outline-variant)] uppercase tracking-[0.2em] leading-none">En Línea</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default SidebarGym;
