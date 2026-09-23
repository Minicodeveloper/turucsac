import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(
  ArcElement, Tooltip, Legend, 
  CategoryScale, LinearScale, 
  PointElement, LineElement, Filler
);

const Finanzas = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filtros visuales ERP
  const [activeTab, setActiveTab] = useState('resumen');
  const [sucursal, setSucursal] = useState('TODAS');
  const [moneda, setMoneda] = useState('SOLES');
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [fechaDesde, setFechaDesde] = useState('2026-09-01');
  const [fechaHasta, setFechaHasta] = useState(todayStr);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const resp = await financeService.getStats();
      if (resp) {
        const payload = resp.data ? resp.data : resp;
        setStats(payload);
      }
    } catch (err) {
      console.error('Error al cargar finanzas:', err);
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

  const totalIngresos = parseFloat(stats?.ingresos ?? 0);
  const totalEgresos = parseFloat(stats?.egresos ?? 0);
  const balanceUtilidad = parseFloat(stats?.balance ?? (totalIngresos - totalEgresos));
  
  const egresoCompras = parseFloat(stats?.detalle_egresos?.compras ?? 0);
  const egresoGastos = parseFloat(stats?.detalle_egresos?.gastos ?? 0);

  const metodosPagoLista = Array.isArray(stats?.metodos_pago) ? stats.metodos_pago : [];

  const chartData = {
    labels: metodosPagoLista.length > 0 ? metodosPagoLista.map(m => m.label) : ['Sin ventas'],
    datasets: [{
      data: metodosPagoLista.length > 0 ? metodosPagoLista.map(m => parseFloat(m.value || 0)) : [1],
      backgroundColor: metodosPagoLista.length > 0 
        ? ['#24a0ed', '#8B5CF6', '#f59e0b', '#10b981', '#ef4444', '#06b6d4'] 
        : ['#e2e8f0'],
      borderWidth: 2,
      borderColor: '#ffffff',
      hoverOffset: 4
    }]
  };

  const chartOptions = {
    plugins: {
      legend: { 
        position: 'bottom', 
        labels: { 
          color: '#334155', 
          font: { weight: 'bold', size: 10 }, 
          usePointStyle: true, 
          boxWidth: 6,
          padding: 10
        } 
      },
      tooltip: {
        callbacks: {
          label: (context) => ` S/ ${formatPEN(context.raw)}`
        }
      }
    },
    cutout: '60%',
    maintainAspectRatio: false
  };

  const tabs = [
    { id: 'resumen', label: 'Resumen General' },
    { id: 'por_cobrar', label: 'Cuentas por Cobrar' },
    { id: 'por_pagar', label: 'Cuentas por Pagar' },
    { id: 'transferencias', label: 'Transferencias' },
    { id: 'otros_egresos', label: 'Gastos de Operación' },
    { id: 'flujo', label: 'Cierres de Caja / Turnos' },
  ];

  const handleTabClick = (tabId) => {
    if (tabId === 'flujo') {
      navigate('/conciliacion');
    } else {
      setActiveTab(tabId);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f1f5f9] text-slate-800 text-xs font-sans">
      <Sidebar />

      <main className="flex-1 md:ml-60 p-3 sm:p-4 flex flex-col gap-2.5 max-w-[1600px]">
        {/* Cabecera Principal */}
        <header className="bg-[#24a0ed] text-white px-4 py-2 rounded flex justify-between items-center shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-black italic tracking-wide text-sm uppercase">TURUCSAC &gt;&gt;</span>
            <span className="text-[11px] font-bold text-sky-100 uppercase tracking-tight">CAJA Y BANCOS - GESTIÓN FINANCIERA</span>
          </div>
          <button 
            type="button"
            onClick={() => window.print()}
            className="bg-sky-800/40 hover:bg-sky-800/60 px-3 py-1 rounded text-white font-bold text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">print</span>
            <span>EXPORTAR INFORME</span>
          </button>
        </header>

        {/* 1. Botonera Superior de Sub-Pestañas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5">
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                className={`py-1.5 px-2 rounded font-bold text-[11px] text-center transition-all cursor-pointer truncate ${
                  isSelected
                    ? 'bg-[#24a0ed] text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 2. Barra de Filtros tipo ERP */}
        <div className="bg-white p-2.5 rounded border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <label className="font-bold text-slate-600 text-[11px]">Sucursal:</label>
              <select 
                value={sucursal} 
                onChange={(e) => setSucursal(e.target.value)}
                className="h-7 border border-slate-300 rounded px-2 text-xs font-semibold bg-slate-50 outline-none cursor-pointer"
              >
                <option value="TODAS">TODAS LAS SUCURSALES</option>
                <option value="LIMA">LIMA (ESTACIÓN CENTRAL)</option>
                <option value="SUCURSAL NORTE">SUCURSAL NORTE</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <label className="font-bold text-slate-600 text-[11px]">Desde:</label>
              <input 
                type="date" 
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="h-7 border border-slate-300 rounded px-2 text-xs font-semibold outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <label className="font-bold text-slate-600 text-[11px]">Hasta:</label>
              <input 
                type="date" 
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="h-7 border border-slate-300 rounded px-2 text-xs font-semibold outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <label className="font-bold text-slate-600 text-[11px]">Moneda:</label>
              <select 
                value={moneda} 
                onChange={(e) => setMoneda(e.target.value)}
                className="h-7 border border-slate-300 rounded px-2 text-xs font-semibold bg-slate-50 outline-none cursor-pointer"
              >
                <option value="SOLES">SOLES (S/)</option>
                <option value="USD">DÓLARES ($)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={fetchStats}
              className="bg-[#24a0ed] hover:bg-sky-600 text-white font-bold px-4 h-7 rounded text-[11px] transition-colors cursor-pointer flex items-center gap-1"
            >
              {loading && <span className="material-symbols-outlined text-sm animate-spin">sync</span>}
              <span>Buscar</span>
            </button>
          </div>
        </div>

        {/* 3. Panel de Flujo de Caja */}
        <div className="space-y-2">
          {/* Banner Rojo Vino: Saldo Inicial / Recaudación Acumulada */}
          <div className="bg-[#7f1d1d] text-white px-3 py-1.5 rounded flex justify-between items-center shadow-xs">
            <span className="font-bold tracking-wide text-xs uppercase">Saldo Inicial de Efectivo / Caja Activa</span>
            <span className="font-mono font-black text-sm">
              S/ {formatPEN(totalIngresos)}
            </span>
          </div>

          {/* Dos Columnas Paralelas: Ingresos vs Egresos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 items-start">
            
            {/* Columna Izquierda: Ingresos */}
            <div className="bg-white rounded border border-slate-200 shadow-xs overflow-hidden">
              <div className="bg-[#00c49f] text-white px-3 py-1.5 flex justify-between items-center font-bold text-xs">
                <span className="uppercase tracking-tight">Ingresos Efectivo</span>
                <span className="font-mono font-black">S/ {formatPEN(totalIngresos)}</span>
              </div>
              <div className="divide-y divide-slate-100 font-medium">
                <div className="px-3 py-1.5 flex justify-between items-center hover:bg-slate-50">
                  <span className="text-slate-700">Ventas en Pista (POS Combustibles)</span>
                  <span className="font-mono font-bold text-slate-900">S/ {formatPEN(totalIngresos)}</span>
                </div>
                <div className="px-3 py-1.5 flex justify-between items-center hover:bg-slate-50 text-slate-400">
                  <span>Cuentas por Cobrar</span>
                  <span className="font-mono">S/ 0.00</span>
                </div>
                <div className="px-3 py-1.5 flex justify-between items-center hover:bg-slate-50 text-slate-400">
                  <span>Otros Ingresos de Caja</span>
                  <span className="font-mono">S/ 0.00</span>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Egresos */}
            <div className="bg-white rounded border border-slate-200 shadow-xs overflow-hidden">
              <div className="bg-[#00c49f] text-white px-3 py-1.5 flex justify-between items-center font-bold text-xs">
                <span className="uppercase tracking-tight">Egresos Efectivo</span>
                <span className="font-mono font-black">S/ {formatPEN(totalEgresos)}</span>
              </div>
              <div className="divide-y divide-slate-100 font-medium">
                <div className="px-3 py-1.5 flex justify-between items-center hover:bg-slate-50">
                  <span className="text-slate-700">Compras de Combustible (Cisternas)</span>
                  <span className="font-mono font-bold text-rose-600">
                    -S/ {formatPEN(egresoCompras)}
                  </span>
                </div>
                <div className="px-3 py-1.5 flex justify-between items-center hover:bg-slate-50">
                  <span className="text-slate-700">Gastos Operativos (Caja Chica)</span>
                  <span className="font-mono font-bold text-rose-600">
                    -S/ {formatPEN(egresoGastos)}
                  </span>
                </div>
                <div className="px-3 py-1.5 flex justify-between items-center hover:bg-slate-50 text-slate-400">
                  <span>Cuentas por Pagar</span>
                  <span className="font-mono">S/ 0.00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Banner Rojo Vino: Saldo Final / Balance */}
          <div className="bg-[#7f1d1d] text-white px-3 py-1.5 rounded flex justify-between items-center shadow-xs">
            <span className="font-bold tracking-wide text-xs uppercase">Saldo Final Efectivo (Balance de Caja)</span>
            <span className="font-mono font-black text-sm">
              S/ {formatPEN(balanceUtilidad)}
            </span>
          </div>
        </div>

        {/* 4. Canales de Recaudación y Gráfico */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-start">
          <div className="md:col-span-8 bg-white p-3 rounded border border-slate-200 shadow-xs space-y-1.5">
            <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
              <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                Desglose de Recaudación por Medios de Pago
              </h4>
              <span className="text-[10px] text-slate-400 font-semibold">
                {metodosPagoLista.length} canal{metodosPagoLista.length === 1 ? '' : 'es'}
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {metodosPagoLista.length === 0 ? (
                <p className="py-4 text-center text-slate-400 italic">No hay registros de métodos de pago en el rango seleccionado.</p>
              ) : (
                metodosPagoLista.map((m, i) => (
                  <div key={i} className="py-1.5 flex justify-between items-center text-xs hover:bg-slate-50 px-1 rounded">
                    <span className="font-semibold text-slate-600 uppercase">{m.label}</span>
                    <span className="font-mono font-black text-slate-900">S/ {formatPEN(m.value)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="md:col-span-4 bg-white p-3 rounded border border-slate-200 shadow-xs flex flex-col">
            <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-1.5 mb-1">
              Proporción por Canal
            </h4>
            <div className="h-44 flex items-center justify-center p-1">
              <Doughnut data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Finanzas;