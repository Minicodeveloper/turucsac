import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const modules = [
  {
    id: 'grifo',
    title: 'Grifo',
    subtitle: 'Estación de Servicio',
    description: 'Gestión completa de combustibles, ventas, inventario Kardex, clientes y analítica operativa en tiempo real.',
    icon: 'local_gas_station',
    path: '/panel',
    accentColor: '#00AEEF',
    stats: ['POS Rápido', 'Kardex', 'Dashboard', 'Clientes'],
    gradient: 'from-sky-950 via-slate-950 to-slate-950',
    glow: 'rgba(0,174,239,0.15)',
  },
  {
    id: 'gimnasio',
    title: 'Gimnasio',
    subtitle: 'Centro Deportivo',
    description: 'Control de membresías, socios activos, planes de suscripción, vencimientos y seguimiento de ingresos.',
    icon: 'fitness_center',
    path: '/gimnasio',
    accentColor: '#00AEEF',
    stats: ['Socios', 'Membresías', 'Planes', 'Ingresos'],
    gradient: 'from-sky-950 via-slate-950 to-slate-950',
    glow: 'rgba(0,174,239,0.15)',
  },
];

const ModuleSelector = () => {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem('usuario') || '{}');

  // Si no hay sesión, redirige al login
  useEffect(() => {
    if (!user.id) navigate('/login');
  }, []);

  const handleSelect = (mod) => {
    sessionStorage.setItem('modulo_activo', mod.id);
    navigate(mod.path);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col overflow-hidden">
      {/* Background ambient blobs */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[40%] h-[40%] rounded-full bg-sky-600/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] rounded-full bg-violet-600/10 blur-[100px]" />
        <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] rounded-full bg-sky-500/5 blur-[80px]" />
      </div>

      {/* Top bar */}
      <header className="flex items-center justify-between px-10 h-24 border-b border-white/5 bg-slate-900/40 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center p-1.5 flex-shrink-0">
            <img src="/sistema_grifo-main/frontend/dist/logos/brand_admin.svg" alt="Logo Admin" className="w-full h-full object-contain" />
          </div>
          <span className="text-xl font-black tracking-tighter text-white uppercase">TURUCSAC <span className="text-sky-400 text-xs tracking-widest ml-1">ERP</span></span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-black text-white tracking-tight uppercase">{user.nombre_completo || 'Usuario'}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {user.rol === 'admin' ? 'Administrador' : user.rol === 'supervisor' ? 'Supervisor' : 'Cajero'}
            </p>
          </div>
          <button
            onClick={() => { sessionStorage.clear(); navigate('/'); }}
            className="ml-3 h-9 w-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all"
            title="Cerrar Sesión"
          >
            <span className="material-symbols-outlined text-slate-400 text-sm">logout</span>
          </button>
        </div>
      </header>

      {/* Hero text */}
      <div className="text-center pt-16 pb-12 px-6">
        <div className="inline-block px-4 py-1 rounded-full bg-white/5 border border-white/10 text-sky-400 text-[10px] font-black uppercase tracking-[0.3em] mb-6">
          Plataforma Integrada — Selecciona tu Módulo
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-4 leading-none">
          ¿Dónde trabajas <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-violet-400">hoy?</span>
        </h1>
        <p className="text-slate-400 text-lg font-medium max-w-md mx-auto">
          Accede al módulo correspondiente a tu operación.
        </p>
      </div>

      {/* Module cards */}
      <div className="flex-1 flex items-start justify-center px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          {modules.map((mod) => (
            <button
              key={mod.id}
              onClick={() => handleSelect(mod)}
              className="group relative text-left rounded-[2.5rem] border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden transition-all duration-500 hover:border-white/20 hover:bg-white/[0.06] hover:scale-[1.02] hover:shadow-2xl active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-white/20"
              style={{ boxShadow: `0 0 0 0 transparent`, '--glow': mod.glow }}
            >
              {/* Glow blob on hover (CSS handled via Tailwind group) */}
              <div
                className="absolute -top-10 -right-10 w-48 h-48 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: mod.glow }}
              />

              {/* Card content */}
              <div className="relative z-10 p-10">
                {/* Icon */}
                <div
                  className="w-20 h-20 rounded-3xl flex items-center justify-center mb-8 shadow-xl transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${mod.accentColor}20`, boxShadow: `0 8px 32px ${mod.glow}` }}
                >
                  <span className="material-symbols-outlined text-5xl" style={{ color: mod.accentColor }}>
                    {mod.icon}
                  </span>
                </div>

                {/* Labels */}
                <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2" style={{ color: mod.accentColor }}>
                  {mod.subtitle}
                </p>
                <h2 className="text-4xl font-black tracking-tighter text-white mb-4">{mod.title}</h2>
                <p className="text-slate-400 font-medium leading-relaxed mb-8 text-sm">{mod.description}</p>

                {/* Stat pills */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {mod.stats.map(stat => (
                    <span
                      key={stat}
                      className="px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider"
                      style={{ borderColor: `${mod.accentColor}30`, color: mod.accentColor, background: `${mod.accentColor}10` }}
                    >
                      {stat}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div
                  className="flex items-center gap-3 font-black text-sm uppercase tracking-widest transition-all duration-300 group-hover:gap-5"
                  style={{ color: mod.accentColor }}
                >
                  <span>Ingresar al módulo</span>
                  <span className="material-symbols-outlined text-lg transition-transform duration-300 group-hover:translate-x-1">arrow_forward</span>
                </div>
              </div>

              {/* Bottom accent line */}
              <div
                className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(90deg, transparent, ${mod.accentColor}, transparent)` }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center pb-8 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
        TURUCSAC ERP v2.0 — Plataforma Multi-Módulo
      </footer>
    </div>
  );
};

export default ModuleSelector;
