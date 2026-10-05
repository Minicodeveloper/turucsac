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
    description: 'Registro y membresías',
    shortcut: 'F1',
    theme: {
      accentBg: 'bg-sky-50 text-[#0284c7] border-sky-100 group-hover:bg-[#0284c7] group-hover:text-white',
      borderHover: 'hover:border-[#0284c7] hover:shadow-sky-100',
    }
  },
  {
    id: 'planes',
    title: 'Planes',
    icon: 'workspace_premium',
    path: '/gimnasio/planes',
    badge: null,
    description: 'Tarifas y suscripciones',
    shortcut: 'F2',
    theme: {
      accentBg: 'bg-amber-50 text-amber-600 border-amber-100 group-hover:bg-amber-500 group-hover:text-white',
      borderHover: 'hover:border-amber-500 hover:shadow-amber-100',
    }
  },
  {
    id: 'asistencias',
    title: 'Asistencias',
    icon: 'event_available',
    path: '/gimnasio/asistencias',
    badge: { text: 'HOY', color: 'emerald' },
    description: 'Check-in y torniquete',
    shortcut: 'F3',
    theme: {
      accentBg: 'bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white',
      borderHover: 'hover:border-emerald-500 hover:shadow-emerald-100',
    }
  },
  {
    id: 'instructores',
    title: 'Instructores',
    icon: 'sports',
    path: '/gimnasio/instructores',
    badge: null,
    description: 'Staff y entrenadores',
    shortcut: 'F4',
    theme: {
      accentBg: 'bg-indigo-50 text-indigo-600 border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white',
      borderHover: 'hover:border-indigo-500 hover:shadow-indigo-100',
    }
  },
  {
    id: 'ingresos',
    title: 'Ingresos',
    icon: 'payments',
    path: '/gimnasio/ingresos',
    badge: null,
    description: 'Caja gym y pagos',
    shortcut: 'F5',
    theme: {
      accentBg: 'bg-teal-50 text-teal-600 border-teal-100 group-hover:bg-teal-600 group-hover:text-white',
      borderHover: 'hover:border-teal-500 hover:shadow-teal-100',
    }
  },
];

