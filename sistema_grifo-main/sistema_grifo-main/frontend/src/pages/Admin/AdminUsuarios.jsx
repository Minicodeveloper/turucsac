import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../components/SidebarAdmin';
import { userService } from '../../services/api';

const AdminUsuarios = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ nro_documento: '', nombre_completo: '', password: '', rol: 'cajero' });
  const [error, setError] = useState('');

  const currentUser = JSON.parse(sessionStorage.getItem('usuario') || '{}');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const resp = await userService.getUsers();
      if (resp.success) setUsers(resp.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const resp = await userService.createUser(formData);
      if (resp.success) {
        setIsModalOpen(false);
        setFormData({ nro_documento: '', nombre_completo: '', password: '', rol: 'cajero' });
        fetchUsers();
      } else { setError(resp.message || 'Error en validación'); }
    } catch (err) { setError('Error en sistema'); }
  };

  const handleDeleteUser = async (id, name) => {
    if (id === currentUser.id) return alert('Imposible auto-eliminación.');
    if (window.confirm(`¿Confirmar baja de "${name}"?`)) {
      try {
        const resp = await userService.deleteUser(id);
        if (resp.success) fetchUsers();
        else alert(resp.message);
      } catch (err) { alert('Error operativo'); }
    }
  };

  const rolColor = { admin: 'var(--color-primary)', cajero: 'var(--color-on-surface-variant)', supervisor: '#F59E0B' };

  return (
    <div className="min-h-screen flex bg-[var(--color-surface)]">
      <SidebarAdmin />
      <main className="flex-1 md:ml-64 pt-24 pb-12 px-10 max-w-7xl mx-auto space-y-10">

        {/* Header */}
        <header className="flex items-end justify-between pb-6 border-b-2 border-[var(--color-primary)]/10">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-primary)] mb-1">Panel Administrativo</p>
            <h1 className="text-5xl font-black tracking-tighter text-[var(--color-on-secondary-fixed)]">Gestión de Usuarios</h1>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-black text-xs tracking-widest uppercase transition-all hover:scale-105 active:scale-95 bg-[var(--color-primary)] shadow-[0_8px_24px_rgba(0,174,239,0.2)]"
          >
            <span className="material-symbols-outlined text-white">person_add</span>
            Nuevo Integrante
          </button>
        </header>

        {/* Summary pills */}
        <div className="flex flex-wrap gap-4">
          {[
            { label: 'Total Usuarios', value: users.length, color: 'var(--color-on-surface-variant)' },
            { label: 'Administradores', value: users.filter(u => u.rol === 'admin').length, color: 'var(--color-primary)' },
            { label: 'Cajeros', value: users.filter(u => u.rol === 'cajero').length, color: 'var(--color-on-surface-variant)' },
            { label: 'Supervisores', value: users.filter(u => u.rol === 'supervisor').length, color: '#F59E0B' },
          ].map(k => (
            <div key={k.label} className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/20 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-outline-variant)]">{k.label}</p>
              <p className="text-xl font-black" style={{ color: k.color }}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-[2.5rem] bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/20 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[var(--color-surface-container-low)] border-b border-[var(--color-outline-variant)]/10">
                  {['Documento', 'Nombre Completo', 'Rol', 'Alta de Cuenta', 'Gestión'].map(h => (
                    <th key={h} className="py-5 px-8 text-[10px] font-black tracking-widest uppercase text-[var(--color-on-surface-variant)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="py-20 text-center text-[var(--color-outline-variant)]">
                    <span className="material-symbols-outlined animation-spin text-4xl">sync</span>
                  </td></tr>
                ) : users.map(user => (
                  <tr key={user.id} className="transition-colors hover:bg-[var(--color-surface-container-low)]/50 border-b border-[var(--color-outline-variant)]/5">
                    <td className="py-5 px-8 font-black text-[var(--color-primary)] text-lg tracking-tighter">{user.nro_documento}</td>
                    <td className="py-5 px-8 font-black text-[var(--color-on-secondary-fixed)] uppercase tracking-tight">{user.nombre_completo}</td>
                    <td className="py-5 px-8">
                      <span className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest" style={{ background: `${rolColor[user.rol] || 'var(--color-outline-variant)'}15`, color: rolColor[user.rol] || 'var(--color-on-surface-variant)' }}>
                        {user.rol}
                      </span>
                    </td>
                    <td className="py-5 px-8 text-sm font-bold text-[var(--color-on-surface-variant)]">{new Date(user.created_at).toLocaleDateString('es-PE')}</td>
                    <td className="py-5 px-8">
                      {user.id != 1 && user.id != currentUser.id && (
                        <button onClick={() => handleDeleteUser(user.id, user.nombre_completo)}
                          className="p-2.5 rounded-xl hover:bg-red-500/10 text-[var(--color-outline-variant)] hover:text-red-500 transition-all">
                          <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50 backdrop-blur-xl">
          <div className="p-10 rounded-[3rem] shadow-2xl w-full max-w-sm bg-white border border-[var(--color-outline-variant)]/20">
            <header className="mb-8 flex items-end justify-between pb-6 border-b border-[var(--color-outline-variant)]/10">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-primary)] mb-1">Registro de Acceso</h4>
                <h3 className="text-3xl font-black tracking-tighter text-[var(--color-on-secondary-fixed)]">Nuevo Usuario</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full text-[var(--color-outline-variant)] hover:text-[var(--color-on-secondary-fixed)] hover:bg-[var(--color-surface-container-low)] flex items-center justify-center transition-all">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </header>

            <form onSubmit={handleCreateUser} className="space-y-4">
              {[
                { label: 'Nro. Documento', key: 'nro_documento', type: 'text' },
                { label: 'Nombre Completo', key: 'nombre_completo', type: 'text' },
                { label: 'Contraseña', key: 'password', type: 'password' },
              ].map(f => (
                <div key={f.key} className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-on-surface-variant)] ml-1">{f.label}</label>
                  <input type={f.type} value={formData[f.key]} onChange={e => setFormData({...formData, [f.key]: e.target.value})}
                    className="h-12 rounded-xl px-4 font-bold text-[var(--color-on-secondary-fixed)] outline-none border border-[var(--color-outline-variant)]/30 focus:ring-2 focus:ring-[var(--color-primary)]/10 bg-[var(--color-surface-container-low)]"
                    required />
                </div>
              ))}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-on-surface-variant)] ml-1">Rol</label>
                <select value={formData.rol} onChange={e => setFormData({...formData, rol: e.target.value})}
                  className="h-12 rounded-xl px-4 font-bold text-[var(--color-on-secondary-fixed)] outline-none cursor-pointer border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-low)]">
                  <option value="cajero">Cajero</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              {error && <p className="text-red-500 text-[10px] font-black uppercase text-center">{error}</p>}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="h-14 rounded-2xl font-black text-[10px] tracking-widest uppercase text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)] transition-all">Cancelar</button>
                <button type="submit"
                  className="h-14 rounded-2xl text-white font-black text-[10px] tracking-widest uppercase transition-all hover:scale-105 bg-[var(--color-primary)] shadow-[0_4px_16px_rgba(0,174,239,0.2)]">Crear Usuario</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsuarios;
