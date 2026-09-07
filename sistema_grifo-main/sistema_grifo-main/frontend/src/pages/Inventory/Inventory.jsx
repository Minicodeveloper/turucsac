import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { inventoryService } from '../../services/api';

const Inventory = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedKardex, setSelectedKardex] = useState(null);
  const [kardexHistory, setKardexHistory] = useState([]);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const resp = await inventoryService.getInventory();
      if (resp.success) setData(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenKardex = async (item) => {
    setSelectedKardex(item);
    try {
      const resp = await inventoryService.getKardex(item.id);
      if (resp.success) setKardexHistory(resp.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Producto", "Stock Actual", "Precio"];
    const rows = data.map(i => [i.id, i.nombre_producto, i.stock_galones, i.precio_por_galon]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Inventario_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="min-h-screen flex bg-[var(--surface)]">
      <Sidebar />
      <main className="flex-1 md:ml-64 pt-24 pb-12 px-10 max-w-7xl mx-auto space-y-12">
        <header className="flex items-end justify-between border-b-[3px] border-[var(--primary-container)] pb-6">
          <div>
            <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--primary-container)] mb-1">Métricas de Almacén</h1>
            <h2 className="text-5xl font-black tracking-tighter text-[var(--on-secondary-fixed)]">Control de Stock</h2>
          </div>
          <button 
            onClick={handleExportCSV}
            className="paper-nested px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--primary-container)] hover:bg-[var(--primary-container)] hover:text-white transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            Exportar CSV
          </button>
        </header>

        {/* Inventory Ledger: No-Line Structure */}
        <div className="paper-lowest rounded-[2.5rem] shadow-[0_4px_32px_rgba(11,29,45,0.02)] overflow-hidden">
          <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-[var(--surface-container-low)] text-[var(--on-surface-variant)] uppercase">
                    <th className="py-6 px-10 text-[10px] font-black tracking-widest">Variedad Combustible</th>
                    <th className="py-6 px-10 text-[10px] font-black tracking-widest">Volumen Actual (GL)</th>
                    <th className="py-6 px-10 text-[10px] font-black tracking-widest">Precio Mercado</th>
                    <th className="py-6 px-10 text-[10px] font-black tracking-widest text-center">Estado Crítico</th>
                    <th className="py-6 px-10 text-[10px] font-black tracking-widest text-center">Auditoría</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--surface-container)] text-[var(--on-surface-variant)]">
                  {loading ? (
                    <tr><td colSpan="5" className="py-20 text-center"><span className="material-symbols-outlined animate-spin text-4xl">sync</span></td></tr>
                  ) : data.map((item) => (
                    <tr key={item.id} className="hover:bg-[var(--surface-container-low)] transition-colors group">
                      <td className="py-6 px-10 font-black text-[var(--on-secondary-fixed)] uppercase tracking-tight">{item.nombre_producto}</td>
                      <td className="py-6 px-10 text-2xl font-black text-[var(--primary-container)] tracking-tighter">{Math.floor(item.stock_galones)} <span className="text-[10px]">GLN</span></td>
                      <td className="py-6 px-10 font-bold text-[var(--on-secondary-fixed)] tracking-tight">S/ {parseFloat(item.precio_por_galon).toFixed(2)}</td>
                      <td className="py-6 px-10 text-center">
                         <span className={`micro-tag ${item.stock_galones < 500 ? 'bg-[var(--error)]/10 text-[var(--error)]' : 'bg-emerald-500/10 text-emerald-600'}`}>
                           {item.stock_galones < 500 ? 'BAJO' : 'OPERATIVO'}
                         </span>
                      </td>
                      <td className="py-6 px-10 text-center">
                         <button onClick={() => handleOpenKardex(item)} className="p-3 rounded-xl hover:bg-[var(--primary-container)]/10 text-[var(--primary-container)] transition-all active:scale-95">
                           <span className="material-symbols-outlined text-[18px]">history_edu</span>
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        </div>

        {/* KARDEX SLIDE-OVER / MODAL: Glassmorphism Clinical Precision */}
        {selectedKardex && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[var(--on-secondary-fixed)]/20 backdrop-blur-[24px]">
             <div className="paper-lowest w-full max-w-4xl max-h-[85vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-fade-in">
                <header className="p-10 border-b border-[var(--surface-container)] flex items-end justify-between bg-white/50 backdrop-blur-md">
                   <div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--primary-container)] mb-1">Registro Histórico</h4>
                      <h3 className="text-3xl font-black tracking-tighter text-[var(--on-secondary-fixed)] uppercase">Kardex: {selectedKardex.nombre}</h3>
                   </div>
                   <button onClick={() => setSelectedKardex(null)} className="w-12 h-12 rounded-full hover:bg-[var(--surface-container-low)] flex items-center justify-center transition-colors">
                      <span className="material-symbols-outlined text-[var(--primary-container)]">close</span>
                   </button>
                </header>

                <div className="flex-1 overflow-y-auto p-10 space-y-6">
                   {kardexHistory.length === 0 ? (
                     <div className="py-20 text-center text-[var(--on-surface-variant)] uppercase font-black text-xs">Sin registros históricos de auditoría.</div>
                   ) : (
                     <div className="space-y-4">
                        {kardexHistory.map((mov, i) => (
                           <div key={i} className="flex items-center justify-between p-6 rounded-2xl bg-[var(--surface-container-low)] hover:bg-[var(--surface-container)] transition-colors group">
                               <div className="flex flex-col gap-1">
                                 <span className="text-[10px] font-black text-[var(--outline-variant)] uppercase tracking-widest">{new Date(mov.fecha_movimiento).toLocaleString()}</span>
                                 <span className="text-sm font-bold text-[var(--on-secondary-fixed)] uppercase">{mov.tipo_movimiento === 'INGRESO' || mov.tipo_movimiento === 'ENTRADA' ? 'Entrada Proveedor / Ajuste' : 'Salida p/ Venta'}</span>
                              </div>
                              <div className="text-right flex flex-col items-end">
                                 <span className={`text-xl font-black tracking-tighter ${mov.tipo_movimiento === 'INGRESO' || mov.tipo_movimiento === 'ENTRADA' ? 'text-emerald-500' : 'text-[var(--error)]'}`}>
                                    {mov.tipo_movimiento === 'INGRESO' || mov.tipo_movimiento === 'ENTRADA' ? '+' : '-'}{parseFloat(mov.cantidad).toFixed(3)} GLN
                                 </span>
                                 <span className="text-[10px] font-black text-[var(--outline-variant)] uppercase">Stock: {parseFloat(mov.stock_actual).toFixed(3)}</span>
                              </div>
                           </div>
                        ))}
                     </div>
                   )}
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Inventory;
