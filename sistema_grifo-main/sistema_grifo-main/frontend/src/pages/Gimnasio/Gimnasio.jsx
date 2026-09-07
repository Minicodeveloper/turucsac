import React, { useState, useEffect } from 'react';
import SidebarGym from '../../components/SidebarGym';
import { gymService } from '../../services/api';

const Gimnasio = () => {
  const [members, setMembers] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nombre_completo: '', nro_documento: '', plan_id: '', fecha_inicio: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (term = '') => {
    setLoading(true);
    try {
      const [membersRes, planesRes] = await Promise.all([
        gymService.getSocios(term),
        gymService.getPlanes()
      ]);
      if (membersRes.success) setMembers(membersRes.data);
      if (planesRes.success) {
        setPlanes(planesRes.data);
        if (planesRes.data.length > 0 && !formData.plan_id) {
          setFormData(prev => ({ ...prev, plan_id: planesRes.data[0].id }));
        }
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    fetchData(val);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await gymService.createSocio(formData);
      if (res.success) {
        fetchData();
        setIsModalOpen(false);
        setFormData({ 
          nombre_completo: '', nro_documento: '', 
          plan_id: planes[0]?.id || '', 
          fecha_inicio: new Date().toISOString().split('T')[0] 
        });
      } else {
        alert(res.message);
      }
    } catch (error) {
      alert("Error al registrar socio");
    }
  };

  const toggleEstado = async (socio) => {
    try {
      const nuevoEstado = socio.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
      const res = await gymService.updateSocio({
        id: socio.id,
        nombre_completo: socio.nombre_completo,
        plan_id: socio.plan_id,
        estado: nuevoEstado
      });
      if (res.success) fetchData(search);
    } catch (error) {
      alert("Error al actualizar estado");
    }
  };

  const activos = members.filter(m => m.estado === 'ACTIVO').length;
  const vencidos = members.filter(m => m.estado === 'VENCIDO' || m.dias_restantes < 0).length;
  const ingresos = members
    .filter(m => m.estado === 'ACTIVO')
    .reduce((acc, m) => acc + parseFloat(m.plan_precio || 0), 0);

  return (
    <div className="min-h-screen flex bg-[var(--surface)]">
      <SidebarGym />
      <main className="flex-1 md:ml-64 pt-24 pb-12 px-10 max-w-7xl mx-auto space-y-12">

        {/* Header */}
        <header className="flex items-end justify-between border-b-[3px] border-primary pb-6">
          <div>
            <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">Servicios Deportivos</h1>
            <h2 className="text-5xl font-black tracking-tighter text-[var(--on-secondary-fixed)]">El Libro de Socios</h2>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-azure px-8 py-4 flex items-center gap-3 text-xs tracking-widest uppercase shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
          >
            <span className="material-symbols-outlined text-white text-[18px]">person_add</span>
            Nuevo Socio
          </button>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="paper-lowest rounded-[2rem] p-8 flex items-center gap-6 border border-primary/5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-600 text-3xl">how_to_reg</span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--outline-variant)]">Socios Activos</p>
              <p className="text-4xl font-black tracking-tighter text-emerald-600">{activos}</p>
            </div>
          </div>

          <div className="paper-lowest rounded-[2rem] p-8 flex items-center gap-6 border border-primary/5">
            <div className="w-14 h-14 rounded-2xl bg-[var(--error)]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[var(--error)] text-3xl">event_busy</span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--outline-variant)]">Membresías Vencidas</p>
              <p className="text-4xl font-black tracking-tighter text-[var(--error)]">{vencidos}</p>
            </div>
          </div>

          <div className="paper-lowest rounded-[2rem] p-8 flex items-center gap-6 border border-primary/5">
            <div className="w-14 h-14 rounded-2xl bg-[var(--primary-container)]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[var(--primary-container)] text-3xl">payments</span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--outline-variant)]">Ingresos Activos</p>
              <p className="text-4xl font-black tracking-tighter text-[var(--primary-container)]">S/ {ingresos.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Plans Grid (Display only active ones) */}
        <section>
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--outline-variant)] mb-6">Planes de Gestión</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {planes.filter(p=>p.estado == 1).slice(0, 4).map(plan => (
              <div key={plan.id} className="paper-lowest rounded-[2rem] p-7 hover:shadow-md transition-all group border border-primary/5">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl">fitness_center</span>
                </div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--outline-variant)] mb-1 truncate">{plan.descripcion || 'Servicio Estándar'}</p>
                <p className="text-lg font-black text-[var(--on-secondary-fixed)] uppercase tracking-tight mb-2 truncate">{plan.nombre}</p>
                <p className="text-3xl font-black tracking-tighter text-[var(--primary-container)]">S/ {parseFloat(plan.precio).toFixed(2)}</p>
                <p className="text-[10px] font-bold text-[var(--outline-variant)] mt-1">/ {plan.duracion_dias} días</p>
              </div>
            ))}
          </div>
        </section>

        {/* Members Table */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--outline-variant)]">Registro de Socios</h3>
            <div className="relative max-w-xs w-full">
              <input
                type="text"
                placeholder="Buscar por nombre o DNI..."
                value={search}
                onChange={handleSearch}
                className="w-full h-11 paper-lowest rounded-xl px-11 outline-none font-bold text-sm text-[var(--on-secondary-fixed)] focus:ring-2 ring-[var(--primary-container)]/10"
              />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--outline-variant)] text-lg">search</span>
            </div>
          </div>

          <div className="paper-lowest rounded-[2.5rem] overflow-hidden shadow-sm border border-primary/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-[var(--surface-container-low)] text-[var(--on-surface-variant)]">
                    <th className="py-5 px-8 text-[10px] font-black tracking-widest uppercase">Socio</th>
                    <th className="py-5 px-8 text-[10px] font-black tracking-widest uppercase">Documento</th>
                    <th className="py-5 px-8 text-[10px] font-black tracking-widest uppercase">Plan</th>
                    <th className="py-5 px-8 text-[10px] font-black tracking-widest uppercase text-center">Días Rest.</th>
                    <th className="py-5 px-8 text-[10px] font-black tracking-widest uppercase text-center">Estado</th>
                    <th className="py-5 px-8 text-[10px] font-black tracking-widest uppercase text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--surface-container)]">
                  {loading ? (
                    <tr><td colSpan="6" className="py-16 text-center text-[var(--outline-variant)] font-black text-xs uppercase">Cargando datos...</td></tr>
                  ) : members.length === 0 ? (
                    <tr><td colSpan="6" className="py-16 text-center text-[var(--outline-variant)] font-black text-xs uppercase">Sin socios registrados en la base de datos.</td></tr>
                  ) : members.map(member => (
                    <tr key={member.id} className="hover:bg-[var(--surface-container-low)] transition-colors">
                      <td className="py-5 px-8 font-black text-[var(--on-secondary-fixed)] uppercase tracking-tight">{member.nombre_completo}</td>
                      <td className="py-5 px-8 font-bold text-[var(--on-surface-variant)]">{member.nro_documento}</td>
                      <td className="py-5 px-8">
                        <span className="text-xs font-black text-[var(--primary-container)] bg-[var(--primary-container)]/10 px-3 py-1 rounded-full uppercase">
                          {member.plan_nombre}
                        </span>
                      </td>
                      <td className="py-5 px-8 text-center text-sm">
                        <div className={`inline-flex items-center gap-1 font-black px-3 py-1 rounded-lg ${
                          member.dias_restantes <= 0 ? 'text-error bg-error/10' :
                          member.dias_restantes <= 3 ? 'text-amber-600 bg-amber-500/10 animate-pulse' :
                          'text-emerald-600 bg-emerald-500/10'
                        }`}>
                          <span className="material-symbols-outlined text-sm">{member.dias_restantes <= 0 ? 'history' : 'timer'}</span>
                          {member.dias_restantes} d
                        </div>
                      </td>
                      <td className="py-5 px-8 text-center">
                        <span className={`micro-tag ${
                          member.estado === 'ACTIVO' ? 'bg-emerald-500/10 text-emerald-600' :
                          member.estado === 'VENCIDO' ? 'bg-[var(--error)]/10 text-[var(--error)]' :
                          'bg-[var(--surface-container-highest)]/30 text-[var(--outline-variant)]'
                        }`}>
                          {member.estado}
                        </span>
                      </td>
                      <td className="py-5 px-8 text-center">
                        <button
                          onClick={() => toggleEstado(member)}
                          className="p-2.5 rounded-xl hover:bg-[var(--surface-container)] text-[var(--on-surface-variant)] transition-all"
                          title="Alternar estado"
                        >
                          <span className="material-symbols-outlined text-[18px]">sync_alt</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      {/* Modal Nuevo Socio */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[var(--on-secondary-fixed)]/20 backdrop-blur-[24px]">
          <div className="paper-lowest p-10 rounded-[3rem] shadow-2xl w-full max-w-sm animate-fade-in border border-primary/10">
            <header className="mb-8 flex items-end justify-between border-b border-[var(--surface-container)] pb-6">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--primary-container)] mb-1">Registro</h4>
                <h3 className="text-3xl font-black tracking-tighter text-[var(--on-secondary-fixed)]">Inscripción</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full hover:bg-[var(--surface-container-low)] flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </header>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-1">Nombre Completo</label>
                <input type="text" value={formData.nombre_completo} onChange={e => setFormData({...formData, nombre_completo: e.target.value})}
                  className="h-12 paper-nested rounded-xl px-4 font-black text-[var(--on-secondary-fixed)] uppercase" required />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-1">DNI del Socio</label>
                <input type="text" value={formData.nro_documento} onChange={e => setFormData({...formData, nro_documento: e.target.value})}
                  className="h-12 paper-nested rounded-xl px-4 font-black" required />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-1">Seleccionar Plan</label>
                <select value={formData.plan_id} onChange={e => setFormData({...formData, plan_id: e.target.value})}
                  className="h-12 paper-nested rounded-xl px-4 font-bold outline-none cursor-pointer">
                  {planes.map(p => <option key={p.id} value={p.id}>{p.nombre} — S/ {parseFloat(p.precio).toFixed(2)}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-1">Fecha de Inicio</label>
                <input type="date" value={formData.fecha_inicio} onChange={e => setFormData({...formData, fecha_inicio: e.target.value})}
                  className="h-12 paper-nested rounded-xl px-4 font-bold" required />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="h-14 paper-nested rounded-2xl font-black text-[10px] tracking-widest uppercase hover:bg-[var(--surface-container-high)] transition-all">Cancelar</button>
                <button type="submit" className="h-14 btn-azure uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">Finalizar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gimnasio;
