import React from 'react';
import Sidebar from '../../components/Sidebar';
import { useNavigate } from 'react-router-dom';

const Express = () => {
  const navigate = useNavigate();

  const actions = [
    { title: 'Nueva Venta', desc: 'Despacho automático POS', icon: 'point_of_sale', path: '/pos', color: 'bg-[#00AEEF]' },
    { title: 'Ver Inventario', desc: 'Consulta de stock crítico', icon: 'inventory_2', path: '/inventario', color: 'bg-emerald-500' },
    { title: 'Rendir Cuentas', desc: 'Cierre de turno actual', icon: 'account_balance_wallet', path: '/conciliacion', color: 'bg-rose-500' },
    { title: 'Abastecimiento', desc: 'Ingreso de cisterna', icon: 'local_shipping', path: '/compras', color: 'bg-slate-600' },
    { title: 'Base Clientes', desc: 'Gestión de facturación', icon: 'groups', path: '/clientes', color: 'bg-[#8B5CF6]' },
  ];

  return (
    <div className="min-h-screen flex bg-[var(--surface)]">
      <Sidebar />
      <main className="flex-1 md:ml-64 pt-24 pb-12 px-10 max-w-7xl mx-auto space-y-12">
        
        <header className="flex flex-col gap-2 border-l-[6px] border-[var(--primary-container)] pl-8 py-2">
            <h1 className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--primary-container)]">Panel Express</h1>
            <h2 className="text-5xl font-black tracking-tighter text-[var(--on-secondary-fixed)] uppercase">Acceso Directo</h2>
            <p className="text-sm font-bold text-[var(--outline-variant)] uppercase tracking-widest mt-2 opacity-60">Terminal de operaciones simplificadas para alto rendimiento</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {actions.map((act, idx) => (
             <button 
               key={idx}
               onClick={() => navigate(act.path)}
               className="paper-lowest p-10 rounded-[2.5rem] flex flex-col items-center text-center group transition-all duration-500 hover:shadow-2xl hover:shadow-primary-container/10 hover:-translate-y-2 border border-white/5 active:scale-95"
             >
                <div className={`w-20 h-20 rounded-[2rem] ${act.color} flex items-center justify-center text-white mb-8 shadow-xl transition-transform group-hover:scale-110 group-hover:rotate-6`}>
                   <span className="material-symbols-outlined text-4xl">{act.icon}</span>
                </div>
                <h3 className="text-xl font-black text-[var(--on-secondary-fixed)] uppercase tracking-tighter mb-2 group-hover:text-[var(--primary-container)] transition-colors">{act.title}</h3>
                <p className="text-[11px] font-bold text-[var(--outline-variant)] uppercase tracking-[0.2em]">{act.desc}</p>
                
                <div className="mt-10 w-full h-[2px] bg-[var(--surface-container-high)] relative overflow-hidden rounded-full">
                    <div className={`absolute inset-0 ${act.color} translate-x-[-100%] group-hover:translate-x-[0%] transition-transform duration-700`}></div>
                </div>
             </button>
           ))}
        </div>

        {/* System Health Clinical Tag */}
        <footer className="pt-20 flex justify-center opacity-40">
           <div className="flex items-center gap-4 px-8 py-3 rounded-full bg-[var(--surface-container-low)] border border-white/5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[9px] font-black uppercase tracking-[0.5em] text-[var(--on-surface-variant)]">Sistema Grifo ERP v2.4 — Terminal Express Activo</span>
           </div>
        </footer>
      </main>
    </div>
  );
};

export default Express;
