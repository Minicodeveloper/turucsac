import React from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../components/SidebarAdmin';

const modules = [
  {
    id: 'grifo',
    title: 'Grifo',
    subtitle: 'Estación de Servicio',
    description: 'Gestiona ventas, inventario, clientes y analítica operativa del grifo.',
    icon: 'local_gas_station',
    path: '/panel',
    color: '#00AEEF',
    glow: 'rgba(0,174,239,0.15)',
    stats: ['POS', 'Inventario', 'Clientes', 'Analítica'],
  },
  {
    id: 'gimnasio',
    title: 'Gimnasio',
    subtitle: 'Centro Deportivo',
    description: 'Administra socios, membresías, instructores e ingresos del gimnasio.',
    icon: 'fitness_center',
    path: '/gimnasio',
    color: '#8B5CF6',
    glow: 'rgba(139,92,246,0.15)',
    stats: ['Socios', 'Planes', 'Asistencias', 'Ingresos'],
  },
  {
    id: 'admin',
    title: 'Gestión de Equipo',
    subtitle: 'Panel Administrativo',
    description: 'Crea, edita y administra todos los usuarios y accesos del sistema.',
    icon: 'manage_accounts',
    path: '/admin/usuarios',
    color: '#F87171',
    glow: 'rgba(248,113,113,0.15)',
    stats: ['Usuarios', 'Roles', 'Permisos', 'Accesos'],
  },
];

const AdminPanel = () => {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem('usuario') || '{}');

  return (
    <div className="min-h-screen flex bg-[var(--color-surface)]">
      <SidebarAdmin />

      <main className="flex-1 md:ml-64 pt-24 pb-16 px-10 max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 mb-6">
            <span className="material-symbols-outlined text-[var(--color-primary)] text-sm">shield_person</span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-primary)]">Panel Super Admin</span>
          </div>
          <h1 className="text-6xl font-black tracking-tighter text-[var(--color-on-secondary-fixed)] leading-none mb-3">
            Bienvenido,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-sky-600">
              {user.nombre_completo?.split(' ')[0] || 'Admin'}
            </span>
          </h1>
          <p className="text-[var(--color-on-surface-variant)] text-lg font-medium">Selecciona una sección para comenzar a gestionar.</p>
        </div>

        {/* Module access cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {modules.map((mod) => (
            <button
              key={mod.id}
              onClick={() => navigate(mod.path)}
              className="group relative text-left rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl active:scale-[0.99] focus:outline-none paper-lowest border border-[var(--color-outline-variant)]/20 shadow-sm"
            >
              {/* Glow on hover */}
              <div
                className="absolute -top-8 -right-8 w-40 h-40 rounded-full blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: mod.glow }}
              />

              <div className="relative z-10 p-9">
                {/* Icon */}
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-7 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${mod.color}15` }}
                >
                  <span className="material-symbols-outlined text-4xl" style={{ color: mod.color }}>
                    {mod.icon}
                  </span>
                </div>

                {/* Labels */}
                <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2" style={{ color: mod.color }}>
                  {mod.subtitle}
                </p>
                <h2 className="text-2xl font-black tracking-tighter text-[var(--color-on-secondary-fixed)] mb-3">{mod.title}</h2>
                <p className="text-[var(--color-on-surface-variant)] text-sm font-medium leading-relaxed mb-7">{mod.description}</p>

                {/* Feature pills */}
                <div className="flex flex-wrap gap-2 mb-7">
                  {mod.stats.map(s => (
                    <span
                      key={s}
                      className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border"
                      style={{ borderColor: `${mod.color}20`, color: mod.color, background: `${mod.color}05` }}
                    >
                      {s}
                    </span>
                  ))}
                </div>

                {/* Arrow CTA */}
                <div className="flex items-center gap-2 font-black text-sm uppercase tracking-widest transition-all duration-300 group-hover:gap-4" style={{ color: mod.color }}>
                  <span>Ingresar</span>
                  <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-1">arrow_forward</span>
                </div>
              </div>

              {/* Bottom glow line */}
              <div
                className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(90deg, transparent, ${mod.color}, transparent)` }}
              />
            </button>
          ))}
        </div>

        {/* Footer info */}
        <div className="mt-16 flex items-center justify-between text-[10px] font-bold text-[var(--color-outline-variant)] uppercase tracking-[0.4em]">
          <span>TURUCSAC ERP v2.0</span>
          <span>Sesión activa — {user.nombre_completo || 'Admin'}</span>
        </div>
      </main>
    </div>

  );
};

export default AdminPanel;
