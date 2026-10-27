import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { ADMIN_ROLES, ALL_ROLES, SUPERVISOR_ROLES, getUserRole, hasRole } from '../../utils/roles';

const gymModules = [
  {
    id: 'socios',
    title: 'Socios',
    icon: 'how_to_reg',
    path: '/gimnasio/socios',
    badge: null,
    description: 'Registro y membresías',
    shortcut: 'F1',
    roles: ALL_ROLES,
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
    roles: ADMIN_ROLES,
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
    roles: ALL_ROLES,
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
    roles: SUPERVISOR_ROLES,
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
    roles: SUPERVISOR_ROLES,
    theme: {
      accentBg: 'bg-teal-50 text-teal-600 border-teal-100 group-hover:bg-teal-600 group-hover:text-white',
      borderHover: 'hover:border-teal-500 hover:shadow-teal-100',
    }
  },
];

const GymPanel = () => {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem('usuario') || '{}');
  const userRole = getUserRole(user);
  const isAdmin = hasRole(userRole, ADMIN_ROLES);
  const availableModules = gymModules.filter((module) => hasRole(userRole, module.roles || ALL_ROLES));
  const preferenceKey = `turu.quick-access.gym.${user.id || userRole}`;

  // Detección precisa del nombre del colaborador
  const nombreTrabajador =
    user.nombres ||
    user.nombre_completo ||
    user.nombre ||
    user.trabajador ||
    user.empleado ||
    user.personal ||
    user.username ||
    user.usuario ||
    (isAdmin ? 'Administrador' : 'Cajero');

  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedModuleIds, setSelectedModuleIds] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(preferenceKey) || 'null');
      return Array.isArray(saved) ? saved : availableModules.map((module) => module.id);
    } catch (error) {
      console.error('Error al leer los accesos rápidos del gimnasio:', error);
      return availableModules.map((module) => module.id);
    }
  });

  useEffect(() => {
    const authorizedIds = new Set(
      gymModules
        .filter((module) => hasRole(userRole, module.roles || ALL_ROLES))
        .map((module) => module.id)
    );
    const safeSelection = selectedModuleIds.filter((id) => authorizedIds.has(id));
    try {
      localStorage.setItem(preferenceKey, JSON.stringify(safeSelection));
    } catch (error) {
      console.error('Error al guardar los accesos rápidos del gimnasio:', error);
    }
  }, [preferenceKey, selectedModuleIds, userRole]);

  const toggleModule = (moduleId) => {
    setSelectedModuleIds((current) => (
      current.includes(moduleId)
        ? current.filter((id) => id !== moduleId)
        : [...current, moduleId]
    ));
  };

  return (
    <div className="min-h-screen bg-[#edf2f7] text-slate-800 font-sans flex flex-col">
      <Navbar />

      {/* Sub-barra operativa de estado */}
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
              <span>Operador: <strong className="uppercase">{nombreTrabajador}</strong></span>
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
              Control de acceso de socios, planes vigentes, entrenadores y flujo de caja.
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

            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold uppercase transition-all cursor-pointer ${
                  isEditMode
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              title="Elegir accesos rápidos permitidos para tu perfil"
            >
              <span className="material-symbols-outlined text-base">{isEditMode ? 'check' : 'tune'}</span>
              <span>{isEditMode ? 'Listo' : 'Editar Panel'}</span>
            </button>
          </div>
        </div>

        {isEditMode && (
          <section aria-label="Personalizar accesos rápidos del gimnasio" className="mb-6 rounded-2xl border border-sky-100 bg-white p-5 shadow-xs">
            <div className="mb-4">
              <h2 className="text-sm font-black uppercase tracking-wide text-slate-800">Accesos permitidos para tu perfil</h2>
              <p className="mt-1 text-xs text-slate-500">Selecciona los módulos del gimnasio que quieres mostrar. Los cambios se guardan para tu usuario en este dispositivo.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {availableModules.map((module) => {
                const isSelected = selectedModuleIds.includes(module.id);
                return (
                  <button
                    key={module.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => toggleModule(module.id)}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                      isSelected
                        ? 'border-sky-300 bg-sky-50 text-sky-800'
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">{module.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-black uppercase">{module.title}</span>
                      <span className="block truncate text-[10px]">{module.description}</span>
                    </span>
                    <span className="material-symbols-outlined text-base">{isSelected ? 'check_circle' : 'radio_button_unchecked'}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Grilla de accesos directos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {availableModules
            .filter((module) => selectedModuleIds.includes(module.id))
            .map((mod) => {
            const visual = mod.theme || {
              accentBg: 'bg-sky-50 text-[#0284c7] border-sky-100 group-hover:bg-[#0284c7] group-hover:text-white',
              borderHover: 'hover:border-[#0284c7] hover:shadow-sky-100',
            };

            return (
              <div
                key={mod.id}
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

        </div>

        {/* Footer temático */}
        <footer className="mt-14 pt-6 border-t border-slate-200 text-center lg:text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
            Arquitectura Centro Deportivo 2026
          </p>
        </footer>
      </main>

    </div>
  );
};

export default GymPanel;