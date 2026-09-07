import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { conciliacionService } from '../../services/api';

const Conciliacion = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [montoReal, setMontoReal] = useState('');
  const [obs, setObs] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const resp = await conciliacionService.getHistory();
      if (resp.success) setHistory(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClosing = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const resp = await conciliacionService.processClosing({
        monto_real: montoReal,
        observaciones: obs
      });
      if (resp.success) {
        setIsModalOpen(false);
        setMontoReal('');
        setObs('');
        fetchHistory();
        alert(`Cierre procesado. Diferencia detectada: S/ ${resp.data.diferencia}`);
      }
    } catch (err) {
      alert('Error en cierre');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--surface)]">
      <Sidebar />
      <main className="flex-1 md:ml-64 pt-24 pb-12 px-10 max-w-7xl mx-auto space-y-12">
        
        <header className="flex items-end justify-between border-b-[3px] border-[var(--primary-container)] pb-6">
          <div>
            <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--primary-container)] mb-1">Control de Turno</h1>
            <h2 className="text-5xl font-black tracking-tighter text-[var(--on-secondary-fixed)] uppercase">Conciliación de Caja</h2>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-azure px-8 py-4 flex items-center gap-3 text-xs tracking-widest uppercase shadow-lg shadow-primary-container/20"
          >
            <span className="material-symbols-outlined text-white">account_balance_wallet</span>
            Cierre de Turno
          </button>
        </header>

        {/* Audit Log Ledger */}
        <div className="paper-lowest rounded-[2.5rem] shadow-[0_4px_32px_rgba(11,29,45,0.02)] overflow-hidden">
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                 <thead>
                    <tr className="bg-[var(--surface-container-low)] text-[var(--on-surface-variant)] uppercase">
                       <th className="py-6 px-10 text-[10px] font-black tracking-widest">Temporalidad</th>
                       <th className="py-6 px-10 text-[10px] font-black tracking-widest">Responsable</th>
                       <th className="py-6 px-10 text-[10px] font-black tracking-widest text-right">Balance Sistema</th>
                       <th className="py-6 px-10 text-[10px] font-black tracking-widest text-right">Arqueo en Mano</th>
                       <th className="py-6 px-10 text-[10px] font-black tracking-widest text-center">Auditoría (DIF)</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-[var(--surface-container)] text-[var(--on-surface-variant)]">
                    {loading ? (
                      <tr><td colSpan="5" className="py-20 text-center"><span className="material-symbols-outlined animate-spin text-4xl">sync</span></td></tr>
                    ) : history.map((h) => (
                      <tr key={h.id} className="hover:bg-[var(--surface-container-low)] transition-colors group">
                        <td className="py-6 px-10">
                           <div className="flex flex-col">
                              <span className="text-sm font-black text-[var(--on-secondary-fixed)] uppercase tracking-tighter">{new Date(h.fecha_cierre).toLocaleDateString()}</span>
                              <span className="text-[10px] font-bold text-[var(--outline-variant)]">{new Date(h.fecha_cierre).toLocaleTimeString()}</span>
                           </div>
                        </td>
                        <td className="py-6 px-10 font-bold text-[var(--on-secondary-fixed)] uppercase">{h.usuario_nombre}</td>
                        <td className="py-6 px-10 text-right leading-none">
                            <span className="text-xl font-black text-[var(--on-secondary-fixed)] tracking-tighter">S/ {parseFloat(h.monto_sistema).toFixed(2)}</span>
                            <span className="text-[9px] font-black block mt-1 text-[var(--outline-variant)] uppercase tracking-widest">Liquidación Teórica</span>
                        </td>
                        <td className="py-6 px-10 text-right leading-none">
                            <span className="text-xl font-black text-[var(--primary-container)] tracking-tighter">S/ {parseFloat(h.monto_real).toFixed(2)}</span>
                            <span className="text-[9px] font-black block mt-1 text-[var(--outline-variant)] uppercase tracking-widest">Arqueo Físico</span>
                        </td>
                        <td className="py-6 px-10 text-center">
                            <span className={`micro-tag px-4 py-2 ${Math.abs(h.diferencia) < 0.01 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[var(--error)]/10 text-[var(--error)]'}`}>
                               {parseFloat(h.diferencia) === 0 ? 'CALZADO' : `S/ ${parseFloat(h.diferencia).toFixed(2)}`}
                            </span>
                        </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

        {/* Modal: Arqueo de Caja Clinical High-End */}
        {isModalOpen && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[var(--on-secondary-fixed)]/20 backdrop-blur-[24px]">
              <div className="paper-lowest p-10 rounded-[3rem] shadow-2xl w-full max-w-sm relative">
                 <header className="mb-8 flex items-end justify-between border-b border-[var(--surface-container)] pb-6">
                    <div>
                       <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--primary-container)] mb-1">Rendición de Operaciones</h4>
                       <h3 className="text-3xl font-black tracking-tighter text-[var(--on-secondary-fixed)]">Cierre de Caja</h3>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full hover:bg-[var(--surface-container-low)] flex items-center justify-center transition-colors">
                       <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                 </header>

                 <form onSubmit={handleClosing} className="space-y-6">
                    <div className="flex flex-col gap-1">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-1">Total Contado (Efectivo/Voucher)</label>
                       <input 
                         type="number" step="0.01" 
                         value={montoReal} onChange={(e) => setMontoReal(e.target.value)}
                         className="h-16 paper-nested rounded-2xl px-6 font-black text-3xl text-[var(--primary-container)] outline-none" 
                         placeholder="S/ 0.00" required 
                       />
                    </div>
                    <div className="flex flex-col gap-1">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-1">Observaciones / Incidencias</label>
                       <textarea 
                         value={obs} onChange={(e) => setObs(e.target.value)}
                         className="h-24 paper-nested rounded-2xl p-4 font-medium text-xs resize-none" 
                         placeholder="Detalle cualquier novedad en el turno..." 
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4">
                       <button type="button" onClick={() => setIsModalOpen(false)} className="h-14 paper-nested rounded-2xl font-black text-[10px] tracking-widest uppercase hover:bg-[var(--surface-container-high)] transition-all">Anular</button>
                       <button type="submit" disabled={isProcessing} className="h-14 btn-azure uppercase text-[11px] flex items-center justify-center gap-3">
                          {isProcessing ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : 'Confirmar Cierre'}
                       </button>
                    </div>
                 </form>
              </div>
           </div>
        )}
      </main>
    </div>
  );
};

export default Conciliacion;
