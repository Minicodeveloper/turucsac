import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { dashboardService } from '../../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
);

const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const resp = await dashboardService.getMetrics();
      if (resp.success) setMetrics(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[var(--surface)]"><span className="material-symbols-outlined animate-spin text-4xl">sync</span></div>;

  const salesData = {
    labels: metrics?.ventas_semanales?.map(v => v.dia) || [],
    datasets: [{
      label: 'Ventas Diarias (S/)',
      data: metrics?.ventas_semanales?.map(v => v.total) || [],
      backgroundColor: '#00AEEF15',
      borderColor: '#00AEEF',
      borderWidth: 2,
      borderRadius: 4,
      pointBackgroundColor: '#00AEEF',
      tension: 0.4
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0B1D2D',
        titleFont: { size: 12, weight: '900' },
        bodyFont: { size: 11 },
        padding: 12,
        cornerRadius: 8,
        displayColors: false
      }
    },
    scales: {
      y: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 10, weight: '600' }, color: '#BDC8D1' } },
      x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 10, weight: '600' }, color: '#BDC8D1' } }
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--surface)]">
      <Sidebar />
      <main className="flex-1 md:ml-64 pt-24 pb-12 px-10 max-w-7xl mx-auto space-y-12">
        <header className="flex items-end justify-between border-b-[3px] border-[var(--primary-container)] pb-6">
          <div>
            <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--primary-container)] mb-1">Visión Ejecutiva</h1>
            <h2 className="text-5xl font-black tracking-tighter text-[var(--on-secondary-fixed)]">El Libro Mayor</h2>
          </div>
          <div className="text-right">
            <span className="micro-tag bg-[var(--surface-container-high)] text-[var(--on-surface-variant)]">Actualizado</span>
            <p className="text-[11px] font-bold text-[var(--outline-variant)] mt-1 uppercase tracking-widest">{new Date().toLocaleDateString()}</p>
          </div>
        </header>

        {/* Executive Metric Layer */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Ventas Hoy', val: `S/ ${metrics?.ventas_hoy || '0.00'}`, icon: 'payments', color: 'text-[var(--primary-container)]' },
            { label: 'Stock Crítico', val: metrics?.stock_critico?.length || 0, icon: 'warning', color: 'text-[var(--error)]' },
            { label: 'Transacciones', val: metrics?.total_ventas_mes || 0, icon: 'receipt_long', color: 'text-[var(--on-secondary-fixed)]' },
            { label: 'Ticket Promedio', val: `S/ ${((metrics?.ventas_hoy || 0) / (metrics?.total_ventas_mes || 1)).toFixed(2)}`, icon: 'analytics', color: 'text-[var(--on-surface-variant)]' }
          ].map((m, idx) => (
            <div key={idx} className="paper-lowest p-8 rounded-xl shadow-[0_4px_16px_rgba(11,29,45,0.03)] flex flex-col gap-1 group hover:bg-[var(--surface-container-low)] transition-colors cursor-default">
              <span className={`material-symbols-outlined ${m.color} text-[18px] mb-2`}>{m.icon}</span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--on-surface-variant)]">{m.label}</span>
              <span className="text-2xl font-black text-[var(--on-secondary-fixed)] tracking-tighter group-hover:scale-105 origin-left transition-transform">{m.val}</span>
            </div>
          ))}
        </section>

        {/* Tonal Layering: The Clinical Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 paper-lowest rounded-2xl p-10 shadow-[0_4px_32px_rgba(11,29,45,0.02)]">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-[var(--on-secondary-fixed)]">Tendencia de Ingresos</h3>
              <div className="flex gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--primary-container)]"></span>
                <span className="text-[9px] font-black text-[var(--outline-variant)] uppercase tracking-widest">7 Días</span>
              </div>
            </div>
            <div className="h-[300px]">
              <Line data={salesData} options={chartOptions} />
            </div>
          </div>

          <div className="lg:col-span-4 paper-lowest rounded-2xl p-10 shadow-[0_4px_32px_rgba(11,29,45,0.02)] flex flex-col">
            <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-[var(--on-secondary-fixed)] mb-8">Alertas de Reposición</h3>
            <div className="space-y-6 flex-1 overflow-y-auto pr-2">
              {metrics?.stock_critico?.length === 0 ? (
                <p className="text-xs text-[var(--on-surface-variant)] font-medium">Todos los niveles operativos.</p>
              ) : metrics?.stock_critico?.map((item, i) => (
                <div key={i} className="flex items-center justify-between pb-4 border-b border-[var(--surface-container)] last:border-0 group">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-[var(--on-secondary-fixed)] uppercase group-hover:text-[var(--primary-container)] transition-colors">{item.nombre}</span>
                    <span className="text-[10px] font-black text-[var(--error)] uppercase tracking-tighter">{item.stock} Galones</span>
                  </div>
                  <span className="material-symbols-outlined text-error/30 text-[14px]">priority_high</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section: Asymmetric Meta-Data */}
        <footer className="pt-12 text-center lg:text-right border-t border-[var(--outline-variant)]/10">
          <p className="text-[10px] font-black text-[var(--outline-variant)] uppercase tracking-[0.4em]">Arquitectura Clínica 2026</p>
        </footer>
      </main>
    </div>
  );
};

export default Dashboard;
