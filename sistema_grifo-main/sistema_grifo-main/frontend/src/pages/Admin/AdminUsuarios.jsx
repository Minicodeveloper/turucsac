import React, { useState, useEffect, useCallback } from 'react';
import SidebarAdmin from '../../components/SidebarAdmin';
import { userService } from '../../services/api';

const AdminUsuarios = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ nro_documento: '', nombre_completo: '', password: '', rol: 'CAJERO', empresa_id: '' });
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState('');

  const currentUser = JSON.parse(sessionStorage.getItem('usuario') || '{}');

  const applyUserList = useCallback((resp) => {
    if (resp.success) {
      setUsers(resp.data);
      const availableCompanies = resp.companies || [];
      setCompanies(availableCompanies);
      if (availableCompanies.length === 1) {
        setFormData(current => ({
          ...current,
          empresa_id: current.empresa_id || String(availableCompanies[0].id)
        }));
      }
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      applyUserList(await userService.getUsers());
    } catch (err) {
      console.error(err);
    }
  }, [applyUserList]);

  useEffect(() => {
    let mounted = true;
    userService.getUsers()
      .then(resp => { if (mounted) applyUserList(resp); })
      .catch(err => { if (mounted) console.error(err); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [applyUserList]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        ...formData,
        rol: (formData.rol || 'CAJERO').trim().toUpperCase()
      };

      const resp = await userService.createUser(payload);
      if (resp.success) {
        setIsModalOpen(false);
        setFormData({ nro_documento: '', nombre_completo: '', password: '', rol: 'CAJERO', empresa_id: '' });
        fetchUsers();
      } else { 
        setError(resp.message || 'Error en validación'); 
      }
    } catch (err) { 
      setError(err.response?.data?.message || 'No se pudo conectar con el servidor.');
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (id === currentUser.id) return alert('Imposible auto-eliminación.');
    if (window.confirm(`¿Confirmar baja de "${name}"?`)) {
      try {
        const resp = await userService.deleteUser(id);
        if (resp.success) fetchUsers();
        else alert(resp.message);
      } catch {
        alert('Error operativo'); 
      }
    }
  };

  // Helper para obtener el rol estandarizado en minúsculas
  const getNormalizedRole = (role) => (role || 'CAJERO').toString().trim().toUpperCase();

  // Colores por rol
  const rolColor = {
    SUPER_ADMIN: 'var(--color-primary)',
    ADMIN_EMPRESA: '#8B5CF6',
    CAJERO: 'var(--color-on-surface-variant)',
    SUPERVISOR: '#F59E0B'
  };

  // Nombres legibles en pantalla
  const rolLabel = {
    SUPER_ADMIN: 'Super administrador',
    ADMIN_EMPRESA: 'Administrador de empresa',
    SUPERVISOR: 'Supervisor',
    CAJERO: 'Cajero'
  };

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
            className="flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-black text-xs tracking-widest uppercase transition-all hover:scale-105 active:scale-95 bg-[var(--color-primary)] shadow-[0_8px_24px_rgba(0,174,239,0.2)] cursor-pointer"
          >
            <span className="material-symbols-outlined text-white">person_add</span>
            Nuevo Integrante
          </button>
        </header>

        {/* Summary pills con filtrado normalizado */}
        <div className="flex flex-wrap gap-4">
          {[
            { label: 'Total Usuarios', value: users.length, color: 'var(--color-on-surface-variant)' },
            { label: 'Administradores', value: users.filter(u => ['SUPER_ADMIN', 'ADMIN_EMPRESA', 'ADMIN'].includes(getNormalizedRole(u.rol))).length, color: 'var(--color-primary)' },
            { label: 'Cajeros', value: users.filter(u => getNormalizedRole(u.rol) === 'CAJERO').length, color: 'var(--color-on-surface-variant)' },
            { label: 'Supervisores', value: users.filter(u => getNormalizedRole(u.rol) === 'SUPERVISOR').length, color: '#F59E0B' },
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
                  {['Documento', 'Nombre Completo', 'Rol Asignado', 'Alta de Cuenta', 'Gestión'].map(h => (
                    <th key={h} className="py-5 px-8 text-[10px] font-black tracking-widest uppercase text-[var(--color-on-surface-variant)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-20 text-center text-[var(--color-outline-variant)]">
                      <span className="material-symbols-outlined animate-spin text-4xl">sync</span>
                    </td>
                  </tr>
                ) : users.map(userItem => {
                  const roleKey = getNormalizedRole(userItem.rol);
                  const color = rolColor[roleKey] || 'var(--color-outline-variant)';
                  const label = rolLabel[roleKey] || userItem.rol;

                  return (
                    <tr key={userItem.id} className="transition-colors hover:bg-[var(--color-surface-container-low)]/50 border-b border-[var(--color-outline-variant)]/5">
                      <td className="py-5 px-8 font-black text-[var(--color-primary)] text-lg tracking-tighter">{userItem.nro_documento}</td>
                      <td className="py-5 px-8 font-black text-[var(--color-on-secondary-fixed)] uppercase tracking-tight">{userItem.nombre_completo}</td>
                      <td className="py-5 px-8">
                        <span 
                          className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border"
                          style={{ 
                            backgroundColor: `${color}15`, 
                            color: color,
                            borderColor: `${color}30`
                          }}
                        >
                          {label}
                        </span>
                      </td>
                      <td className="py-5 px-8 text-sm font-bold text-[var(--color-on-surface-variant)]">
                        {userItem.created_at ? new Date(userItem.created_at).toLocaleDateString('es-PE') : '—'}
                      </td>
                      <td className="py-5 px-8">
                        {userItem.id != 1 && userItem.id != currentUser.id && (
                          <button 
                            onClick={() => handleDeleteUser(userItem.id, userItem.nombre_completo)}
                            className="p-2.5 rounded-xl hover:bg-red-500/10 text-[var(--color-outline-variant)] hover:text-red-500 transition-all cursor-pointer"
                            title="Eliminar usuario"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="w-10 h-10 rounded-full text-[var(--color-outline-variant)] hover:text-[var(--color-on-secondary-fixed)] hover:bg-[var(--color-surface-container-low)] flex items-center justify-center transition-all cursor-pointer"
              >
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
                  <input 
                    type={f.type} 
                    value={formData[f.key]} 
                    onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                    className="h-12 rounded-xl px-4 font-bold text-[var(--color-on-secondary-fixed)] outline-none border border-[var(--color-outline-variant)]/30 focus:ring-2 focus:ring-[var(--color-primary)]/10 bg-[var(--color-surface-container-low)]"
                    required 
                  />
                </div>
              ))}

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-on-surface-variant)] ml-1">Rol</label>
                <select 
                  value={formData.rol} 
                  onChange={e => setFormData({ ...formData, rol: e.target.value })}
                  className="h-12 rounded-xl px-4 font-bold text-[var(--color-on-secondary-fixed)] outline-none cursor-pointer border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-low)]"
                >
                  {getNormalizedRole(currentUser.rol || currentUser.role) === 'SUPER_ADMIN' && (
                    <option value="ADMIN_EMPRESA">Administrador de empresa</option>
                  )}
                  <option value="SUPERVISOR">Supervisor</option>
                  <option value="CAJERO">Cajero</option>
                </select>
              </div>

              {getNormalizedRole(currentUser.rol || currentUser.role) === 'SUPER_ADMIN' && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-on-surface-variant)] ml-1">Empresa</label>
                  <select
                    value={formData.empresa_id}
                    onChange={e => setFormData({ ...formData, empresa_id: e.target.value })}
                    className="h-12 rounded-xl px-4 font-bold text-[var(--color-on-secondary-fixed)] outline-none cursor-pointer border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-low)]"
                    required
                  >
                    <option value="">Seleccione una empresa</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>{company.razon_social}</option>
                    ))}
                  </select>
                </div>
              )}

              {error && <p className="text-red-500 text-[10px] font-black uppercase text-center">{error}</p>}

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="h-14 rounded-2xl font-black text-[10px] tracking-widest uppercase text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)] transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="h-14 rounded-2xl text-white font-black text-[10px] tracking-widest uppercase transition-all hover:scale-105 bg-[var(--color-primary)] shadow-[0_4px_16px_rgba(0,174,239,0.2)] cursor-pointer"
                >
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsuarios;