import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { layoutService } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const Panel = () => {
  const [layout, setLayout] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSection, setNewSection] = useState({ id: '', title: '', icon: '' });

  const user = JSON.parse(sessionStorage.getItem('usuario') || '{}');
  const userRole = (user.rol || user.role || 'admin').toLowerCase();
  const isAdmin = userRole.includes('admin');
  const navigate = useNavigate();

  useEffect(() => {
    loadLayout();
  }, []);

  const loadLayout = async () => {
    try {
      const data = await layoutService.getLayout();
      if (data.success && Array.isArray(data.data)) {
        setLayout(data.data);
      }
    } catch (error) {
      console.error('Error cargando layout', error);
    }
  };

  const saveLayout = async (updatedLayout) => {
    try {
      await layoutService.saveLayout(updatedLayout);
    } catch (error) {
      console.error('Error guardando layout', error);
      alert('Error al guardar cambios en el servidor');
    }
  };

  const handleDelete = (index, e) => {
    e.stopPropagation();
    if (window.confirm(`¿Estás seguro de eliminar el módulo "${layout[index].title}"?`)) {
      const updated = layout.filter((_, i) => i !== index);
      setLayout(updated);
      saveLayout(updated);
    }
  };

  const handleAddSection = () => {
    if (!newSection.id || !newSection.title || !newSection.icon) {
      alert('Por favor completa todos los campos');
      return;
    }
    const updated = [...layout, { ...newSection, badge: { text: 'NUEVO', color: 'tertiary' } }];
    setLayout(updated);
    saveLayout(updated);
    setIsModalOpen(false);
    setNewSection({ id: '', title: '', icon: '' });
  };

  const handleCardClick = (section) => {
    if (isEditMode) return;
    const id = section.id.toLowerCase();
    const title = section.title.toLowerCase();

    if (id === 'pos' || title.includes('venta')) navigate('/pos');
    else if (id === 'inventario' || title.includes('inventario')) navigate('/inventario');
    else if (id === 'compras' || id === 'abastecimiento' || title.includes('abastecimiento')) navigate('/compras');
    else if (id === 'finanzas' || title.includes('cuentas')) navigate('/finanzas');
    else if (id === 'clientes' || title.includes('base clientes')) navigate('/clientes');
    else if (id === 'configuracion' || title.includes('configuraci')) navigate('/admin/configuracion');
    else if (id === 'admin') navigate('/admin/usuarios');
    else if (id === 'gimnasio') navigate('/gimnasio');
    else alert(`Módulo "${section.title}" — Próximamente disponible`);
  };

  // Asignación de estilo operativo rápido según el tipo de módulo
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

      {/* Sub-barra de estado operativo rápido al estilo Rapifac */}
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
              <span>Usuario: <strong className="uppercase">{user.nombre || user.usuario || 'ADMIN'}</strong></span>
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

            {isAdmin && (
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold uppercase transition-all cursor-pointer ${
                  isEditMode
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
                title="Configurar orden o añadir botones"
              >
                <span className="material-symbols-outlined text-base">edit</span>
                <span>{isEditMode ? 'Terminar Edición' : 'Editar Panel'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Cuadrícula de Botones Operativos Rápidos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {layout
            .filter((section) => {
              if (isAdmin) return true;
              const restricted = ['equipo', 'configuracion', 'planillas', 'contabilidad', 'sire', 'finanzas', 'lotes'];
              return !restricted.includes(section.id.toLowerCase());
            })
            .map((section, index) => {
              const visual = getModuleVisuals(section);

              return (
                <div
                  key={section.id + index}
                  onClick={() => handleCardClick(section)}
                  className={`group relative bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col items-center justify-between text-center cursor-pointer min-h-[190px] shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${visual.borderHover}`}
                >
                  {/* Atajo visual en esquina */}
                  <span className="absolute top-3 left-3 text-[10px] font-mono font-black text-slate-300 group-hover:text-slate-500 transition-colors">
                    {visual.shortcutTag}
                  </span>

                  {/* Badge en caso de tenerlo */}
                  {section.badge && (
                    <div className="absolute top-3 right-3">
                      <span className="bg-[#24a0ed] text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                        {section.badge.text}
                      </span>
                    </div>
                  )}

                  {/* Botón de eliminación en modo edición */}
                  {isEditMode && (
                    <button
                      onClick={(e) => handleDelete(index, e)}
                      className="absolute top-2 right-2 bg-rose-600 text-white rounded-full p-1.5 hover:bg-rose-700 transition-all z-10 shadow-md cursor-pointer"
                      title="Eliminar botón"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  )}

                  {/* Icono central de gran tamaño */}
                  <div className="my-auto flex flex-col items-center">
                    <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-105 ${visual.accentBg}`}>
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

          {/* Tarjeta de añadir módulo en modo edición */}
          {isEditMode && (
            <div
              onClick={() => setIsModalOpen(true)}
              className="border-2 border-dashed border-[#24a0ed]/60 bg-sky-50/50 rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-sky-100/50 transition-all min-h-[190px]"
            >
              <span className="material-symbols-outlined text-[#24a0ed] text-3xl mb-1">add_circle</span>
              <span className="text-xs font-black text-[#24a0ed] uppercase tracking-wider">Agregar Sección</span>
            </div>
          )}
        </div>
      </main>

      {/* Modal para Agregar Sección */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Nueva Sección Rápida</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded p-1 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">ID / Ruta</label>
                <input
                  value={newSection.id}
                  onChange={(e) => setNewSection({ ...newSection, id: e.target.value })}
                  type="text"
                  placeholder="ej. pos, inventario, compras"
                  className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold outline-none focus:border-[#24a0ed] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Título de Botón</label>
                <input
                  value={newSection.title}
                  onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                  type="text"
                  placeholder="ej. Ventas Pista"
                  className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold outline-none focus:border-[#24a0ed] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Nombre del Ícono (Material)</label>
                <input
                  value={newSection.icon}
                  onChange={(e) => setNewSection({ ...newSection, icon: e.target.value })}
                  type="text"
                  placeholder="ej. point_of_sale, local_gas_station"
                  className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold outline-none focus:border-[#24a0ed] focus:bg-white"
                />
              </div>

              <button
                onClick={handleAddSection}
                className="mt-2 w-full py-2.5 bg-[#24a0ed] hover:bg-sky-600 text-white rounded-lg font-black text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">save</span>
                <span>Guardar Sección</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Panel;