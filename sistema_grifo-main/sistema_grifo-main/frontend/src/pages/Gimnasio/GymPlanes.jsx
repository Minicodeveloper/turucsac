import React, { useState, useEffect } from 'react';
import SidebarGym from '../../components/SidebarGym';
import { gymService } from '../../services/api';

const GymPlanes = () => {
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nombre: '', precio: '', duracion_dias: '', descripcion: '', estado: 1 });

  useEffect(() => {
    fetchPlanes();
  }, []);

  const fetchPlanes = async () => {
    setLoading(true);
    try {
      const res = await gymService.getPlanes();
      if (res.success) setPlanes(res.data);
    } catch (error) {
      console.error("Error al cargar planes:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (plan = null) => {
    setEditing(plan);
    setForm(plan ? { ...plan } : { nombre: '', precio: '', duracion_dias: '', descripcion: '', estado: 1 });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const data = { ...form, precio: parseFloat(form.precio), duracion_dias: parseInt(form.duracion_dias) };
      const res = editing 
        ? await gymService.updatePlan({ ...data, id: editing.id })
        : await gymService.savePlan(data);
      
      if (res.success) {
        fetchPlanes();
        setIsModalOpen(false);
      } else {
        alert(res.message);
      }
    } catch (error) {
      alert("Error al guardar el plan");
    }
  };

  const toggleActivo = async (plan) => {
    try {
      const nuevoEstado = plan.estado == 1 ? 0 : 1;
      const res = await gymService.updatePlan({ ...plan, estado: nuevoEstado });
      if (res.success) fetchPlanes();
    } catch (error) {
      alert("Error al cambiar estado");
    }
  };

  const activos = planes.filter(p => p.estado == 1);
  const avgPrecio = activos.length > 0 ? (activos.reduce((a,p)=>a+parseFloat(p.precio),0)/activos.length) : 0;
  const minPrecio = activos.length > 0 ? Math.min(...activos.map(p=>parseFloat(p.precio))) : 0;

  return (
    <div className="min-h-screen flex bg-[var(--surface)]">
      <SidebarGym />
      <main className="flex-1 md:ml-64 pt-24 pb-12 px-10 max-w-7xl mx-auto space-y-12">

        <header className="flex items-end justify-between border-b-[3px] border-primary pb-6">
          <div>
            <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">Membresías Industriales</h1>
            <h2 className="text-5xl font-black tracking-tighter text-[var(--on-secondary-fixed)]">Planes de Gestión</h2>
          </div>
          <button onClick={() => openModal()} className="btn-azure px-8 py-4 flex items-center gap-3 text-xs tracking-widest uppercase shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
            <span className="material-symbols-outlined text-white text-[18px]">add_circle</span>
            Nuevo Plan
          </button>
        </header>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-5">
          {[
            { label: 'Planes Activos', value: activos.length, icon: 'check_circle', color: '#10B981' },
            { label: 'Precio Promedio', value: `S/ ${avgPrecio.toFixed(2)}`, icon: 'trending_up', color: '#00AEEF' },
            { label: 'Precio Base', value: `S/ ${minPrecio.toFixed(2)}`, icon: 'sell', color: '#F59E0B' },
          ].map(k => (
            <div key={k.label} className="paper-lowest rounded-[2rem] p-7 flex items-center gap-5 shadow-[0_4px_16px_rgba(11,29,45,0.03)] group transition-all hover:bg-surface-container-low border border-primary/5">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: `${k.color}15` }}>
                <span className="material-symbols-outlined text-2xl" style={{ color: k.color }}>{k.icon}</span>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--outline-variant)]">{k.label}</p>
                <p className="text-2xl font-black tracking-tighter" style={{ color: k.color }}>{k.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
             <div className="col-span-full py-20 text-center text-xs font-black uppercase tracking-widest text-[var(--outline-variant)]">Cargando catálogo de planes...</div>
          ) : planes.length === 0 ? (
             <div className="col-span-full py-20 text-center text-xs font-black uppercase tracking-widest text-[var(--outline-variant)]">No hay planes registrados.</div>
          ) : planes.map(plan => (
            <div key={plan.id} className={`paper-lowest rounded-[2.5rem] p-8 flex flex-col gap-4 border border-primary/5 hover:border-primary/30 transition-all shadow-[0_4px_32px_rgba(11,29,45,0.02)] ${plan.estado == 1 ? '' : 'opacity-50 grayscale'}`}>
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2 bg-primary/10 transition-transform group-hover:scale-110 shadow-sm border border-primary/10">
                  <span className="material-symbols-outlined text-2xl text-primary">workspace_premium</span>
                </div>
                <button onClick={() => toggleActivo(plan)} className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest transition-all ${plan.estado == 1 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-error/10 text-error'}`}>
                  {plan.estado == 1 ? 'ACTIVO' : 'INACTIVO'}
                </button>
              </div>
              <div>
                <p className="text-xl font-black text-[var(--on-secondary-fixed)] uppercase tracking-tight">{plan.nombre}</p>
                <p className="text-[11px] font-bold text-[var(--outline-variant)] mt-1 uppercase tracking-tighter leading-tight">{plan.descripcion || 'Sin descripción disponible'}</p>
              </div>
              <div className="mt-auto pt-4 border-t border-[var(--surface-container)] flex items-end justify-between">
                <div>
                  <p className="text-3xl font-black tracking-tighter text-primary">S/ {parseFloat(plan.precio).toFixed(2)}</p>
                  <p className="text-[10px] font-bold text-[var(--outline-variant)] uppercase">{plan.duracion_dias} días de acceso</p>
                </div>
                <button onClick={() => openModal(plan)} className="p-3 rounded-xl hover:bg-[var(--surface-container)] transition-all">
                  <span className="material-symbols-outlined text-[18px] text-[var(--on-surface-variant)]">edit</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[var(--on-secondary-fixed)]/20 backdrop-blur-[24px]">
          <div className="paper-lowest p-10 rounded-[3rem] shadow-2xl w-full max-w-sm animate-fade-in border border-primary/10">
            <header className="mb-8 flex items-end justify-between border-b border-[var(--surface-container)] pb-6">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-1 text-primary">{editing ? 'Editar' : 'Crear'} Plan</h4>
                <h3 className="text-3xl font-black tracking-tighter text-[var(--on-secondary-fixed)]">{editing ? editing.nombre : 'Nuevo Plan'}</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full hover:bg-[var(--surface-container-low)] flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </header>
            <form onSubmit={handleSave} className="space-y-4">
              {[
                { label: 'Nombre del Plan', key: 'nombre', type: 'text' },
                { label: 'Precio (S/)', key: 'precio', type: 'number' },
                { label: 'Duración (días)', key: 'duracion_dias', type: 'number' },
                { label: 'Descripción', key: 'descripcion', type: 'text' },
              ].map(f => (
                <div key={f.key} className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-1">{f.label}</label>
                  <input type={f.type} value={form[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})}
                    className="h-12 paper-nested rounded-xl px-4 font-black transition-all focus:ring-2 ring-primary/20" required />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="h-14 paper-nested rounded-2xl font-black text-[10px] tracking-widest uppercase hover:bg-surface-container-high transition-all">Cancelar</button>
                <button type="submit" className="h-14 btn-azure uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GymPlanes;
