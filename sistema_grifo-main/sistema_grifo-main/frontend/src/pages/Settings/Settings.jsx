import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/api';

const Settings = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ nro_documento: '', nombre_completo: '', password: '', rol: 'cajero' });
  const [error, setError] = useState('');

  const currentUser = JSON.parse(sessionStorage.getItem('usuario') || '{}');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const resp = await userService.getUsers();
      if (resp.success) setUsers(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
      } else {
        setError(resp.message || 'Error en validación');
      }
    } catch (err) {
      setError('Error en sistema');
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (id === currentUser.id) return alert("Imposible auto-eliminación.");
    if (window.confirm(`¿Confirmar baja de "${name}"?`)) {
      try {
        const resp = await userService.deleteUser(id);
        if (resp.success) fetchUsers();
        else alert(resp.message);
      } catch (err) {
        alert("Error operativo");
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--surface)]">
      <Sidebar />
      <main className="flex-1 md:ml-64 pt-24 pb-12 px-10 max-w-7xl mx-auto space-y-12">
        <header className="border-b-[3px] border-[var(--primary-container)] pb-6 space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--primary-container)] mb-1">Autoridad Administrativa</h1>
              <h2 className="text-5xl font-black tracking-tighter text-[var(--on-secondary-fixed)]">Gestión de Equipo</h2>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="btn-azure px-8 py-4 flex items-center gap-3 text-xs tracking-widest uppercase"
            >
              <span className="material-symbols-outlined text-white">person_add</span>
              Nuevo Integrante
            </button>
          </div>

          {/* Accesos rápidos a módulos */}
          <div className="flex flex-wrap gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--outline-variant)] flex items-center mr-2">Ir al módulo:</p>
            <button
              onClick={() => navigate('/panel')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary-container)]/10 text-[var(--primary-container)] hover:bg-[var(--primary-container)]/20 transition-all text-[11px] font-black uppercase tracking-widest"
            >
              <span className="material-symbols-outlined text-[16px]">local_gas_station</span>
              Grifo
            </button>
            <button
              onClick={() => navigate('/gimnasio')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl hover:opacity-90 transition-all text-[11px] font-black uppercase tracking-widest text-white"
              style={{ background: 'rgba(139,92,246,0.15)', color: '#8B5CF6' }}
            >
              <span className="material-symbols-outlined text-[16px]">fitness_center</span>
              Gimnasio
            </button>
            <button
              onClick={() => { sessionStorage.clear(); navigate('/'); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--error)]/10 text-[var(--error)] hover:bg-[var(--error)]/20 transition-all text-[11px] font-black uppercase tracking-widest ml-auto"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              Cerrar Sesión
            </button>
          </div>
        </header>

        <div className="paper-lowest rounded-[2.5rem] shadow-[0_4px_32px_rgba(11,29,45,0.02)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[var(--surface-container-low)] text-[var(--on-surface-variant)]">
                  <th className="py-6 px-10 text-[10px] font-black tracking-widest uppercase">Identificación Operativa</th>
                  <th className="py-6 px-10 text-[10px] font-black tracking-widest uppercase">Nombre Completo</th>
                  <th className="py-6 px-10 text-[10px] font-black tracking-widest uppercase text-center">Nivel de Acceso</th>
                  <th className="py-6 px-10 text-[10px] font-black tracking-widest uppercase text-center">Alta de Usuario</th>
                  <th className="py-6 px-10 text-[10px] font-black tracking-widest uppercase text-center">Gestión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--surface-container)] text-[var(--on-surface-variant)]">
                {loading ? (
                  <tr><td colSpan="5" className="py-20 text-center"><span className="material-symbols-outlined animate-spin text-4xl">sync</span></td></tr>
                ) : users.map((user) => (
                  <tr key={user.id} className="hover:bg-[var(--surface-container-low)] transition-colors group">
                    <td className="py-6 px-10 font-black text-[var(--on-secondary-fixed)] tracking-tighter text-lg">{user.nro_documento}</td>
                    <td className="py-6 px-10">
                       <span className="font-black text-[var(--on-secondary-fixed)] uppercase tracking-tight text-sm">{user.nombre_completo}</span>
                    </td>
                    <td className="py-6 px-10 text-center">
                       <span className={`micro-tag ${user.rol === 'admin' ? 'bg-[var(--primary-container)]/10 text-[var(--primary-container)] font-black' : 'bg-[var(--surface-container-highest)]/30 text-[var(--on-surface-variant)]'}`}>
                         {user.rol}
                       </span>
                    </td>
                    <td className="py-6 px-10 text-center font-bold text-[11px] uppercase tracking-tighter text-[var(--outline-variant)]">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-6 px-10 text-center">
                       {user.id != 1 && user.id != currentUser.id && (
                         <button onClick={() => handleDeleteUser(user.id, user.nombre_completo)} className="p-3 rounded-xl hover:bg-[var(--error)]/10 text-[var(--error)] transition-all">
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

        {/* Modal: Glassmorphism Clinical High-End */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[var(--on-secondary-fixed)]/20 backdrop-blur-[24px]">
             <div className="paper-lowest p-10 rounded-[3rem] shadow-2xl w-full max-w-sm animate-fade-in relative">
                <header className="mb-8 flex items-end justify-between border-b border-[var(--surface-container)] pb-6">
                   <div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--primary-container)] mb-1">Entrada Integrante</h4>
                      <h3 className="text-3xl font-black tracking-tighter text-[var(--on-secondary-fixed)]">Nuevo Acceso</h3>
                   </div>
                   <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full hover:bg-[var(--surface-container-low)] flex items-center justify-center transition-colors">
                      <span className="material-symbols-outlined text-[18px]">close</span>
                   </button>
                </header>
                
                <form onSubmit={handleCreateUser} className="space-y-4">
                   <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-1">Documento d/ Identidad</label>
                      <input type="text" value={formData.nro_documento} onChange={(e) => setFormData({...formData, nro_documento: e.target.value})} className="h-12 paper-nested rounded-xl px-4 font-black" required />
                   </div>
                   <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-1">Nombre Completo Operativo</label>
                      <input type="text" value={formData.nombre_completo} onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})} className="h-12 paper-nested rounded-xl px-4 font-black text-[var(--on-secondary-fixed)] uppercase" required />
                   </div>
                   <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-1">Contraseña d/ Acceso</label>
                      <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="h-12 paper-nested rounded-xl px-4 font-medium" required />
                   </div>
                   <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-1">Rol de Autoridad</label>
                      <select value={formData.rol} onChange={(e) => setFormData({...formData, rol: e.target.value})} className="h-12 paper-nested rounded-xl px-4 font-bold outline-none cursor-pointer">
                        <option value="cajero">Cajero</option>
                        <option value="admin">Administrador</option>
                        <option value="supervisor">Supervisor</option>
                      </select>
                   </div>
                   {error && <p className="text-error text-[9px] font-black uppercase text-center mt-2">{error}</p>}
                   <div className="grid grid-cols-2 gap-4 pt-6">
                      <button type="button" onClick={() => setIsModalOpen(false)} className="h-14 paper-nested rounded-2xl font-black text-[10px] tracking-widest uppercase hover:bg-[var(--surface-container-high)] transition-all">Cancelar</button>
                      <button type="submit" className="h-14 btn-azure uppercase text-[10px] tracking-widest">Crear Acceso</button>
                   </div>
                </form>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Settings;
