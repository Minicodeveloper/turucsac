import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { purchaseService, inventoryService } from '../../services/api';

const Compras = () => {
  const [purchases, setPurchases] = useState([]);
  const [fuels, setFuels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    combustible_id: '',
    cantidad_galones: '',
    precio_compra: '',
    proveedor: 'PETROPERU',
    nro_factura: '',
    placa_cisterna: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pResp, iResp] = await Promise.all([
        purchaseService.getAll(),
        inventoryService.getInventory()
      ]);
      if (pResp.success) setPurchases(pResp.data);
      if (iResp.success) setFuels(iResp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const resp = await purchaseService.create(formData);
      if (resp.success) {
        setIsModalOpen(false);
        setFormData({ combustible_id: '', cantidad_galones: '', precio_compra: '', proveedor: 'PETROPERU', nro_factura: '', placa_cisterna: '' });
        fetchData();
        alert('Ingreso de combustible registrado con éxito.');
      } else {
        alert(resp.message);
      }
    } catch (err) {
      alert('Error de conexión');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--surface)]">
      <Sidebar />
      <main className="flex-1 md:ml-64 pt-24 pb-12 px-10 max-w-7xl mx-auto space-y-12">
        
        {/* Header Clinical Style */}
        <header className="flex items-end justify-between border-b-[3px] border-[var(--primary-container)] pb-6">
          <div>
            <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--primary-container)] mb-1">Módulo Logístico</h1>
            <h2 className="text-5xl font-black tracking-tighter text-[var(--on-secondary-fixed)] uppercase">Abastecimiento</h2>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-azure px-8 py-4 flex items-center gap-3 text-xs tracking-widest uppercase"
          >
            <span className="material-symbols-outlined text-white">local_shipping</span>
            Nuevo Ingreso
          </button>
        </header>

        {/* Global Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="paper-lowest p-6 rounded-2xl flex items-center gap-6 border border-[var(--surface-container)]">
              <div className="w-12 h-12 rounded-xl bg-[var(--primary-container)]/10 flex items-center justify-center">
                 <span className="material-symbols-outlined text-[var(--primary-container)]">receipt_long</span>
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase text-[var(--outline-variant)]">Total Operaciones</p>
                 <p className="text-2xl font-black text-[var(--on-secondary-fixed)]">{purchases.length}</p>
              </div>
           </div>
           <div className="paper-lowest p-6 rounded-2xl flex items-center gap-6 border border-[var(--surface-container)]">
              <div className="w-12 h-12 rounded-xl bg-[var(--error)]/10 flex items-center justify-center">
                 <span className="material-symbols-outlined text-[var(--error)]">inventory</span>
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase text-[var(--outline-variant)]">Último Proveedor</p>
                 <p className="text-sm font-black text-[var(--on-secondary-fixed)] truncate uppercase">{purchases[0]?.proveedor || 'Sin datos'}</p>
              </div>
           </div>
           <div className="paper-lowest p-6 rounded-2xl flex items-center gap-6 border border-[var(--surface-container)]">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                 <span className="material-symbols-outlined text-emerald-500">calendar_today</span>
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase text-[var(--outline-variant)]">Última Carga</p>
                 <p className="text-sm font-black text-[var(--on-secondary-fixed)] uppercase">{purchases[0] ? new Date(purchases[0].fecha_compra).toLocaleDateString() : '-- --'}</p>
              </div>
           </div>
        </div>

        {/* Purchase History Ledger */}
        <div className="paper-lowest rounded-[2.5rem] shadow-[0_4px_32px_rgba(11,29,45,0.02)] overflow-hidden">
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                 <thead>
                    <tr className="bg-[var(--surface-container-low)] text-[var(--on-surface-variant)] uppercase">
                       <th className="py-6 px-10 text-[10px] font-black tracking-widest">Identificación</th>
                       <th className="py-6 px-10 text-[10px] font-black tracking-widest">Combustible</th>
                       <th className="py-6 px-10 text-[10px] font-black tracking-widest text-right">Volumen (GL)</th>
                       <th className="py-6 px-10 text-[10px] font-black tracking-widest text-right">Costo Unit / Total</th>
                       <th className="py-6 px-10 text-[10px] font-black tracking-widest text-center">Proveedor / Placa</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-[var(--surface-container)] text-[var(--on-surface-variant)]">
                    {loading ? (
                      <tr><td colSpan="5" className="py-20 text-center"><span className="material-symbols-outlined animate-spin text-4xl">sync</span></td></tr>
                    ) : purchases.map((p) => (
                      <tr key={p.id} className="hover:bg-[var(--surface-container-low)] transition-colors group">
                        <td className="py-6 px-10">
                           <div className="flex flex-col">
                              <span className="text-sm font-black text-[var(--on-secondary-fixed)] uppercase tracking-tighter">{p.nro_factura || 'Factura Pendiente'}</span>
                              <span className="text-[10px] font-bold text-[var(--outline-variant)]">{new Date(p.fecha_compra).toLocaleString()}</span>
                           </div>
                        </td>
                        <td className="py-6 px-10 font-bold text-[var(--on-secondary-fixed)] uppercase">{p.nombre_producto}</td>
                        <td className="py-6 px-10 text-right font-black text-[var(--primary-container)] text-xl tracking-tighter">{p.cantidad_galones} GLN</td>
                        <td className="py-6 px-10 text-right leading-none">
                            <span className="text-[10px] font-bold block mb-1 text-[var(--outline-variant)] uppercase tracking-widest">S/ {p.precio_compra} p/gal</span>
                            <span className="text-lg font-black text-[var(--on-secondary-fixed)] tracking-tighter">S/ {parseFloat(p.monto_total).toFixed(2)}</span>
                        </td>
                        <td className="py-6 px-10 text-center uppercase">
                            <div className="flex flex-col items-center">
                               <span className="text-[11px] font-black text-[var(--on-secondary-fixed)]">{p.proveedor}</span>
                               <span className="micro-tag bg-[var(--surface-container-highest)]/30 text-[var(--on-surface-variant)] mt-1">{p.placa_cisterna || 'SIN PLACA'}</span>
                            </div>
                        </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

        {/* Modal: Abastecimiento Entry */}
        {isModalOpen && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[var(--on-secondary-fixed)]/20 backdrop-blur-[24px] animate-fade-in">
              <div className="paper-lowest p-10 rounded-[3rem] shadow-2xl w-full max-w-xl relative border border-white/10">
                 <header className="mb-10 flex items-end justify-between border-b border-[var(--surface-container)] pb-6">
                    <div>
                       <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--primary-container)] mb-1">Entrada de Almacén</h4>
                       <h3 className="text-4xl font-black tracking-tighter text-[var(--on-secondary-fixed)]">Registro de Cisterna</h3>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-full hover:bg-[var(--surface-container-low)] flex items-center justify-center transition-colors">
                       <span className="material-symbols-outlined text-2xl">close</span>
                    </button>
                 </header>

                 <form onSubmit={handleCreate} className="grid grid-cols-2 gap-6">
                    <div className="col-span-2 flex flex-col gap-1">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-2">Variedad Combustible</label>
                       <select 
                         value={formData.combustible_id} 
                         onChange={(e) => setFormData({...formData, combustible_id: e.target.value})}
                         className="h-14 paper-nested rounded-2xl px-6 font-black text-[var(--on-secondary-fixed)] outline-none appearance-none cursor-pointer border-r-[16px] border-transparent"
                         required
                       >
                         <option value="">Seleccionar Producto...</option>
                         {fuels.map(f => (
                           <option key={f.id} value={f.id}>{f.nombre_producto} (Stock: {Math.floor(f.stock_galones)} GLN)</option>
                         ))}
                       </select>
                    </div>

                    <div className="flex flex-col gap-1">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-2">Volumen de Carga (GLN)</label>
                       <input type="number" step="0.001" value={formData.cantidad_galones} onChange={(e) => setFormData({...formData, cantidad_galones: e.target.value})} className="h-14 paper-nested rounded-2xl px-6 font-black text-2xl text-[var(--primary-container)]" placeholder="0.000" required />
                    </div>

                    <div className="flex flex-col gap-1">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-2">Costo Unit. (S/)</label>
                       <input type="number" step="0.01" value={formData.precio_compra} onChange={(e) => setFormData({...formData, precio_compra: e.target.value})} className="h-14 paper-nested rounded-2xl px-6 font-black text-xl" placeholder="0.00" required />
                    </div>

                    <div className="flex flex-col gap-1">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-2">Guía / Factura</label>
                       <input type="text" value={formData.nro_factura} onChange={(e) => setFormData({...formData, nro_factura: e.target.value})} className="h-14 paper-nested rounded-2xl px-6 font-bold uppercase" placeholder="E001-XXXXX" />
                    </div>

                    <div className="flex flex-col gap-1">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-2">Placa Cisterna</label>
                       <input type="text" value={formData.placa_cisterna} onChange={(e) => setFormData({...formData, placa_cisterna: e.target.value})} className="h-14 paper-nested rounded-2xl px-6 font-bold uppercase" placeholder="ABC-123" />
                    </div>

                    <div className="col-span-2 grid grid-cols-2 gap-4 mt-10">
                       <button type="button" onClick={() => setIsModalOpen(false)} className="h-16 paper-nested rounded-2xl font-black text-[10px] tracking-[0.2em] uppercase hover:bg-[var(--surface-container-high)] transition-all">Cancelar</button>
                       <button type="submit" disabled={isProcessing} className="h-16 btn-azure uppercase text-xs flex items-center justify-center gap-4">
                          {isProcessing ? <span className="material-symbols-outlined animate-spin">sync</span> : 'Consolidar Ingreso'}
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

export default Compras;
