import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { ADMIN_ROLES, ALL_ROLES, SUPERVISOR_ROLES, getUserRole, hasRole } from '../../utils/roles';

const QUICK_ACCESS_OPTIONS = [
  { id: 'pos', title: 'Punto de Venta', desc: 'Ventas y comprobantes', icon: 'point_of_sale', path: '/pos', roles: ALL_ROLES },
  { id: 'clientes', title: 'Clientes', desc: 'Directorio de clientes', icon: 'group', path: '/clientes', roles: ALL_ROLES },
  { id: 'cierres', title: 'Cierres de Caja', desc: 'Arqueo e historial', icon: 'account_balance_wallet', path: '/cierres-caja', roles: ALL_ROLES },
  { id: 'inventario', title: 'Inventario', desc: 'Stock y movimientos', icon: 'inventory_2', path: '/inventario', roles: SUPERVISOR_ROLES },
  { id: 'compras', title: 'Compras', desc: 'Abastecimiento', icon: 'local_shipping', path: '/compras', roles: SUPERVISOR_ROLES },
  { id: 'boletas', title: 'Boletas', desc: 'Historial de comprobantes', icon: 'receipt_long', path: '/boletas', roles: SUPERVISOR_ROLES },
  { id: 'dashboard', title: 'Analítica', desc: 'Indicadores de operación', icon: 'analytics', path: '/dashboard', roles: SUPERVISOR_ROLES },
  { id: 'finanzas', title: 'Finanzas', desc: 'Cuentas y reportes', icon: 'account_balance', path: '/finanzas', roles: ADMIN_ROLES },
  { id: 'configuracion', title: 'Configuración', desc: 'Administración de empresa', icon: 'settings', path: '/admin/configuracion', roles: ADMIN_ROLES },
  { id: 'gimnasio', title: 'Gimnasio', desc: 'Gestión del gimnasio', icon: 'fitness_center', path: '/gimnasio', roles: ALL_ROLES },
];

