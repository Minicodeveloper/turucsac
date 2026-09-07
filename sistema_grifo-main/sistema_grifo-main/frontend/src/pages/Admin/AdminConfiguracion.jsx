import React, { useState } from 'react';
import SidebarAdmin from '../../components/SidebarAdmin';

const AdminConfiguracion = () => {
  const user = JSON.parse(sessionStorage.getItem('usuario') || '{}');

  const [config, setConfig] = useState({
    nombre_empresa: 'TURUCSAC',
    ruc: '20500000001',
    direccion: 'Av. Principal 123, Lima',
    telefono: '01-234-5678',
    email: 'admin@turucsac.pe',
    moneda: 'PEN',
    zona_horaria: 'America/Lima',
    modulo_grifo: true,
    modulo_gimnasio: true,
  });

  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggle = (key) => setConfig(c => ({ ...c, [key]: !c[key] }));

  const inputClass = "h-12 rounded-xl px-4 font-bold text-[var(--color-on-secondary-fixed)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10 w-full bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/30";
  const labelClass = "text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-on-surface-variant)] ml-1 block mb-1";

  return (
    <div className="min-h-screen flex bg-[var(--color-surface)]">
      <SidebarAdmin />
      <main className="flex-1 md:ml-64 pt-24 pb-12 px-10 max-w-4xl mx-auto space-y-10">

        {/* Header */}
        <header className="flex items-end justify-between pb-6 border-b-2 border-[var(--color-primary)]/10">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-primary)] mb-1">Panel Administrativo</p>
            <h1 className="text-5xl font-black tracking-tighter text-[var(--color-on-secondary-fixed)]">Configuración</h1>
          </div>
          {saved && (
            <div className="flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 shadow-sm animate-bounce">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              Cambios guardados
            </div>
          )}
        </header>

        <form onSubmit={handleSave} className="space-y-8">

          {/* Identidad del Negocio */}
          <section className="rounded-[2.5rem] p-8 space-y-6 paper-lowest border border-[var(--color-outline-variant)]/20 shadow-sm">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-primary)] pb-4 border-b border-[var(--color-outline-variant)]/10">
              Identidad del Negocio
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { label: 'Nombre de la Empresa', key: 'nombre_empresa', type: 'text' },
                { label: 'RUC / Tax ID', key: 'ruc', type: 'text' },
                { label: 'Dirección', key: 'direccion', type: 'text' },
                { label: 'Teléfono', key: 'telefono', type: 'text' },
                { label: 'Email Corporativo', key: 'email', type: 'email' },
                { label: 'Moneda', key: 'moneda', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label className={labelClass}>{f.label}</label>
                  <input
                    type={f.type}
                    value={config[f.key]}
                    onChange={e => setConfig({ ...config, [f.key]: e.target.value })}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Módulos Activos */}
          <section className="rounded-[2.5rem] p-8 space-y-6 paper-lowest border border-[var(--color-outline-variant)]/20 shadow-sm">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-primary)] pb-4 border-b border-[var(--color-outline-variant)]/10">
              Módulos del Sistema
            </h2>
            <div className="flex flex-col gap-4">
              {[
                { key: 'modulo_grifo', label: 'Módulo Grifo', desc: 'Sistema de gestión de estación de servicio', icon: 'local_gas_station', color: '#00AEEF' },
                { key: 'modulo_gimnasio', label: 'Módulo Gimnasio', desc: 'Sistema de gestión de centro deportivo', icon: 'fitness_center', color: '#8B5CF6' },
              ].map(mod => (
                <div key={mod.key} className="flex items-center justify-between p-5 rounded-2xl bg-[var(--color-surface-container-low)]/30 border border-[var(--color-outline-variant)]/10">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[var(--color-surface-container-low)]">
                      <span className="material-symbols-outlined text-xl" style={{ color: mod.color }}>{mod.icon}</span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-[var(--color-on-secondary-fixed)] uppercase tracking-tight">{mod.label}</p>
                      <p className="text-xs font-medium text-[var(--color-on-surface-variant)]">{mod.desc}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(mod.key)}
                    className="relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0"
                    style={{ background: config[mod.key] ? 'var(--color-primary)' : 'var(--color-outline-variant)' }}
                  >
                    <span
                      className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300"
                      style={{ left: config[mod.key] ? '28px' : '4px' }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Info del sistema */}
          <section className="rounded-[2.5rem] p-8 paper-lowest border border-[var(--color-outline-variant)]/20 shadow-sm">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-primary)] pb-4 mb-6 border-b border-[var(--color-outline-variant)]/10">
              Información del Sistema
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Versión ERP', value: 'v2.0' },
                { label: 'Plataforma', value: 'React + PHP' },
                { label: 'Admin Activo', value: user.nombre_completo || '—' },
                { label: 'Zona Horaria', value: 'America/Lima' },
              ].map(info => (
                <div key={info.label} className="p-4 rounded-2xl bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/10">
                  <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-outline-variant)] mb-1">{info.label}</p>
                  <p className="text-sm font-black text-[var(--color-on-secondary-fixed)] uppercase tracking-tight">{info.value}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-10 py-4 rounded-2xl text-white font-black text-sm uppercase tracking-widest transition-all hover:scale-105 active:scale-95 bg-[var(--color-primary)] shadow-[0_8px_24px_rgba(0,174,239,0.2)]"
            >
              Guardar Configuración
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default AdminConfiguracion;