const GymPanel = () => {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem('usuario') || '{}');
  const userRole = (user.rol || user.role || 'cajero').toLowerCase();
  const isAdmin = userRole.includes('admin');

  const [isEditMode, setIsEditMode] = useState(false);
  const [modules, setModules] = useState(gymModules);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSection, setNewSection] = useState({ title: '', path: '', icon: '', description: '' });

  const handleAddCustomModule = () => {
    if (!newSection.title || !newSection.path || !newSection.icon) {
      alert('Por favor completa los campos principales');
      return;
    }
    const created = {
      id: newSection.title.toLowerCase().replace(/\s+/g, '-'),
      title: newSection.title,
      icon: newSection.icon,
      path: newSection.path,
      badge: { text: 'NUEVO', color: 'azure' },
      description: newSection.description || 'Módulo auxiliar deportivo',
      shortcut: 'APP',
      theme: {
        accentBg: 'bg-purple-50 text-purple-600 border-purple-100 group-hover:bg-purple-600 group-hover:text-white',
        borderHover: 'hover:border-purple-500 hover:shadow-purple-100',
      }
    };
    setModules([...modules, created]);
    setIsModalOpen(false);
    setNewSection({ title: '', path: '', icon: '', description: '' });
  };

  const handleDeleteModule = (index, e) => {
    e.stopPropagation();
    if (window.confirm(`¿Deseas retirar "${modules[index].title}" del menú rápido?`)) {
      setModules(modules.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="min-h-screen bg-[#edf2f7] text-slate-800 font-sans flex flex-col">
      <Navbar />

      {/* Sub-barra operativa de estado (Estilo Rapifac / TURUCSAC) */}
      <div className="bg-[#24a0ed] text-white px-6 py-2.5 shadow-sm mt-16 md:mt-20">
        <div className="max-w-[1750px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-black tracking-wider uppercase bg-sky-800/40 px-2 py-0.5 rounded text-[11px]">
              TURUCSAC &gt;&gt;
            </span>
            <span className="font-bold tracking-tight text-white uppercase text-[11px]">
              GESTIÓN DE CENTRO DEPORTIVO Y GIMNASIO
            </span>
            <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-100 border border-emerald-400/40 px-2 py-0.5 rounded text-[10px] font-bold uppercase ml-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              En Línea
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-sky-800/40 px-3 py-1 rounded text-[11px] font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">fitness_center</span>
              <span>Operador: <strong className="uppercase">{user.nombre || user.usuario || 'ADMIN'}</strong></span>
              <span className="opacity-60">|</span>
              <span className="uppercase text-[10px] font-mono bg-sky-950/40 px-1.5 py-0.2 rounded font-bold">
                {userRole}
              </span>
            </div>

            <div className="bg-sky-800/40 px-3 py-1 rounded text-[11px] font-mono font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">calendar_month</span>
              <span>{new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenedor Principal */}
      <main className="flex-1 px-4 sm:px-6 lg:px-12 py-8 max-w-[1750px] w-full mx-auto flex flex-col justify-start">
        {/* Encabezado y botones de navegación rápida */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <span>Panel Deportivo & Membresías</span>
            </h1>
            <p className="text-slate-500 text-xs font-semibold mt-0.5">
              Control de acceso de socios, planes vigentes, entrenadores y flujo de caja[cite: 7].
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => navigate('/modulos')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold uppercase tracking-wider shadow-xs transition-all cursor-pointer"
              title="Cambiar módulo"
            >
              <span className="material-symbols-outlined text-base text-[#24a0ed]">swap_horiz</span>
              <span>Cambiar Módulo</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold uppercase transition-all cursor-pointer ${
                  isEditMode
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
                title="Configurar accesos"
              >
                <span className="material-symbols-outlined text-base">edit</span>
                <span>{isEditMode ? 'Terminar Edición' : 'Editar Panel'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Grilla de accesos directos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {modules.map((mod, index) => {
            const visual = mod.theme || {
              accentBg: 'bg-sky-50 text-[#0284c7] border-sky-100 group-hover:bg-[#0284c7] group-hover:text-white',
              borderHover: 'hover:border-[#0284c7] hover:shadow-sky-100',
            };

            return (
              <div
                key={mod.id + index}
                onClick={() => !isEditMode && navigate(mod.path)}
                className={`group relative bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col items-center justify-between text-center cursor-pointer min-h-[190px] shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${visual.borderHover}`}
              >
                {/* Tecla de atajo visual */}
                <span className="absolute top-3 left-3 text-[10px] font-mono font-black text-slate-300 group-hover:text-slate-500 transition-colors">
                  {mod.shortcut || 'GO'}
                </span>

                {/* Badge contextual */}
                {mod.badge && (
                  <div className="absolute top-3 right-3">
                    <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {mod.badge.text}
                    </span>
                  </div>
                )}

                {/* Botón eliminar en modo edición */}
                {isEditMode && (
                  <button
                    onClick={(e) => handleDeleteModule(index, e)}
                    className="absolute top-2 right-2 bg-rose-600 text-white rounded-full p-1.5 hover:bg-rose-700 transition-all z-10 shadow-md cursor-pointer"
                    title="Eliminar botón"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                )}

                {/* Contenido Central */}
                <div className="my-auto flex flex-col items-center">
                  <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-105 ${visual.accentBg}`}>
                    <span className="material-symbols-outlined text-3xl font-light">
                      {mod.icon}
                    </span>
                  </div>

                  <h2 className="text-xs font-black uppercase text-slate-800 tracking-wider group-hover:text-[#24a0ed] transition-colors leading-tight">
                    {mod.title}
                  </h2>
                  <span className="text-[10px] text-slate-400 font-semibold mt-1">
                    {mod.description}
                  </span>
                </div>

                {/* Pie de tarjeta */}
                <div className="w-full pt-2 border-t border-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 group-hover:text-[#24a0ed] uppercase tracking-wider">
                  <span>Ingresar</span>
                  <span className="material-symbols-outlined text-xs ml-1">chevron_right</span>
                </div>
              </div>
            );
          })}

          {/* Botón Añadir Sección (Visible en Modo Edición) */}
          {isEditMode && (
            <div
              onClick={() => setIsModalOpen(true)}
              className="border-2 border-dashed border-[#24a0ed]/60 bg-sky-50/50 rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-sky-100/50 transition-all min-h-[190px]"
            >
              <span className="material-symbols-outlined text-[#24a0ed] text-3xl mb-1">add_circle</span>
              <span className="text-xs font-black text-[#24a0ed] uppercase tracking-wider">Agregar Opción</span>
            </div>
          )}
        </div>

        {/* Footer temático conservado */}
        <footer className="mt-14 pt-6 border-t border-slate-200 text-center lg:text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
            Arquitectura Centro Deportivo 2026
          </p>
        </footer>
      </main>

      {/* Modal para añadir sección rápida */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Nueva Sección Gym</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded p-1 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Título de Botón</label>
                <input
                  value={newSection.title}
                  onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                  type="text"
                  placeholder="ej. Rutinas, Locker"
                  className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold outline-none focus:border-[#24a0ed] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Ruta Destino</label>
                <input
                  value={newSection.path}
                  onChange={(e) => setNewSection({ ...newSection, path: e.target.value })}
                  type="text"
                  placeholder="ej. /gimnasio/rutinas"
                  className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold outline-none focus:border-[#24a0ed] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Ícono (Material Symbol)</label>
                <input
                  value={newSection.icon}
                  onChange={(e) => setNewSection({ ...newSection, icon: e.target.value })}
                  type="text"
                  placeholder="ej. timer, locker, fitness_center"
                  className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold outline-none focus:border-[#24a0ed] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Descripción Breve</label>
                <input
                  value={newSection.description}
                  onChange={(e) => setNewSection({ ...newSection, description: e.target.value })}
                  type="text"
                  placeholder="ej. Asignación de casilleros"
                  className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold outline-none focus:border-[#24a0ed] focus:bg-white"
                />
              </div>

              <button
                onClick={handleAddCustomModule}
                className="mt-2 w-full py-2.5 bg-[#24a0ed] hover:bg-sky-600 text-white rounded-lg font-black text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">save</span>
                <span>Guardar Botón</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GymPanel;