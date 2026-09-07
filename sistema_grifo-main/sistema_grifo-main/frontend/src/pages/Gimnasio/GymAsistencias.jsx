import React, { useState, useEffect } from 'react';
import SidebarGym from '../../components/SidebarGym';
import { gymService } from '../../services/api';

const hoy = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });

const GymAsistencias = () => {
  const [asistencias, setAsistencias] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [docInput, setDocInput] = useState('');
  const [tipo, setTipo] = useState('ENTRADA');
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    fetchAsistencias();
  }, []);

  const fetchAsistencias = async () => {
    setLoading(true);
    try {
      const res = await gymService.getAsistencias();
      if (res.success) setAsistencias(res.data);
    } catch (error) {
      console.error("Error al cargar asistencias:", error);
    } finally {
      setLoading(false);
    }
  };

  const registrar = async () => {
    if (!docInput) return;
    try {
      const res = await gymService.recordAsistencia({ nro_documento: docInput, tipo });
      if (res.success) {
        setMensaje({ text: res.message, isError: false, isWarning: res.vencido });
        setDocInput('');
        fetchAsistencias();
        // Limpiar mensaje después de 5 segundos
        setTimeout(() => setMensaje(null), 5000);
      } else {
        setMensaje({ text: res.message, isError: true });
      }
    } catch (error) {
      setMensaje({ text: error.response?.data?.message || "Error de conexión", isError: true });
    }
  };

  const filtradas = asistencias.filter(a =>
    a.socio.toLowerCase().includes(buscar.toLowerCase()) || a.documento.includes(buscar)
  );

  const entradas = asistencias.filter(a => a.tipo === 'ENTRADA').length;
  const salidas = asistencias.filter(a => a.tipo === 'SALIDA').length;
  const dentro = entradas - salidas;

  return (
    <div className="min-h-screen flex bg-[var(--surface)]">
      <SidebarGym />
      <main className="flex-1 md:ml-64 pt-24 pb-12 px-10 max-w-7xl mx-auto space-y-12">

        <header className="flex items-end justify-between border-b-[3px] border-primary pb-6">
          <div>
            <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">Registro de Aforo — {hoy}</h1>
            <h2 className="text-5xl font-black tracking-tighter text-[var(--on-secondary-fixed)]">Asistencias</h2>
          </div>
        </header>

        {/* Status Message Area */}
        {mensaje && (
          <div className={`p-5 rounded-2xl flex items-center gap-4 animate-fade-in border shadow-sm ${
            mensaje.isError ? 'bg-error/10 border-error/20 text-error' :
            mensaje.isWarning ? 'bg-amber-500/10 border-amber-500/20 text-amber-700' :
            'bg-emerald-500/10 border-emerald-500/20 text-emerald-700'
          }`}>
            <span className="material-symbols-outlined text-2xl">
              {mensaje.isError ? 'error' : mensaje.isWarning ? 'warning' : 'check_circle'}
            </span>
            <p className="font-black text-sm uppercase tracking-tight">{mensaje.text}</p>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-5">
          {[
            { label: 'Entradas Hoy', value: entradas, icon: 'login', color: '#10B981' },
            { label: 'Salidas Hoy', value: salidas, icon: 'logout', color: '#EF4444' },
            { label: 'Dentro Ahora', value: Math.max(0, dentro), icon: 'fitness_center', color: '#00AEEF' },
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

        {/* Quick register */}
        <div className="paper-lowest rounded-[2.5rem] p-8 shadow-[0_4px_32px_rgba(11,29,45,0.02)] border border-primary/5">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--outline-variant)] mb-6">Registrar Asistencia Rápida</h3>
          <div className="flex gap-4 flex-wrap">
            <input
              type="text" placeholder="N° de documento del socio..."
              value={docInput} onChange={e => setDocInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && registrar()}
              className="flex-1 h-14 paper-nested rounded-2xl px-5 font-black text-[var(--on-secondary-fixed)] outline-none min-w-[200px] focus:ring-2 ring-primary/20 transition-all uppercase"
            />
            <select value={tipo} onChange={e => setTipo(e.target.value)} className="h-14 paper-nested rounded-2xl px-5 font-bold outline-none cursor-pointer">
              <option value="ENTRADA">Entrada</option>
              <option value="SALIDA">Salida</option>
            </select>
            <button onClick={registrar} className="btn-azure h-14 px-8 uppercase text-sm tracking-widest shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span> Registrar
            </button>
          </div>
        </div>

        {/* Table */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--outline-variant)]">Historial del día</h3>
            <div className="relative">
              <input type="text" placeholder="Buscar..." value={buscar} onChange={e => setBuscar(e.target.value)}
                className="h-10 paper-lowest rounded-xl px-10 text-sm font-bold outline-none border border-primary/5 focus:ring-2 ring-primary/10" />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--outline-variant)] text-base">search</span>
            </div>
          </div>
          <div className="paper-lowest rounded-[2.5rem] overflow-hidden shadow-sm border border-primary/5">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--surface-container-low)]">
                  {['Socio', 'Documento', 'Hora', 'Tipo'].map(h => (
                    <th key={h} className="py-5 px-8 text-[10px] font-black tracking-widest uppercase text-[var(--on-surface-variant)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--surface-container)]">
                {loading ? (
                   <tr><td colSpan="4" className="py-16 text-center text-[var(--outline-variant)] font-black text-xs uppercase">Cargando asistencias...</td></tr>
                ) : filtradas.length === 0 ? (
                   <tr><td colSpan="4" className="py-16 text-center text-[var(--outline-variant)] font-black text-xs uppercase">Sin movimientos registrados hoy.</td></tr>
                ) : filtradas.map(a => (
                  <tr key={a.id} className="hover:bg-[var(--surface-container-low)] transition-colors">
                    <td className="py-5 px-8 font-black text-[var(--on-secondary-fixed)] uppercase tracking-tight">{a.socio}</td>
                    <td className="py-5 px-8 font-bold text-[var(--on-surface-variant)]">{a.documento}</td>
                    <td className="py-5 px-8 font-bold text-[var(--on-surface-variant)]">{a.hora}</td>
                    <td className="py-5 px-8">
                      <span className={`micro-tag ${a.tipo === 'ENTRADA' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-[var(--error)]/10 text-[var(--error)]'}`}>
                        {a.tipo}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GymAsistencias;
