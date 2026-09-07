import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { financeService } from '../../services/api';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';

ChartJS.register(
  ArcElement, Tooltip, Legend, 
  CategoryScale, LinearScale, 
  PointElement, LineElement, Filler
);

const Finanzas = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const resp = await financeService.getStats();
      if (resp.success) setStats(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[var(--surface)]"><span className="material-symbols-outlined animate-spin text-4xl">sync</span></div>;

  const pieData = {
    labels: stats?.metodos_pago?.map(m => m.label) || [],
    datasets: [{
      data: stats?.metodos_pago?.map(m => m.value) || [],
      backgroundColor: ['#00AEEF', '#8B5CF6', '#F59E0B', '#10B981'],
      borderWidth: 0,
      hoverOffset: 12
    }]
  };

  const pieOptions = {
    plugins: {
      legend: { position: 'bottom', labels: { color: '#BDC8D1', font: { weight: '800', size: 10 }, usePointStyle: true } }
    },
    maintainAspectRatio: false
  };

  return (
    <div className="min-h-screen flex bg-[var(--surface)]">
      <Sidebar />
      <main className="flex-1 md:ml-64 pt-24 pb-12 px-10 max-w-7xl mx-auto space-y-10">
        
        <header className="flex items-end justify-between border-b-[3px] border-[var(--primary-container)] pb-6">
          <div>
            <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--primary-container)] mb-1">Métricas de Rentabilidad</h1>
            <h2 className="text-5xl font-black tracking-tighter text-[var(--on-secondary-fixed)] uppercase">Balances Financieros</h2>
          </div>
          <button onClick={() => window.print()} className="paper-nested px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--primary-container)] hover:bg-[var(--primary-container)] hover:text-white transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">print</span> Generar Informe
          </button>
        </header>

        {/* Global ROI Layer */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           {[
             { label: 'Ingresos Acumulados', val: `S/ ${stats?.ingresos.toFixed(2)}`, color: 'text-emerald-500', icon: 'trending_up' },
             { label: 'Egresos Totales', val: `S/ ${stats?.egresos.toFixed(2)}`, color: 'text-[var(--error)]', icon: 'trending_down' },
             { label: 'Utilidad Operativa', val: `S/ ${stats?.balance.toFixed(2)}`, color: 'text-[var(--primary-container)]', icon: 'auto_graph' },
             { label: 'Margen Estimado', val: `${((stats?.balance / (stats?.ingresos || 1)) * 100).toFixed(1)}%`, color: 'text-[var(--on-secondary-fixed)]', icon: 'percent' }
           ].map((m, idx) => (
             <div key={idx} className="paper-lowest p-8 rounded-2xl shadow-sm flex flex-col gap-1 hover:bg-[var(--surface-container-low)] transition-all group">
                <span className={`material-symbols-outlined ${m.color} text-xl mb-2`}>{m.icon}</span>
                <span className="text-[10px] font-black text-[var(--outline-variant)] uppercase tracking-widest leading-none">{m.label}</span>
                <span className={`text-2xl font-black tracking-tighter leading-tight ${m.color}`}>{m.val}</span>
             </div>
           ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           {/* Detailed Expenses Breakdown */}
           <div className="lg:col-span-8 paper-lowest rounded-[2.5rem] p-10">
              <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-[var(--on-secondary-fixed)] mb-10 border-b border-white/5 pb-4">Desglose de Egresos Logísticos</h3>
              <div className="space-y-8">
                 {[
                   { label: 'Compras de Combustible (Cisternas)', val: stats?.detalle_egresos.compras, icon: 'local_shipping', color: 'bg-[var(--primary-container)]/10 text-[var(--primary-container)]' },
                   { label: 'Gastos de Operación (Caja Chica)', val: stats?.detalle_egresos.gastos, icon: 'receipt_long', color: 'bg-[var(--error)]/10 text-[var(--error)]' },
                 ].map((e, idx) => (
                   <div key={idx} className="flex items-center justify-between p-6 rounded-2xl bg-[var(--surface-container-low)] border border-white/5">
                      <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${e.color}`}>
                           <span className="material-symbols-outlined text-3xl">{e.icon}</span>
                        </div>
                        <div>
                           <p className="text-sm font-black text-[var(--on-secondary-fixed)] tracking-tight uppercase leading-none">{e.label}</p>
                           <p className="text-[10px] font-bold text-[var(--outline-variant)] mt-1 tracking-widest uppercase">Rubros Contables Registrados</p>
                        </div>
                      </div>
                      <span className="text-2xl font-black text-[var(--on-secondary-fixed)] tracking-tighter">S/ {parseFloat(e.val).toFixed(2)}</span>
                   </div>
                 ))}
                 
                 <div className="pt-10 flex items-center justify-between">
                    <p className="text-[10px] font-black text-[var(--outline-variant)] uppercase tracking-[0.4em]">Arquitectura Contable 2026</p>
                    <div className="flex gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                       <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Sincronizado</span>
                    </div>
                 </div>
              </div>
           </div>

           {/* Distribution by payment method */}
           <div className="lg:col-span-4 paper-lowest rounded-[2.5rem] p-10 flex flex-col">
              <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-[var(--on-secondary-fixed)] mb-10">Canales de Ingreso</h3>
              <div className="flex-1 min-h-[300px] mb-8">
                 <Pie data={pieData} options={pieOptions} />
              </div>
              <div className="space-y-3">
                 {stats?.metodos_pago.map((m, i) => (
                   <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 opacity-80 hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-black text-[var(--outline-variant)] uppercase tracking-widest">{m.label}</span>
                      <span className="text-xs font-black text-[var(--on-secondary-fixed)] uppercase tracking-tighter">S/ {parseFloat(m.value).toFixed(2)}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>

      </main>
    </div>
  );
};

export default Finanzas;
