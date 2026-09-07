import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const SidebarAdmin = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(sessionStorage.getItem('usuario') || '{}');

  const menuItems = [
    { name: 'Panel General', icon: 'space_dashboard', path: '/admin' },
    { name: 'Gestión de Usuarios', icon: 'manage_accounts', path: '/admin/usuarios' },
    { name: 'Configuración', icon: 'settings', path: '/admin/configuracion' },
  ];

  const moduleAccess = [
    { name: 'Módulo Grifo', icon: 'local_gas_station', path: '/panel', color: '#00AEEF' },
    { name: 'Módulo Gimnasio', icon: 'fitness_center', path: '/gimnasio', color: '#8B5CF6' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside
      className="hidden md:flex flex-col pt-20 pb-8 h-screen w-64 fixed left-0 top-0 z-40 glass shadow-[16px_0_32px_rgba(11,29,45,0.04)]"
      style={{
        borderRight: '1px solid rgba(11,29,45,0.05)',
      }}
    >
      {/* Identity */}
      <div className="px-8 mb-10 flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl shadow-sm border border-[var(--color-outline-variant)]/20 flex items-center justify-center overflow-hidden flex-shrink-0">
          <img src="/sistema_grifo-main/frontend/dist/logos/brand_admin.svg" alt="Logo Admin" className="w-full h-full object-contain p-1.5" />
        </div>
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)]">Super Admin</h2>
          <p className="text-[11px] text-[var(--color-on-surface-variant)] font-bold tracking-tight">Panel de Control General</p>
        </div>
      </div>

      {/* Admin navigation */}
      <nav className="flex-1 space-y-1">
        <p className="px-8 text-[9px] font-black uppercase tracking-[0.3em] text-[var(--color-outline-variant)] mb-3">Administración</p>
        {menuItems.map((item) => (
          <button
            key={item.name}
            onClick={() => navigate(item.path)}
            className="flex items-center w-full px-8 py-3.5 transition-all duration-300 relative group"
            style={{
              color: isActive(item.path) ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
              background: isActive(item.path) ? 'var(--color-primary)/5' : 'transparent',
            }}
          >
            {isActive(item.path) && (
              <div className="absolute left-0 w-[3px] h-6 rounded-r-full bg-[var(--color-primary)] shadow-[0_0_8px_rgba(0,174,239,0.3)]" />
            )}
            <span className={`material-symbols-outlined mr-4 text-[20px] transition-all ${isActive(item.path) ? 'text-[var(--color-primary)]' : 'group-hover:text-[var(--color-primary)]'}`}>
              {item.icon}
            </span>
            <span className={`text-[12px] font-bold tracking-tight uppercase ${isActive(item.path) ? 'font-black' : ''}`}>{item.name}</span>
          </button>
        ))}

        {/* Module access divider */}
        <div className="mx-8 my-4 border-t border-[var(--color-outline-variant)]/10" />
        <p className="px-8 text-[9px] font-black uppercase tracking-[0.3em] text-[var(--color-outline-variant)] mb-3">Acceso a Módulos</p>
        {moduleAccess.map((mod) => (
          <button
            key={mod.name}
            onClick={() => navigate(mod.path)}
            className="flex items-center w-full px-8 py-3 transition-all duration-200 group hover:opacity-100"
            style={{ opacity: 0.7 }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
          >
            <span className="material-symbols-outlined mr-4 text-[18px] transition-all" style={{ color: mod.color }}>{mod.icon}</span>
            <span className="text-[11px] font-bold tracking-tight uppercase text-[var(--color-on-surface-variant)] group-hover:text-[var(--color-on-secondary-fixed)]">{mod.name}</span>
            <span className="material-symbols-outlined ml-auto text-[14px] text-[var(--color-outline-variant)] group-hover:text-[var(--color-primary)]">arrow_forward</span>
          </button>
        ))}
      </nav>

      {/* User pill + logout */}
      <div className="px-8 mt-auto pt-6 space-y-3" style={{ borderTop: '1px solid rgba(11,29,45,0.05)' }}>
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/5 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)] flex items-center justify-center text-white text-xs font-black shadow-lg shadow-[#00AEEF30] flex-shrink-0">
            {user.nombre_completo?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="block text-[11px] font-black text-[var(--color-on-secondary-fixed)] truncate uppercase tracking-tight leading-none mb-1">{user.nombre_completo || 'Admin'}</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
              <span className="text-[8px] font-bold text-[var(--color-primary)] uppercase tracking-[0.2em] leading-none">Admin Activo</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => { sessionStorage.clear(); navigate('/'); }}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all group"
        >
          <span className="material-symbols-outlined text-[16px]">logout</span>
          <span className="text-[10px] font-black uppercase tracking-[0.15em]">Cerrar Sesión</span>
        </button>
      </div>
    </aside>

  );
};

export default SidebarAdmin;
