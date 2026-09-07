import React, { useState } from 'react';
import SidebarGym from '../../components/SidebarGym';

const GymConfiguracion = () => {
  const user = JSON.parse(sessionStorage.getItem('usuario') || '{}');
  const isAdmin = user.rol === 'admin';

  const [config, setConfig] = useState({
    nombre: 'Centro Deportivo TURUCSAC',
    ruc: '20500000001',
    direccion: 'Av. Deportiva 123, Lima',
    telefono: '01-456-7890',
    email: 'gym@turucsac.pe',
    apertura: '05:00',
    cierre: '23:00',
    capacidad: '150',
    moneda: 'PEN',
    avisoVencimiento: '5',
  });

  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const fields = [
    { section: 'Identidad del Negocio', items: [
      { label: 'Nombre del Gimnasio', key: 'nombre', type: 'text' },
      { label: 'RUC / Identificación Fiscal', key: 'ruc', type: 'text' },
      { label: 'Dirección', key: 'direccion', type: 'text' },
      { label: 'Teléfono de Contacto', key: 'telefono', type: 'text' },
      { label: 'Correo Electrónico', key: 'email', type: 'email' },
    ]},
    { section: 'Operación', items: [
      { label: 'Hora de Apertura', key: 'apertura', type: 'time' },
      { label: 'Hora de Cierre', key: 'cierre', type: 'time' },
      { label: 'Capacidad Máxima (personas)', key: 'capacidad', type: 'number' },
    ]},
    { section: 'Facturación y Alertas', items: [
      { label: 'Moneda', key: 'moneda', type: 'text' },
      { label: 'Días de aviso antes de vencimiento', key: 'avisoVencimiento', type: 'number' },
    ]},
  ];

  return (
    <div className="min-h-screen flex bg-[var(--surface)]">
      <SidebarGym />
      <main className="flex-1 md:ml-64 pt-24 pb-12 px-10 max-w-7xl mx-auto space-y-12">

        <header className="flex items-end justify-between border-b-[3px] border-primary pb-6">
          <div>
            <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">Administración del Sistema</h1>
            <h2 className="text-5xl font-black tracking-tighter text-[var(--on-secondary-fixed)] uppercase">Configuración</h2>
          </div>
          {saved && (
            <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500/10 text-emerald-600 font-black text-[10px] tracking-widest uppercase animate-fade-in shadow-sm">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              Cambios Guardados
            </div>
          )}
        </header>

        {!isAdmin && (
          <div className="p-6 rounded-2xl border flex items-center gap-4 bg-error/5 border-error/20">
            <span className="material-symbols-outlined text-error text-2xl font-black">lock</span>
            <p className="text-[11px] font-black text-error uppercase tracking-widest leading-tight">Solo los administradores pueden modificar la configuración del sistema.</p>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          {fields.map(section => (
            <div key={section.section} className="paper-lowest rounded-[2.5rem] p-8 space-y-6 shadow-[0_4px_32px_rgba(11,29,45,0.01)] border border-transparent hover:border-primary/10 transition-all">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] pb-4 border-b border-[var(--surface-container)] text-primary">
                {section.section}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {section.items.map(f => (
                  <div key={f.key} className="flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-1">{f.label}</label>
                    <input
                      type={f.type}
                      value={config[f.key]}
                      onChange={e => isAdmin && setConfig({...config, [f.key]: e.target.value})}
                      disabled={!isAdmin}
                      className="h-12 paper-nested rounded-xl px-4 font-black transition-all focus:ring-2 ring-primary/20 disabled:opacity-30 disabled:cursor-not-allowed uppercase text-sm tracking-tight"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Info section */}
          <div className="paper-lowest rounded-[2.5rem] p-8 shadow-[0_4px_32px_rgba(11,29,45,0.01)] border border-transparent hover:border-primary/10 transition-all">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] pb-4 border-b border-[var(--surface-container)] mb-8 text-primary">
              Información del Sistema
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Versión del Sistema', value: 'Gimnasio v1.0' },
                { label: 'Módulo', value: 'Centro Deportivo' },
                { label: 'Plataforma', value: 'TURUCSAC ERP' },
                { label: 'Usuario Activo', value: user.nombre_completo || '—' },
              ].map(info => (
                <div key={info.label} className="p-5 rounded-2xl bg-primary/5 group hover:bg-primary transition-all">
                  <p className="text-[9px] font-black uppercase tracking-widest text-primary/60 mb-1 group-hover:text-white/60 transition-colors">{info.label}</p>
                  <p className="text-[11px] font-black text-[var(--on-secondary-fixed)] uppercase tracking-tight group-hover:text-white transition-colors">{info.value}</p>
                </div>
              ))}
            </div>
          </div>

          {isAdmin && (
            <div className="flex justify-end pt-4">
              <button type="submit" className="btn-azure px-12 py-5 uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-primary/30">
                Guardar Configuración
              </button>
            </div>
          )}
        </form>
      </main>
    </div>
  );
};

export default GymConfiguracion;
