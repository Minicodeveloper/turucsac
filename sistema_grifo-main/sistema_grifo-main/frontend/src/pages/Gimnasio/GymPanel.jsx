import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';

const gymModules = [
  {
    id: 'socios',
    title: 'Socios',
    icon: 'how_to_reg',
    path: '/gimnasio/socios',
    badge: null,
    description: 'Registro y gestión de membresías',
  },
  {
    id: 'planes',
    title: 'Planes',
    icon: 'workspace_premium',
    path: '/gimnasio/planes',
    badge: null,
    description: 'Tipos de membresía y precios',
  },
  {
    id: 'asistencias',
    title: 'Asistencias',
    icon: 'event_available',
    path: '/gimnasio/asistencias',
    badge: { text: 'HOY', color: 'emerald' },
    description: 'Check-in y check-out del día',
  },
  {
    id: 'instructores',
    title: 'Instructores',
    icon: 'sports',
    path: '/gimnasio/instructores',
    badge: null,
    description: 'Personal y especialidades',
  },
  {
    id: 'ingresos',
    title: 'Ingresos',
    icon: 'payments',
    path: '/gimnasio/ingresos',
    badge: null,
    description: 'Control financiero y pagos',
  },

];

const GymPanel = () => {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem('usuario') || '{}');
  const userRole = user.rol || 'cajero';

  const [isEditMode, setIsEditMode] = useState(false);

  const visibleModules = gymModules;

  const badgeStyle = {
    emerald: 'bg-emerald-500/20 text-emerald-400',
    azure: 'bg-primary/20 text-primary',
    amber: 'bg-amber-500/20 text-amber-400',
  };

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <Navbar />
      <main className="pt-24 pb-12 px-6 lg:px-24 max-w-[1920px] mx-auto">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-on-secondary-fixed tracking-tighter uppercase mb-2">Panel de Control</h1>
            <p className="text-on-surface-variant font-medium text-lg leading-tight">Gestión integral del gimnasio y centro deportivo</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/modulos')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container transition-all text-xs font-black uppercase tracking-widest shadow-sm group"
              title="Cambiar Módulo"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:rotate-180 transition-transform duration-500">swap_horiz</span>
              <span>Cambiar Módulo</span>
            </button>

            {userRole === 'admin' && (
              <button 
                onClick={() => setIsEditMode(!isEditMode)}
                className={`p-3 rounded-full transition-all ${isEditMode ? 'bg-primary text-white shadow-lg' : 'text-primary hover:bg-surface-container'}`}
                title="Editar Panel"
              >
                <span className="material-symbols-outlined text-2xl">edit</span>
              </button>
            )}
            
            <div className="bg-surface-container-lowest px-5 py-2.5 rounded-xl border border-outline-variant/30 flex items-center gap-3 shadow-sm">
              <span className="material-symbols-outlined text-primary">calendar_today</span>
              <span className="text-sm font-black text-on-surface uppercase tracking-tight">
                {new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
          {visibleModules.map((mod) => (
            <div
              key={mod.id}
              onClick={() => !isEditMode && navigate(mod.path)}
              className="tonal-card bg-surface-container-low group p-8 rounded-3xl flex flex-col items-center justify-center text-center cursor-pointer border border-transparent hover:border-primary/20 relative min-h-[160px] transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              {mod.badge && (
                <div className="absolute top-4 right-4 text-[9px] font-black px-2 py-0.5 rounded-full tracking-widest uppercase bg-primary-container text-white">
                  {mod.badge.text}
                </div>
              )}
              <span className={`material-symbols-outlined text-primary mb-4 text-4xl group-hover:scale-110 !group-hover:rotate-6 transition-transform duration-300`}>
                {mod.icon}
              </span>
              <span className="text-sm font-black text-on-secondary-fixed uppercase tracking-tight leading-tight">
                {mod.title}
              </span>
            </div>
          ))}
          
          {isEditMode && (
            <div 
              className="tonal-card border-dashed border-2 border-primary/40 p-8 rounded-3xl flex flex-col items-center justify-center text-center cursor-pointer hover:bg-primary/10 transition-all min-h-[160px]"
            >
              <span className="material-symbols-outlined text-primary mb-4 text-5xl">add_circle</span>
              <span className="text-sm font-black text-primary uppercase tracking-tight">Agregar Sección</span>
            </div>
          )}
        </div>

        <footer className="pt-12 text-center lg:text-right border-t border-[var(--outline-variant)]/10">
          <p className="text-[10px] font-black text-[var(--outline-variant)] uppercase tracking-[0.4em]">Arquitectura Centro Deportivo 2026</p>
        </footer>
      </main>
    </div>
  );
};
export default GymPanel;
