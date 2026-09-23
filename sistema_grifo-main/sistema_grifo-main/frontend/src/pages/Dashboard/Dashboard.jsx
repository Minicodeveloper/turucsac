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
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler
);

const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Leer usuario y rol de la sesión activa
  const user = JSON.parse(sessionStorage.getItem('usuario') || '{}');
  const userRole = (user.rol || user.role || 'cajero').toLowerCase();
  const isAdmin = userRole.includes('admin');

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const resp = await dashboardService.getMetrics();
      if (resp && (resp.success || resp.data)) {
        setMetrics(resp.data || resp);
      }
    } catch (err) {
      console.error('Error al cargar analítica:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPEN = (val) => {
    const num = Number(val) || 0;
    return num.toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const ventasHoy = parseFloat(metrics?.ventas_hoy || 0);
  const totalTransacciones = parseInt(metrics?.total_ventas_mes || 0, 10);
  const stockCriticoCount = metrics?.stock_critico?.length || 0;
  const ticketPromedio = totalTransacciones > 0 ? (ventasHoy / totalTransacciones) : 0;

  // Manejo de datos para la gráfica de 7 días
  const diasLabels = metrics?.ventas_semanales?.length > 0
    ? metrics.ventas_semanales.map(v => v.dia)
    : ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const diasValues = metrics?.ventas_semanales?.length > 0
    ? metrics.ventas_semanales.map(v => parseFloat(v.total || 0))
    : [0, 0, 0, 0, 0, 0, ventasHoy];

  const salesData = {
    labels: diasLabels,
    datasets: [{
      label: 'Ventas (S/)',
      data: diasValues,
      backgroundColor: 'rgba(36, 160, 237, 0.08)',
      borderColor: '#24a0ed',
      borderWidth: 2,
      pointBackgroundColor: '#24a0ed',
      pointBorderColor: '#ffffff',
      pointRadius: 4,
      pointHoverRadius: 6,
      fill: true,
      tension: 0.3
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 8,
        titleFont: { size: 11, weight: 'bold' },
        bodyFont: { size: 11, family: 'monospace' },
        callbacks: {
          label: (context) => ` Recaudación: S/ ${formatPEN(context.raw)}`
        }
      }
    },
    scales: {
      y: {
        grid: { color: '#f1f5f9' },
        ticks: {
          color: '#64748b',
          font: { size: 10, family: 'monospace' },
          callback: (value) => `S/ ${value}`
        }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 10, weight: '600' } }
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f4f7f9] text-slate-800 text-xs font-sans">
      <Sidebar />

      <main className="flex-1 md:ml-60 p-4 flex flex-col gap-3">
        {/* Cabecera Principal */}
        <header className="bg-[#24a0ed] text-white px-4 py-2.5 rounded flex justify-between items-center shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-black tracking-wider text-sm uppercase">TURUCSAC &gt;&gt;</span>
            <span className="text-[11px] font-bold text-sky-100 uppercase">
              {isAdmin ? 'ANALÍTICA DE ESTACIÓN - EL LIBRO MAYOR' : 'PANEL OPERATIVO DE TURNO - CAJA'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-sky-800/50 px-2.5 py-1 rounded font-mono font-bold">
              {new Date().toLocaleDateString('es-PE')}
            </span>
            <button 
              type="button"
              onClick={fetchMetrics}
              title="Refrescar métricas"
              className="bg-sky-800/40 hover:bg-sky-800/60 p-1 rounded text-white transition-colors cursor-pointer"
            >
              <span className={`material-symbols-outlined text-base ${loading ? 'animate-spin' : ''}`}>sync</span>
            </button>
          </div>
        </header>

        {/* 1. Capa de Métricas Ejecutivas / Turno */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Ventas Hoy */}
          <div className="bg-white p-3 rounded border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="font-bold text-[10px] uppercase tracking-wider">
                {isAdmin ? 'Ventas Acumuladas Hoy' : 'Mi Total Despachado'}
              </span>
              <span className="material-symbols-outlined text-[#24a0ed] text-base">payments</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-bold text-slate-400">S/</span>
              <span className="text-lg font-black font-mono text-slate-900 tracking-tight">
                {formatPEN(ventasHoy)}
              </span>
            </div>
            <span className="text-[9px] text-emerald-600 font-bold mt-1">Registrado en pista</span>
          </div>

          {/* Stock Crítico */}
          <div className="bg-white p-3 rounded border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="font-bold text-[10px] uppercase tracking-wider">Tanques en Alerta</span>
              <span className="material-symbols-outlined text-amber-500 text-base">warning</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black font-mono text-slate-900 tracking-tight">
                {stockCriticoCount}
              </span>
              <span className="text-xs font-bold text-slate-500">combustibles</span>
            </div>
            <span className="text-[9px] text-slate-400 font-medium mt-1">Nivel de reserva mínimo</span>
          </div>

          {/* Transacciones */}
          <div className="bg-white p-3 rounded border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="font-bold text-[10px] uppercase tracking-wider">Transacciones</span>
              <span className="material-symbols-outlined text-indigo-500 text-base">receipt_long</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black font-mono text-slate-900 tracking-tight">
                {totalTransacciones}
              </span>
              <span className="text-xs font-bold text-slate-500">comprobantes</span>
            </div>
            <span className="text-[9px] text-slate-400 font-medium mt-1">Boletas / Facturas emitidas</span>
          </div>

          {/* Ticket Promedio */}
          <div className="bg-white p-3 rounded border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="font-bold text-[10px] uppercase tracking-wider">Ticket Promedio</span>
              <span className="material-symbols-outlined text-emerald-600 text-base">analytics</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-bold text-slate-400">S/</span>
              <span className="text-lg font-black font-mono text-slate-900 tracking-tight">
                {formatPEN(ticketPromedio)}
              </span>
            </div>
            <span className="text-[9px] text-slate-400 font-medium mt-1">Por despacho realizado</span>
          </div>
        </section>

        {/* 2. Tendencia de Ventas y Alertas de Tanques */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
          {/* Gráfico de Despachos */}
          <div className="lg:col-span-8 bg-white p-3.5 rounded border border-slate-200 shadow-xs flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#24a0ed] text-base">show_chart</span>
                <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wide">
                  Tendencia de Despacho (Últimos 7 Días)
                </h3>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded">
                Surtidores en Operación
              </span>
            </div>
            <div className="h-64 w-full">
              <Line data={salesData} options={chartOptions} />
            </div>
          </div>

          {/* Lista de Alertas de Reposición */}
          <div className="lg:col-span-4 bg-white p-3.5 rounded border border-slate-200 shadow-xs flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-amber-500 text-base">local_gas_station</span>
                <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wide">
                  Control de Tanques
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">Stock Operativo</span>
            </div>

            <div className="divide-y divide-slate-100 space-y-1">
              {metrics?.stock_critico?.length === 0 ? (
                <div className="py-8 text-center text-slate-400 flex flex-col items-center gap-1">
                  <span className="material-symbols-outlined text-emerald-500 text-2xl">check_circle</span>
                  <span className="text-xs font-semibold text-slate-600">Niveles de combustible conformes</span>
                  <span className="text-[10px]">No hay alertas de stock bajo.</span>
                </div>
              ) : (
                metrics?.stock_critico?.map((item, i) => (
                  <div key={i} className="py-2 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700 uppercase text-xs">{item.nombre}</span>
                      <span className="text-[10px] text-slate-400">Capacidad en reserva</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-rose-600 text-xs">
                        {parseFloat(item.stock || 0).toFixed(2)} Gln
                      </span>
                      <span className="block text-[9px] font-bold text-rose-500 uppercase">Crítico</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;