const Panel = () => {
  const [isEditMode, setIsEditMode] = useState(false);

  // 1. Lectura de datos de sesión activa
  const user = JSON.parse(sessionStorage.getItem('usuario') || '{}');
  const userRole = getUserRole(user);
  const isAdmin = hasRole(userRole, ADMIN_ROLES);
  const navigate = useNavigate();
  const availableSections = QUICK_ACCESS_OPTIONS.filter((section) => hasRole(userRole, section.roles));
  const preferenceKey = `turu.quick-access.${user.id || userRole}`;
  const [selectedSectionIds, setSelectedSectionIds] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(preferenceKey) || 'null');
      return Array.isArray(saved)
        ? saved
        : availableSections.map((section) => section.id);
    } catch (error) {
      console.error('Error al leer los accesos rápidos guardados:', error);
      return availableSections.map((section) => section.id);
    }
  });

  // 2. Detección precisa del nombre real del trabajador sin forzar ADMIN por defecto
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

  useEffect(() => {
    const authorizedIds = new Set(
      QUICK_ACCESS_OPTIONS
        .filter((section) => hasRole(userRole, section.roles))
        .map((section) => section.id)
    );
    const safeSelection = selectedSectionIds.filter((id) => authorizedIds.has(id));
    try {
      localStorage.setItem(preferenceKey, JSON.stringify(safeSelection));
    } catch (error) {
      console.error('Error al guardar los accesos rápidos:', error);
    }
  }, [preferenceKey, selectedSectionIds, userRole]);

  const handleCardClick = (section) => {
    if (isEditMode) return;
    navigate(section.path);
  };

  const toggleSection = (sectionId) => {
    setSelectedSectionIds((current) => (
      current.includes(sectionId)
        ? current.filter((id) => id !== sectionId)
        : [...current, sectionId]
    ));
  };

  // Asignación de diseño operativo rápido según el tipo de módulo
  const getModuleVisuals = (section) => {
    const id = (section.id || '').toLowerCase();
    const title = (section.title || '').toLowerCase();

    if (id === 'pos' || title.includes('venta')) {
      return {
        badgeText: 'Pista & Despacho',
        accentBg: 'bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white',
        borderHover: 'hover:border-emerald-500 hover:shadow-emerald-100',
        icon: section.icon || 'point_of_sale',
        shortcutTag: 'F1',
      };
    }
    if (id === 'inventario' || title.includes('inventario')) {
      return {
        badgeText: 'Kardex & Tanques',
        accentBg: 'bg-indigo-50 text-indigo-600 border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white',
        borderHover: 'hover:border-indigo-500 hover:shadow-indigo-100',
        icon: section.icon || 'inventory_2',
        shortcutTag: 'F2',
      };
    }
    if (id === 'compras' || id === 'abastecimiento' || title.includes('abastecimiento')) {
      return {
        badgeText: 'Cisternas & Proveedores',
        accentBg: 'bg-amber-50 text-amber-600 border-amber-100 group-hover:bg-amber-500 group-hover:text-white',
        borderHover: 'hover:border-amber-500 hover:shadow-amber-100',
        icon: section.icon || 'local_shipping',
        shortcutTag: 'F3',
      };
    }
    if (id === 'clientes' || title.includes('clientes')) {
      return {
        badgeText: 'Cartera RUC / DNI',
        accentBg: 'bg-sky-50 text-sky-600 border-sky-100 group-hover:bg-sky-500 group-hover:text-white',
        borderHover: 'hover:border-sky-500 hover:shadow-sky-100',
        icon: section.icon || 'group',
        shortcutTag: 'F4',
      };
    }
    if (id === 'finanzas' || title.includes('finanzas') || title.includes('caja')) {
      return {
        badgeText: 'Cierre de Turno & Arqueo',
        accentBg: 'bg-teal-50 text-teal-600 border-teal-100 group-hover:bg-teal-600 group-hover:text-white',
        borderHover: 'hover:border-teal-500 hover:shadow-teal-100',
        icon: section.icon || 'account_balance_wallet',
        shortcutTag: 'F5',
      };
    }
    if (id === 'gimnasio') {
      return {
        badgeText: 'Club Deportivo',
        accentBg: 'bg-purple-50 text-purple-600 border-purple-100 group-hover:bg-purple-600 group-hover:text-white',
        borderHover: 'hover:border-purple-500 hover:shadow-purple-100',
        icon: section.icon || 'fitness_center',
        shortcutTag: 'F6',
      };
    }

    return {
      badgeText: 'Configuración & Seguridad',
      accentBg: 'bg-slate-100 text-slate-700 border-slate-200 group-hover:bg-slate-800 group-hover:text-white',
      borderHover: 'hover:border-slate-500 hover:shadow-slate-100',
      icon: section.icon || 'settings',
      shortcutTag: 'SYS',
    };
  };

  return (
    <div className="min-h-screen bg-[#edf2f7] text-slate-800 font-sans flex flex-col">
      <Navbar />

      {/* Sub-barra de estado operativo rápido (Estilo Rapifac / TURUCSAC) */}
      <div className="bg-[#24a0ed] text-white px-6 py-2.5 shadow-sm mt-16 md:mt-20">
        <div className="max-w-[1750px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-black tracking-wider uppercase bg-sky-800/40 px-2 py-0.5 rounded text-[11px]">
              TURUCSAC &gt;&gt;
            </span>
            <span className="font-bold tracking-tight text-white uppercase text-[11px]">
              MÓDULO DE CONTROL CENTRAL DE ESTACIÓN
            </span>
            <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-100 border border-emerald-400/40 px-2 py-0.5 rounded text-[10px] font-bold uppercase ml-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              En Línea
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-sky-800/40 px-3 py-1 rounded text-[11px] font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">person</span>
              <span>
                Usuario: <strong className="uppercase">{nombreTrabajador}</strong>
              </span>
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
        {/* Barra superior de acciones */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <span>Menú Operativo Principal</span>
            </h1>
            <p className="text-slate-500 text-xs font-semibold mt-0.5">
              Selecciona el proceso a ejecutar o presiona el acceso directo.
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
              title="Elegir los accesos rápidos de tu perfil"
            >
              <span className="material-symbols-outlined text-base">{isEditMode ? 'check' : 'tune'}</span>
              <span>{isEditMode ? 'Listo' : 'Editar Panel'}</span>
            </button>
          </div>
        </div>

        {isEditMode && (
          <section aria-label="Personalizar accesos rápidos" className="mb-6 rounded-2xl border border-sky-100 bg-white p-5 shadow-xs">
            <div className="mb-4">
              <h2 className="text-sm font-black uppercase tracking-wide text-slate-800">Accesos permitidos para tu perfil</h2>
              <p className="mt-1 text-xs text-slate-500">Activa o desactiva los módulos que quieres ver. La selección se guarda para tu usuario en este dispositivo.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {availableSections.map((section) => {
                const isSelected = selectedSectionIds.includes(section.id);
                return (
                  <button
                    key={section.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => toggleSection(section.id)}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                      isSelected
                        ? 'border-sky-300 bg-sky-50 text-sky-800'
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">{section.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-black uppercase">{section.title}</span>
                      <span className="block truncate text-[10px]">{section.desc}</span>
                    </span>
                    <span className="material-symbols-outlined text-base">{isSelected ? 'check_circle' : 'radio_button_unchecked'}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Cuadrícula de Botones Operativos Rápidos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {availableSections
            .filter((section) => selectedSectionIds.includes(section.id))
            .map((section) => {
              const visual = getModuleVisuals(section);

              return (
                <div
                  key={section.id}
                  onClick={() => handleCardClick(section)}
                  className={`group relative bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col items-center justify-between text-center cursor-pointer min-h-[190px] shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${visual.borderHover}`}
                >
                  {/* Atajo visual en esquina */}
                  <span className="absolute top-3 left-3 text-[10px] font-mono font-black text-slate-300 group-hover:text-slate-500 transition-colors">
                    {visual.shortcutTag}
                  </span>

                  {/* Icono central de gran tamaño */}
                  <div className="my-auto flex flex-col items-center">
                    <div
                      className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-105 ${visual.accentBg}`}
                    >
                      <span className="material-symbols-outlined text-3xl font-light">
                        {visual.icon}
                      </span>
                    </div>

                    <h2 className="text-xs font-black uppercase text-slate-800 tracking-wider group-hover:text-[#24a0ed] transition-colors leading-tight">
                      {section.title}
                    </h2>
                    <span className="text-[10px] text-slate-400 font-semibold mt-1">
                      {section.desc || visual.badgeText}
                    </span>
                  </div>

                  {/* Indicador inferior directo */}
                  <div className="w-full pt-2 border-t border-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 group-hover:text-[#24a0ed] uppercase tracking-wider">
                    <span>Acceder</span>
                    <span className="material-symbols-outlined text-xs ml-1">chevron_right</span>
                  </div>
                </div>
              );
            })}
        </div>
      </main>

    </div>
  );
};

export default Panel;