import React, { useState, useEffect, useMemo } from 'react';
import SidebarGym from '../../components/SidebarGym';
import { gymService } from '../../services/api';
import { jsPDF } from 'jspdf';

const metodoColor = { 'Efectivo': '#10B981', 'Tarjeta': '#3B82F6', 'Yape': '#A855F7', 'Transferencia': '#F59E0B' };

const GymIngresos = () => {
  const [pagos, setPagos] = useState([]);
  const [socios, setSocios] = useState([]);
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ socio_id: '', plan_id: '', monto: '', metodo_pago: 'Efectivo' });
  const [busquedaSocio, setBusquedaSocio] = useState('');

  useEffect(() => {
    fetchData();
  }, [mes]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resPagos = await gymService.getIngresos(mes);
      if (resPagos.success) setPagos(resPagos.data);
      
      const resSocios = await gymService.getSocios();
      if (resSocios.success) setSocios(resSocios.data);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSocioSelect = (s) => {
    setForm({ 
      ...form, 
      socio_id: s.id, 
      plan_id: s.plan_id, 
      monto: s.plan_precio || '' 
    });
    setBusquedaSocio(s.nombre_completo);
  };

  const registrarPago = async (e) => {
    e.preventDefault();
    try {
      const res = await gymService.recordPago(form);
      if (res.success) {
        alert("Pago registrado con éxito");
        const socio = socios.find(s => String(s.id) === String(form.socio_id));
        if (socio) {
          generarRecibo(socio, form);
        } else {
          console.error("No se pudo encontrar la información del socio para el recibo.", form.socio_id);
          // Intentar generar con datos básicos si el socio no se encuentra en la lista local
          generarRecibo({ nombre_completo: busquedaSocio, nro_documento: 'S/D' }, form);
        }
        setIsModalOpen(false);
        setForm({ socio_id: '', plan_id: '', monto: '', metodo_pago: 'Efectivo' });
        setBusquedaSocio('');
        fetchData();
      }
    } catch (error) {
      alert("Error al registrar pago");
    }
  };

  const generarRecibo = (socio, datos) => {
    const doc = new jsPDF({ unit: 'mm', format: [80, 150] }); // Formato ticket
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("GYM AZURE - RECIBO", 40, 10, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Fecha: ${new Date().toLocaleString()}`, 10, 20);
    doc.text("--------------------------------------------------", 10, 25);
    
    doc.setFont("helvetica", "bold");
    const nombreSocio = socio?.nombre_completo ? socio.nombre_completo.toUpperCase() : "CLIENTE GENERAL";
    doc.text(`SOCIO: ${nombreSocio}`, 10, 35);
    doc.text(`DNI: ${socio?.nro_documento || '--------'}`, 10, 40);
    
    doc.text("--------------------------------------------------", 10, 45);
    doc.text(`PLAN: ${socio.plan_nombre || 'Membresía'}`, 10, 55);
    doc.text(`MÉTODO: ${datos.metodo_pago}`, 10, 60);
    
    doc.setFontSize(12);
    doc.text(`TOTAL: S/ ${parseFloat(datos.monto).toFixed(2)}`, 10, 75);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("¡Gracias por tu preferencia!", 40, 90, { align: 'center' });
    
    const fileName = socio?.nro_documento ? `Recibo_${socio.nro_documento}.pdf` : `Recibo_${Date.now()}.pdf`;
    doc.save(fileName);
  };

  const filtrados = pagos; // Ya vienen filtrados del API por mes
  const totalMes = useMemo(() => filtrados.reduce((a, p) => a + parseFloat(p.monto), 0), [filtrados]);
  const transacciones = filtrados.length;
  
  const porMetodo = useMemo(() => filtrados.reduce((acc, p) => {
    acc[p.metodo_pago] = (acc[p.metodo_pago] || 0) + parseFloat(p.monto);
    return acc;
  }, {}), [filtrados]);

  const sociosFiltrados = busquedaSocio.length > 1 
    ? socios.filter(s => s.nombre_completo.toLowerCase().includes(busquedaSocio.toLowerCase()) || s.nro_documento.includes(busquedaSocio)).slice(0, 5)
    : [];

  return (
    <div className="min-h-screen flex bg-[var(--surface)]">
      <SidebarGym />
      <main className="flex-1 md:ml-64 pt-24 pb-12 px-10 max-w-7xl mx-auto space-y-12">

        <header className="flex items-end justify-between border-b-[3px] border-primary pb-6">
          <div>
            <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">Control Financiero</h1>
            <h2 className="text-5xl font-black tracking-tighter text-[var(--on-secondary-fixed)]">Ingresos</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--outline-variant)]">Período:</label>
              <input type="month" value={mes} onChange={e => setMes(e.target.value)}
                className="h-11 paper-lowest rounded-xl px-4 font-black text-sm outline-none transition-all border border-primary/5 focus:ring-2 ring-primary/20 shadow-sm" />
            </div>
            <button onClick={() => setIsModalOpen(true)} className="btn-azure px-8 h-12 flex items-center gap-3 text-xs tracking-widest uppercase shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-[18px]">add_card</span>
              Nuevo Cobro
            </button>
          </div>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-5">
          {[
            { label: 'Ingresos del Mes', value: `S/ ${totalMes.toFixed(2)}`, icon: 'payments', color: '#00AEEF' },
            { label: 'Crecimiento Estimado', value: '+12.5%', icon: 'trending_up', color: '#10B981' },
            { label: 'Transacciones', value: transacciones, icon: 'receipt_long', color: '#8B5CF6' },
          ].map(k => (
            <div key={k.label} className="paper-lowest rounded-[2rem] p-7 flex items-center gap-5 shadow-[0_4px_16px_rgba(11,29,45,0.03)] group transition-all hover:bg-surface-container-low border border-primary/5">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: `${k.color}15` }}>
                <span className="material-symbols-outlined text-3xl" style={{ color: k.color }}>{k.icon}</span>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--outline-variant)]">{k.label}</p>
                <p className="text-2xl font-black tracking-tighter" style={{ color: k.color }}>{k.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Breakdown by method */}
        <div className="paper-lowest rounded-[2.5rem] p-8 shadow-[0_4px_32px_rgba(11,29,45,0.02)] border border-primary/5">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--outline-variant)] mb-6">Desglose por Método de Pago</h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(porMetodo).length === 0 ? (
                <p className="text-xs font-black uppercase opacity-20 tracking-widest">Sin datos este mes</p>
            ) : Object.entries(porMetodo).map(([metodo, monto]) => (
              <div key={metodo} className="flex items-center gap-3 px-5 py-3 rounded-2xl transition-all hover:scale-105 border border-primary/5" style={{ background: `${metodoColor[metodo] || '#ccc'}15` }}>
                <div className="w-3 h-3 rounded-full shadow-sm" style={{ background: metodoColor[metodo] || '#666' }} />
                <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: metodoColor[metodo] || '#666' }}>{metodo}</span>
                <span className="text-lg font-black tracking-tight" style={{ color: metodoColor[metodo] || '#666' }}>S/ {monto.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payments table */}
        <div className="paper-lowest rounded-[2.5rem] overflow-hidden shadow-sm border border-primary/5">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[var(--surface-container-low)]">
                {['Socio', 'Plan', 'Monto', 'Método', 'Fecha'].map(h => (
                  <th key={h} className="py-5 px-7 text-[10px] font-black tracking-widest uppercase text-[var(--on-surface-variant)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--surface-container)]">
              {loading ? (
                 <tr><td colSpan="5" className="py-20 text-center text-xs font-black uppercase tracking-widest opacity-50">Cargando transacciones...</td></tr>
              ) : filtrados.length === 0 ? (
                 <tr><td colSpan="5" className="py-20 text-center text-xs font-black uppercase tracking-widest opacity-50">Sin cobros registrados este mes.</td></tr>
              ) : filtrados.map(p => (
                  <tr key={p.id} className="hover:bg-[var(--surface-container-low)] transition-colors group">
                    <td className="py-5 px-7">
                      <p className="font-black text-[var(--on-secondary-fixed)] uppercase tracking-tight text-sm group-hover:text-primary transition-colors">{p.socio}</p>
                      <p className="text-[10px] font-bold text-[var(--outline-variant)] uppercase">{p.documento}</p>
                    </td>
                    <td className="py-5 px-7 text-xs font-black text-[var(--on-surface-variant)] uppercase tracking-tighter">{p.plan}</td>
                    <td className="py-5 px-7 text-xl font-black tracking-tighter text-primary">S/ {parseFloat(p.monto).toFixed(2)}</td>
                    <td className="py-5 px-7">
                      <span className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter" style={{ background: `${metodoColor[p.metodo_pago] || '#ccc'}15`, color: metodoColor[p.metodo_pago] || '#666' }}>{p.metodo_pago}</span>
                    </td>
                    <td className="py-5 px-7 text-sm font-bold text-[var(--on-surface-variant)] uppercase tracking-tighter">{new Date(p.fecha_pago).toLocaleDateString('es-PE')}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal Cobro */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[var(--on-secondary-fixed)]/20 backdrop-blur-[24px]">
          <div className="paper-lowest p-10 rounded-[3rem] shadow-2xl w-full max-w-md animate-fade-in border border-primary/10">
            <header className="mb-8 flex items-end justify-between border-b border-[var(--surface-container)] pb-6">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-1 text-primary">Nueva Transacción</h4>
                <h3 className="text-2xl font-black tracking-tighter text-[var(--on-secondary-fixed)] uppercase">Registrar Cobro</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full hover:bg-[var(--surface-container-low)] flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </header>
            
            <form onSubmit={registrarPago} className="space-y-6">
              <div className="relative">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-1">Buscar Socio (Nombre o DNI)</label>
                <input type="text" value={busquedaSocio} onChange={e => {setBusquedaSocio(e.target.value); setForm({...form, socio_id: ''})}}
                  placeholder="Escriba para buscar..."
                  className="h-14 paper-nested rounded-2xl px-5 w-full font-black focus:ring-2 ring-primary/20 uppercase transition-all" required />
                
                {sociosFiltrados.length > 0 && !form.socio_id && (
                  <div className="absolute top-full left-0 right-0 mt-2 paper-lowest rounded-2xl shadow-xl z-10 border border-primary/10 overflow-hidden">
                    {sociosFiltrados.map(s => (
                      <button key={s.id} type="button" onClick={() => handleSocioSelect(s)}
                        className="w-full text-left px-5 py-4 hover:bg-primary/5 transition-colors border-b border-[var(--surface-container)] last:border-0">
                        <p className="font-black text-xs uppercase tracking-tight">{s.nombre_completo}</p>
                        <p className="text-[10px] font-bold text-[var(--outline-variant)]">{s.nro_documento}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-1">Monto (S/)</label>
                  <input type="number" step="0.01" value={form.monto} onChange={e => setForm({...form, monto: e.target.value})}
                    className="h-14 paper-nested rounded-2xl px-5 font-black text-xl text-primary" required />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-1">Método</label>
                  <select value={form.metodo_pago} onChange={e => setForm({...form, metodo_pago: e.target.value})}
                    className="h-14 paper-nested rounded-2xl px-3 font-bold outline-none cursor-pointer">
                    {['Efectivo', 'Tarjeta', 'Yape', 'Transferencia'].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button type="submit" disabled={!form.socio_id}
                  className={`h-16 btn-azure uppercase text-xs tracking-widest shadow-lg shadow-primary/20 ${!form.socio_id ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}>
                  <span className="material-symbols-outlined text-xl">receipt_long</span> Confirmar Pago y Generar Ticket
                </button>
                <p className="text-[9px] text-center font-bold text-[var(--outline-variant)] uppercase tracking-widest">
                  * SE DESCARGARÁ UN COMPROBANTE EN PDF AUTOMÁTICAMENTE
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GymIngresos;
