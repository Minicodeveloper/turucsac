import React from 'react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-sky-500/30 overflow-x-hidden">
      {/* Background Orbs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-sky-500/10 blur-[100px] rounded-full"></div>
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full z-50 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-white font-bold">local_gas_station</span>
            </div>
            <span className="text-xl font-black tracking-tighter text-white">TURUCSAC <span className="text-sky-500 text-xs">ERP</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-widest text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Beneficios</a>
            <a href="#analytics" className="hover:text-white transition-colors">Analítica</a>
            <button
              onClick={() => navigate('/login')}
              className="bg-white text-slate-950 px-6 py-2.5 rounded-full hover:bg-sky-400 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5"
            >
              Acceso Sistema
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block px-4 py-1 rounded-full bg-white/5 border border-white/10 text-sky-400 text-[10px] font-black uppercase tracking-[0.3em] mb-8 animate-fade-in">
            Un software a tu medida
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-8 leading-[0.9]">
            Control Total para tu <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-sky-400 to-emerald-400">Estación de Servicio</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
            Optimiza la gestión operativa de tu grifo con nuestra plataforma ERP integrada. Ventas rápidas, control de inventario inteligente y analítica en tiempo real.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto bg-primary text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-sky-400 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/30 flex items-center justify-center gap-3"
            >
              Iniciar Gestión <span className="material-symbols-outlined">arrow_forward</span>
            </button>
            <button className="w-full sm:w-auto bg-white/5 border border-white/10 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-white/10 transition-all">
              Ver Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 text-center">
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4 lowercase first-letter:uppercase">Diseñado para la eficiencia operativa</h2>
            <p className="text-slate-400 font-medium">Todo lo que necesitas para administrar tu estación desde un solo lugar.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-xl hover:bg-white/[0.08] transition-all group">
              <div className="w-14 h-14 bg-sky-500/20 rounded-2xl flex items-center justify-center text-sky-400 mb-8 font-black group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl">point_of_sale</span>
              </div>
              <h3 className="text-2xl font-black text-white mb-4">Punto de Venta (POS)</h3>
              <p className="text-slate-400 leading-relaxed font-normal">Interfaz intuitiva para ventas rápidas. Autocompletado de clientes por DNI/RUC y emisión instantánea de tickets profesionales.</p>
            </div>

            <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-xl hover:bg-white/[0.08] transition-all group">
              <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 mb-8 font-black group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl">inventory_2</span>
              </div>
              <h3 className="text-2xl font-black text-white mb-4">Kardex Inteligente</h3>
              <p className="text-slate-400 leading-relaxed font-normal">Auditoría completa de movimientos. Registra cada ingreso y salida de combustible con trazabilidad absoluta y alertas de stock.</p>
            </div>

            <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-xl hover:bg-white/[0.08] transition-all group">
              <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center text-primary mb-8 font-black group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl">leaderboard</span>
              </div>
              <h3 className="text-2xl font-black text-white mb-4">Analítica Avanzada</h3>
              <p className="text-slate-400 leading-relaxed font-normal">Panel de control con gráficas en tiempo real. Monitoriza ventas diarias, tendencias semanales y rentabilidad por producto.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Analytics Preview */}
      <section id="analytics" className="py-32 bg-primary/10 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-20">
          <div className="max-w-xl text-center lg:text-left">
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-8 leading-[1]">Decisiones basadas en datos, <span className="text-sky-500">no en intuiciones.</span></h2>
            <div className="space-y-6 text-slate-400 font-medium text-lg leading-relaxed mb-10">
              <p className="flex items-start gap-4">
                <span className="material-symbols-outlined text-emerald-400 text-xl">check_circle</span>
                Visualiza el flujo de caja diario en gráficas interactivas de alta calidad.
              </p>
              <p className="flex items-start gap-4">
                <span className="material-symbols-outlined text-emerald-400 text-xl">check_circle</span>
                Identifica picos de venta por horario y optimiza tu personal de isla.
              </p>
              <p className="flex items-start gap-4">
                <span className="material-symbols-outlined text-emerald-400 text-xl">check_circle</span>
                Recibe alertas automáticas cuando el stock de un combustible es crítico.
              </p>
            </div>
          </div>

          <div className="flex-1 w-full bg-slate-900 aspect-video rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden p-4 group">
            {/* Mock Dashboard UI */}
            <div className="bg-slate-950 w-full h-full rounded-2xl overflow-hidden border border-white/5 opacity-80 group-hover:opacity-100 transition-opacity">
              <div className="h-12 border-b border-white/5 flex items-center px-4 gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                <div className="h-20 bg-white/5 rounded-xl border border-white/10"></div>
                <div className="h-20 bg-white/5 rounded-xl border border-white/10"></div>
                <div className="col-span-2 h-40 bg-white/5 rounded-2xl border border-white/10 flex items-end p-4 gap-4">
                  <div className="flex-1 bg-primary/40 h-[40%] rounded-t-lg"></div>
                  <div className="flex-1 bg-primary/40 h-[70%] rounded-t-lg"></div>
                  <div className="flex-1 bg-primary/40 h-[60%] rounded-t-lg"></div>
                  <div className="flex-1 bg-primary/40 h-[90%] rounded-t-lg"></div>
                  <div className="flex-1 bg-primary/40 h-[80%] rounded-t-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-sm">local_gas_station</span>
              </div>
              <span className="text-xl font-black tracking-tighter text-white uppercase">TURUCSAC</span>
            </div>
            <p className="text-slate-500 text-sm font-medium">© 2026 TURUCSAC ERP. Todos los derechos reservados.</p>
          </div>
          <div className="flex items-center gap-8 text-xs font-black uppercase tracking-widest text-slate-500">
            <a href="#" className="hover:text-white transition-colors">Seguridad</a>
            <a href="#" className="hover:text-white transition-colors">Infraestructura</a>
            <a href="#" className="hover:text-white transition-colors">Soporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
