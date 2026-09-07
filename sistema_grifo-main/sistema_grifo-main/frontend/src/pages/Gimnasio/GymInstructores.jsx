import React, { useState, useEffect } from 'react';
import SidebarGym from '../../components/SidebarGym';
import { gymService } from '../../services/api';

const especialidades = ['Musculación', 'CrossFit', 'Yoga', 'Pilates', 'Spinning', 'Natación', 'Kickboxing', 'Nutrición'];

const GymInstructores = () => {
  const [instructores, setInstructores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nombre_completo: '', nro_documento: '', especialidad: 'Musculación', turno: 'Mañana', telefono: '', email: '', activo: true });

  useEffect(() => {
    fetchInstructores();
  }, []);

  const fetchInstructores = async () => {
    setLoading(true);
    try {
      const res = await gymService.getInstructores();
      if (res.success) setInstructores(res.data);
    } catch (error) {
      console.error("Error al cargar instructores:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (inst = null) => {
    setEditing(inst);
    setForm(inst ? { ...inst } : { nombre_completo: '', nro_documento: '', especialidad: 'Musculación', turno: 'Mañana', telefono: '', email: '', activo: true });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = editing 
        ? await gymService.updateInstructor({ ...form, id: editing.id })
        : await gymService.createInstructor(form);
      
      if (res.success) {
        fetchInstructores();
        setIsModalOpen(false);
      } else {
        alert(res.message);
      }
    } catch (error) {
      alert("Error al guardar instructor");
    }
  };

  const toggleStatus = async (inst) => {
    try {
      const nuevoEstado = !inst.activo;
      const res = await gymService.updateInstructor({ ...inst, activo: nuevoEstado });
      if (res.success) fetchInstructores();
    } catch (error) {
      alert("Error al actualizar estado");
    }
  };

  const turnoColor = { 'Mañana': '#F59E0B', 'Tarde': '#8B5CF6', 'Noche': '#3B82F6' };

  return (
    <div className="min-h-screen flex bg-[var(--surface)]">
      <SidebarGym />
      <main className="flex-1 md:ml-64 pt-24 pb-12 px-10 max-w-7xl mx-auto space-y-12">

        <header className="flex items-end justify-between border-b-[3px] border-primary pb-6">
          <div>
            <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">Cuerpo Técnico</h1>
            <h2 className="text-5xl font-black tracking-tighter text-[var(--on-secondary-fixed)]">Instructores</h2>
          </div>
          <button onClick={() => openModal()} className="btn-azure px-8 py-4 flex items-center gap-3 text-xs tracking-widest uppercase shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Nuevo Instructor
          </button>
        </header>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-5">
          {[
            { label: 'Total Instructores', value: instructores.length, color: '#00AEEF', icon: 'sports' },
            { label: 'Activos', value: instructores.filter(i => i.activo).length, color: '#10B981', icon: 'check_circle' },
            { label: 'Especialidades', value: [...new Set(instructores.map(i => i.especialidad))].length, color: '#F59E0B', icon: 'category' },
          ].map(k => (
            <div key={k.label} className="paper-lowest rounded-[2rem] p-7 flex items-center gap-5 shadow-[0_4px_16px_rgba(11,29,45,0.03)] group transition-all hover:bg-surface-container-low border border-primary/5">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: `${k.color}15` }}>
                <span className="material-symbols-outlined text-2xl" style={{ color: k.color }}>{k.icon}</span>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--outline-variant)]">{k.label}</p>
                <p className="text-3xl font-black tracking-tighter" style={{ color: k.color }}>{k.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
             <div className="col-span-full py-20 text-center text-xs font-black uppercase tracking-widest text-[var(--outline-variant)]">Cargando equipo técnico...</div>
          ) : instructores.length === 0 ? (
             <div className="col-span-full py-20 text-center text-xs font-black uppercase tracking-widest text-[var(--outline-variant)]">No hay instructores registrados.</div>
          ) : instructores.map(inst => (
            <div key={inst.id} className={`paper-lowest rounded-[2.5rem] p-8 border border-primary/5 hover:border-primary/30 transition-all shadow-[0_4px_32px_rgba(11,29,45,0.02)] ${inst.activo ? '' : 'opacity-50 grayscale'}`}>
              <div className="flex items-start justify-between mb-5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black bg-primary shadow-lg shadow-primary/20 border border-primary/20">
                  {inst.nombre_completo.split(' ').map(n => n[0]).join('').slice(0,2)}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest" style={{ background: `${turnoColor[inst.turno] || '#ccc'}20`, color: turnoColor[inst.turno] || '#666' }}>
                    {inst.turno}
                  </span>
                  <button 
                    onClick={() => toggleStatus(inst)}
                    className={`text-[8px] font-black underline uppercase tracking-tighter ${inst.activo ? 'text-error' : 'text-emerald-600'}`}
                  >
                    {inst.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-black text-[var(--on-secondary-fixed)] uppercase tracking-tight truncate">{inst.nombre_completo}</h3>
              <p className="text-[11px] font-bold text-[var(--outline-variant)] mb-1">{inst.nro_documento}</p>
              <span className="text-[10px] font-black px-3 py-1 rounded-full bg-primary/10 text-primary uppercase tracking-tighter">
                {inst.especialidad}
              </span>
              <div className="mt-5 pt-5 border-t border-[var(--surface-container)] space-y-1">
                <p className="text-[11px] font-bold text-[var(--on-surface-variant)] flex items-center uppercase tracking-tighter leading-none"><span className="material-symbols-outlined text-[14px] mr-2 text-primary">phone</span>{inst.telefono || 'SIN TELÉFONO'}</p>
                <p className="text-[11px] font-bold text-[var(--on-surface-variant)] truncate flex items-center uppercase tracking-tighter leading-none"><span className="material-symbols-outlined text-[14px] mr-2 text-primary">email</span>{inst.email || 'SIN EMAIL'}</p>
              </div>
              <button onClick={() => openModal(inst)} className="mt-4 w-full py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest text-[var(--on-surface-variant)] hover:bg-primary/10 hover:text-primary transition-all">Editar Perfil</button>
            </div>
          ))}
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[var(--on-secondary-fixed)]/20 backdrop-blur-[24px]">
          <div className="paper-lowest p-10 rounded-[3rem] shadow-2xl w-full max-w-md animate-fade-in overflow-y-auto max-h-[90vh] border border-primary/10">
            <header className="mb-8 flex items-end justify-between border-b border-[var(--surface-container)] pb-6">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-1 text-primary">{editing ? 'Editar' : 'Nuevo'} Instructor</h4>
                <h3 className="text-2xl font-black tracking-tighter text-[var(--on-secondary-fixed)] uppercase">{editing ? editing.nombre_completo : 'Agregar al equipo'}</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full hover:bg-[var(--surface-container-low)] flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </header>
            <form onSubmit={handleSave} className="space-y-4">
              {[
                { label: 'Nombre Completo', key: 'nombre_completo', type: 'text' }, 
                { label: 'Documento DNI', key: 'nro_documento', type: 'text' }, 
                { label: 'Teléfono', key: 'telefono', type: 'text' }, 
                { label: 'Email', key: 'email', type: 'email' }
              ].map(f => (
                <div key={f.key} className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-1">{f.label}</label>
                  <input type={f.type} value={form[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})}
                    className="h-12 paper-nested rounded-xl px-4 font-black transition-all focus:ring-2 ring-primary/20 uppercase" required />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-1">Especialidad</label>
                  <select value={form.especialidad} onChange={e => setForm({...form, especialidad: e.target.value})} className="h-12 paper-nested rounded-xl px-3 font-bold outline-none cursor-pointer">
                    {especialidades.map(e => <option key={e}>{e}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-1">Turno</label>
                  <select value={form.turno} onChange={e => setForm({...form, turno: e.target.value})} className="h-12 paper-nested rounded-xl px-3 font-bold outline-none cursor-pointer">
                    {['Mañana', 'Tarde', 'Noche'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
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

export default GymInstructores;
