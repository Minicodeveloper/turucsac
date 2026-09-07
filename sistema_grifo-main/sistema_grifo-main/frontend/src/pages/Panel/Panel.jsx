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
  const userRole = user.rol || 'admin'; // fallback to admin for testing
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
      console.error("Error cargando layout", error);
    }
  };

  const saveLayout = async (updatedLayout) => {
    try {
      await layoutService.saveLayout(updatedLayout);
    } catch (error) {
      console.error("Error guardando layout", error);
      alert("Error al guardar cambios en el servidor");
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
      alert("Por favor completa todos los campos");
      return;
    }
    const updated = [...layout, { ...newSection, badge: { text: "NUEVO", color: "tertiary" } }];
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

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <Navbar />
      
      <main className="pt-24 pb-12 px-6 lg:px-24 max-w-[1920px] mx-auto">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-on-secondary-fixed tracking-tighter uppercase mb-2">Panel de Control</h1>
            <p className="text-on-surface-variant font-medium text-lg">Gestión integral de recursos y operaciones empresariales</p>
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
                className={`p-3 rounded-full transition-all ${isEditMode ? 'bg-primary-container text-white shadow-lg' : 'text-primary-container hover:bg-surface-container'}`}
                title="Editar Panel"
              >
                <span className="material-symbols-outlined text-2xl">edit</span>
              </button>
            )}
            
            <div className="bg-surface-container-lowest px-5 py-2.5 rounded-xl border border-outline-variant/30 flex items-center gap-3 shadow-sm">
              <span className="material-symbols-outlined text-primary-container">calendar_today</span>
              <span className="text-sm font-black text-on-surface uppercase tracking-tight">
                {new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
          {layout
            .filter(section => {
              if (userRole === 'admin') return true;
              const restricted = ['equipo', 'configuracion', 'planillas', 'contabilidad', 'sire', 'finanzas', 'lotes'];
              return !restricted.includes(section.id.toLowerCase());
            })
            .map((section, index) => (
              <div 
                key={section.id + index}
                onClick={() => handleCardClick(section)}
                className="tonal-card bg-surface-container-low group p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center cursor-pointer border border-transparent hover:border-primary-container/20 relative min-h-[220px] transition-all duration-500 hover:shadow-2xl hover:shadow-primary-container/5 hover:-translate-y-2"
              >
                {section.badge && (
                  <div className="absolute top-6 right-6">
                    <span className={`${section.badge.color === 'tertiary' ? 'bg-tertiary-container text-white' : 'bg-secondary-container text-on-secondary-container'} text-[9px] font-black px-2 py-0.5 rounded-full tracking-widest uppercase`}>
                      {section.badge.text}
                    </span>
                  </div>
                )}
                
                {isEditMode && (
                  <button 
                    onClick={(e) => handleDelete(index, e)}
                    className="absolute top-6 left-6 bg-error text-white rounded-full p-2 hover:bg-red-700 transition-all flex items-center shadow-lg z-10"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                )}
                
                <div className="w-16 h-16 rounded-3xl bg-primary-container/10 flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:bg-primary-container/20">
                  <span className={`material-symbols-outlined text-primary-container text-4xl transition-transform duration-500 group-hover:rotate-6 ${isEditMode ? 'animate-pulse' : ''}`}>
                    {section.icon}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-black text-on-secondary-fixed uppercase tracking-wider leading-tight">
                    {section.title}
                  </h3>
                  {section.desc && (
                    <p className="text-[11px] font-medium text-on-surface-variant leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                      {section.desc}
                    </p>
                  )}
                </div>
              </div>
          ))}
          
          {isEditMode && (
            <div 
              onClick={() => setIsModalOpen(true)}
              className="tonal-card border-dashed border-2 border-primary-container/40 p-8 rounded-3xl flex flex-col items-center justify-center text-center cursor-pointer hover:bg-primary-container/10 transition-all min-h-[160px]"
            >
              <span className="material-symbols-outlined text-primary-container mb-4 text-5xl">add_circle</span>
              <span className="text-sm font-black text-primary-container uppercase tracking-tight">Agregar Sección</span>
            </div>
          )}
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-on-surface/60 backdrop-blur-md">
          <div className="bg-surface p-10 rounded-[2.5rem] shadow-2xl border border-outline-variant/30 w-full max-w-sm scale-in">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-on-secondary-fixed tracking-tight lowercase first-letter:uppercase">Nueva Sección</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex flex-col gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">ID (Ruta)</label>
                <input 
                  value={newSection.id}
                  onChange={(e) => setNewSection({...newSection, id: e.target.value})}
                  type="text" placeholder="Ej. ventas" 
                  className="w-full text-on-surface bg-surface-container-low border border-outline-variant/40 rounded-xl p-3.5 focus:border-primary-container outline-none text-sm font-bold shadow-inner"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Título</label>
                <input 
                  value={newSection.title}
                  onChange={(e) => setNewSection({...newSection, title: e.target.value})}
                  type="text" placeholder="Ej. Ventas" 
                  className="w-full text-on-surface bg-surface-container-low border border-outline-variant/40 rounded-xl p-3.5 focus:border-primary-container outline-none text-sm font-bold shadow-inner"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Ícono (Material)</label>
                <input 
                  value={newSection.icon}
                  onChange={(e) => setNewSection({...newSection, icon: e.target.value})}
                  type="text" placeholder="Ej. point_of_sale" 
                  className="w-full text-on-surface bg-surface-container-low border border-outline-variant/40 rounded-xl p-3.5 focus:border-primary-container outline-none text-sm font-bold shadow-inner"
                />
              </div>
              <button 
                onClick={handleAddSection}
                className="mt-4 w-full h-14 flex items-center justify-center gap-3 rounded-2xl bg-primary-container text-white font-black uppercase tracking-widest shadow-xl hover:shadow-primary-container/20 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-xl">save</span> Guardar Sección
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Panel;
