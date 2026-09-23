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
      if (resp && resp.success) setHistory(resp.data);
    } catch (err) {
      console.error('Error al cargar historial de conciliación:', err);
    } finally {
      setLoading(false);
    }
  };

const handleClosing = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    // 1. Obtener usuario de sessionStorage o localStorage de forma segura
    const storedUser = sessionStorage.getItem('usuario') || localStorage.getItem('usuario') || '{}';
    const userSession = JSON.parse(storedUser);
    const cajeroId = userSession.id || userSession.user_id || userSession.userId || 1;

    try {
      // 2. Enviar monto, notas y el ID resuelto
      const resp = await conciliacionService.processClosing({
        monto_real: montoReal,
        observaciones: obs,
        usuario_id: cajeroId
      });

      if (resp && resp.success) {
        setIsModalOpen(false);
        setMontoReal('');
        setObs('');
        fetchHistory();
        alert(`Turno cerrado exitosamente. Diferencia: S/ ${parseFloat(resp.data?.diferencia || 0).toFixed(2)}`);
      } else {
        alert(resp?.message || 'Error al procesar el cierre');
      }
    } catch (err) {
      console.error('Error al cerrar caja:', err);
      alert('Error de conexión al procesar el cierre de caja');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f4f7f9] text-slate-800 text-xs font-sans">
      <Sidebar />

      <main className="flex-1 md:ml-60 p-4 flex flex-col gap-3">
        {/* Cabecera Corporativa ERP */}
        <header className="bg-[#24a0ed] text-white px-4 py-2.5 rounded flex justify-between items-center shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-black tracking-wider text-sm uppercase">TURUCSAC &gt;&gt;</span>
            <span className="text-[11px] font-bold text-sky-100 uppercase">CONTROL DE TURNO - CONCILIACIÓN DE CAJA</span>
          </div>
          <button 
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="bg-sky-800/40 hover:bg-sky-800/60 px-3 py-1 rounded text-white font-bold text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">account_balance_wallet</span>
            <span>CIERRE DE TURNO</span>
          </button>
        </header>

        {/* Resumen rápido de auditoría */}
        <div className="bg-white p-3 rounded border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#24a0ed] text-base">fact_check</span>
            <span className="font-bold text-slate-700 text-xs uppercase">Historial de Rendición de Cuentas y Turnos</span>
          </div>
          <span className="text-[11px] text-slate-500 font-semibold">
            {history.length} {history.length === 1 ? 'cierre registrado' : 'cierres registrados'}
          </span>
        </div>

        {/* Grilla Contable de Auditoría */}
        <div className="bg-white rounded border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[750px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase text-[10px] font-black tracking-wider">
                  <th className="py-2.5 px-3">Fecha y Hora</th>
                  <th className="py-2.5 px-3">Responsable</th>
                  <th className="py-2.5 px-3 text-right">Balance Sistema</th>
                  <th className="py-2.5 px-3 text-right">Arqueo en Mano</th>
                  <th className="py-2.5 px-3 text-center">Auditoría (DIF)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="material-symbols-outlined animate-spin text-3xl text-[#24a0ed]">sync</span>
                        <span className="font-bold text-[11px] uppercase">Cargando auditoría...</span>
                      </div>
                    </td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-10 text-center text-slate-400 italic">
                      No hay registros de cierres de caja en el sistema.
                    </td>
                  </tr>
                ) : (
                  history.map((h) => {
                    const diff = parseFloat(h.diferencia || 0);
                    const isCalzado = Math.abs(diff) < 0.01;
                    return (
                      <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3">
                          <div className="flex flex-col leading-tight">
                            <span className="font-bold text-slate-800 uppercase">
                              {new Date(h.fecha_cierre).toLocaleDateString()}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(h.fecha_cierre).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-700 uppercase">
                          {h.usuario_nombre || 'PERSONAL EN TURNO'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                          S/ {parseFloat(h.monto_sistema || 0).toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-[#24a0ed]">
                          S/ {parseFloat(h.monto_real || 0).toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-black ${
                              isCalzado
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {isCalzado ? 'CALZADO (S/ 0.00)' : `S/ ${diff.toFixed(2)}`}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Rendición de Cierre de Caja */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
              {/* Barra superior modal */}
              <div className="bg-[#24a0ed] text-white px-4 py-2.5 flex justify-between items-center">
                <span className="font-bold tracking-wider text-xs uppercase">
                  Rendición de Operaciones / Cierre de Turno
                </span>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)} 
                  className="text-white hover:text-sky-200 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>

              <form onSubmit={handleClosing} className="p-4 space-y-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">
                    Total Contado (Efectivo / Vouchers Físicos)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 font-bold text-slate-400">S/</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={montoReal} 
                      onChange={(e) => setMontoReal(e.target.value)}
                      className="w-full h-10 border border-slate-300 rounded pl-8 pr-3 text-base font-mono font-black text-slate-900 outline-none focus:border-[#24a0ed]" 
                      placeholder="0.00" 
                      required 
                      autoFocus
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Ingrese la suma total contada en efectivo y vouchers de tarjetas/POS al corte.
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">
                    Observaciones / Incidencias del Turno
                  </label>
                  <textarea 
                    value={obs} 
                    onChange={(e) => setObs(e.target.value)}
                    rows="3"
                    className="w-full border border-slate-300 rounded p-2 text-xs text-slate-800 outline-none resize-none focus:border-[#24a0ed]" 
                    placeholder="Detalle cualquier novedad o motivo de descuadre..." 
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    className="h-8 border border-slate-300 rounded font-bold text-[11px] text-slate-600 hover:bg-slate-100 uppercase transition-colors cursor-pointer"
                  >
                    Anular
                  </button>
                  <button 
                    type="submit" 
                    disabled={isProcessing} 
                    className="h-8 bg-[#24a0ed] hover:bg-sky-600 text-white font-bold text-[11px] uppercase rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing && <span className="material-symbols-outlined animate-spin text-sm">sync</span>}
                    Confirmar Cierre
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