import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Leer usuario de sesión
  const user = JSON.parse(sessionStorage.getItem('usuario') || '{}');

  const menuItems = [
    { name: 'Panel de Control', icon: 'dashboard', path: '/panel' },
    { name: 'Ventas (POS)', icon: 'point_of_sale', path: '/pos' },
    { name: 'Boletas', icon: 'receipt_long', path: '/boletas' },
    { name: 'Compras', icon: 'shopping_cart', path: '/compras' },
    { name: 'Inventario', icon: 'inventory_2', path: '/inventario' },
    { name: 'Analítica', icon: 'analytics', path: '/dashboard' },
    { name: 'Express', icon: 'speed', path: '/express' },
    { name: 'Conciliación', icon: 'checklist_rtl', path: '/conciliacion' },
  ];

  return (
    <aside className="hidden md:flex flex-col h-screen w-60 bg-white fixed left-0 top-0 z-40 border-r border-slate-200 text-slate-700 shadow-sm">

    {/* 1. Cabecera Corporativa TURUCSAC */}
        <div className="bg-[#24a0ed] px-4 py-3 flex items-center justify-between text-white shadow-sm">
          <div className="flex items-center gap-2">
            <span className="font-black tracking-wider text-sm uppercase">TURUCSAC &gt;&gt;</span>
            <span className="text-[10px] font-bold text-sky-100 uppercase tracking-tight">ESTACIÓN</span>
          </div>
        </div>


      {/* Subtítulo de área de trabajo */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[10px] font-bold uppercase text-slate-500 tracking-wider">
        <span>Módulo Grifo</span>
        <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded">En línea</span>
      </div>

      {/* 2. Lista de Navegación Compacta */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className={`flex items-center w-full px-3 py-2 text-left rounded text-xs font-semibold transition-colors duration-150 ${
                isActive
                  ? 'bg-sky-50 text-[#24a0ed] border-l-4 border-[#24a0ed] font-bold pl-2 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className={`material-symbols-outlined mr-2.5 text-[18px] ${isActive ? 'text-[#24a0ed]' : 'text-slate-400'}`}>
                {item.icon}
              </span>
              <span className="truncate">{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* 3. Pie de Barra: Cambiar Módulo y Datos de Cajero */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 space-y-2">
        {/* Botón Cambiar Módulo */}
        <button
          onClick={() => navigate('/modulos')}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] transition-colors"
        >
          <span className="material-symbols-outlined text-[16px] text-slate-500">swap_horiz</span>
          <span className="uppercase tracking-tight">Cambiar Módulo</span>
        </button>

        {/* Tarjeta de Usuario Activo */}
        <div className="flex items-center gap-2.5 p-2 bg-white rounded border border-slate-200">
          <div className="w-7 h-7 rounded bg-[#24a0ed] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
            {user.nombre_completo?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-[11px] font-bold text-slate-800 truncate uppercase">
              {user.nombre_completo || 'Operativo'}
            </p>
            <p className="text-[9px] text-slate-400 font-semibold uppercase">
              {user.rol || 'Cajero'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;