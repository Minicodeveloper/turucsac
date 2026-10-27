import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import { customerService } from '../../services/api';
import { ALL_ROLES, ROLES, SUPERVISOR_ROLES, getUserRole, hasRole } from '../../utils/roles';

const Customers = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [companies, setCompanies] = useState([]);
  const [formError, setFormError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [formData, setFormData] = useState({
    documento: '', razon_social: '', direccion: '', telefono: '', email: '', tipo_cliente: 'PERSONA', empresa_id: ''
  });
  
  const user = JSON.parse(sessionStorage.getItem('usuario') || '{}');
  const userRole = getUserRole(user);
  const canCreateCustomers = ALL_ROLES.includes(userRole);
  const canEditCustomers = hasRole(userRole, SUPERVISOR_ROLES);

  const fetchCustomers = useCallback(async () => {
    try {
      const resp = await customerService.getAll();
      if (resp.success) {
        setData(resp.data);
        setLoadError('');
      } else {
        setLoadError(resp.message || 'No se pudo cargar el directorio de clientes.');
      }
    } catch (err) {
      console.error(err);
      setLoadError(err.response?.data?.message || 'No se pudo cargar el directorio de clientes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    customerService.getAll()
      .then((response) => {
        if (!active) return;
        if (response.success) {
          setData(response.data);
        } else {
          setLoadError(response.message || 'No se pudo cargar el directorio de clientes.');
        }
      })
      .catch((error) => {
        console.error('Error al cargar clientes:', error);
        if (active) setLoadError(error.response?.data?.message || 'No se pudo cargar el directorio de clientes.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    if (userRole === ROLES.SUPER_ADMIN) {
      customerService.getCompanies()
        .then((response) => {
          if (active && response.success) setCompanies(response.data || []);
        })
        .catch((error) => {
          console.error('Error al cargar empresas para clientes:', error);
          if (active) setFormError('No se pudo cargar la lista de empresas.');
        });
    }
    return () => { active = false; };
  }, [userRole]);

  const handleSearch = async (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term.length > 2) {
      const resp = await customerService.searchQuery(term);
      if (resp.success) setData(resp.data);
    } else if (term.length === 0) {
      fetchCustomers();
    }
  };

  const openModal = (item = null) => {
    setFormError('');
    if (item) {
      setEditingItem(item);
      setFormData({ ...item });
    } else {
      setEditingItem(null);
      setFormData({
        documento: '', razon_social: '', direccion: '', telefono: '', email: '',
        tipo_cliente: 'PERSONA', empresa_id: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      let resp = editingItem ? await customerService.update(formData) : await customerService.create(formData);
      if (resp.success) {
        setIsModalOpen(false);
        fetchCustomers();
      } else {
        setFormError(resp.message || 'No se pudo guardar el cliente.');
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'No se pudo guardar el cliente.');
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--surface)]">
      <Sidebar />
      <main className="flex-1 md:ml-64 pt-24 pb-12 px-10 max-w-7xl mx-auto space-y-12">
        <header className="flex items-end justify-between border-b-[3px] border-[var(--primary-container)] pb-6">
          <div>
            <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--primary-container)] mb-1">Directorio Central</h1>
            <h2 className="text-5xl font-black tracking-tighter text-[var(--on-secondary-fixed)]">Gestión de Clientes</h2>
          </div>
          {canCreateCustomers && (
          <button 
            onClick={() => openModal()}
            className="btn-azure px-8 py-4 flex items-center gap-3 text-xs tracking-widest uppercase"
          >
            <span className="material-symbols-outlined text-white">person_add</span>
            Altas Cliente
          </button>
          )}
        </header>

        <div className="max-w-md relative">
          <input 
            type="text" placeholder="Buscando por DNI, RUC o Nombre..." value={searchTerm} onChange={handleSearch}
            className="w-full h-12 paper-lowest rounded-xl px-12 outline-none font-bold text-sm text-[var(--on-secondary-fixed)] focus:ring-2 ring-[var(--primary-container)]/10"
          />
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--outline-variant)]">search</span>
        </div>

        {loadError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{loadError}</p>}

        <div className="paper-lowest rounded-[2.5rem] shadow-[0_4px_32px_rgba(11,29,45,0.02)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[var(--surface-container-low)] text-[var(--on-surface-variant)]">
                  <th className="py-6 px-10 text-[10px] font-black tracking-widest uppercase">Identificación</th>
                  <th className="py-6 px-10 text-[10px] font-black tracking-widest uppercase text-right">Razón Social p/ Facturación</th>
                  <th className="py-6 px-10 text-[10px] font-black tracking-widest uppercase text-center">Tipo Entidad</th>
                  <th className="py-6 px-10 text-[10px] font-black tracking-widest uppercase text-center">Contacto Operativo</th>
                  {canEditCustomers && <th className="py-6 px-10 text-[10px] font-black tracking-widest uppercase text-center">Gestión</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--surface-container)] text-[var(--on-surface-variant)]">
                {loading ? (
                  <tr><td colSpan={canEditCustomers ? 5 : 4} className="py-20 text-center"><span className="material-symbols-outlined animate-spin text-4xl">sync</span></td></tr>
                ) : data.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--surface-container-low)] transition-colors group">
                    <td className="py-6 px-10 font-black text-[var(--on-secondary-fixed)] tracking-tighter text-lg">{item.documento}</td>
                    <td className="py-6 px-10 text-right">
                       <span className="font-bold text-[var(--on-secondary-fixed)] uppercase tracking-tight block truncate max-w-xs ml-auto leading-none">{item.razon_social}</span>
                       <span className="text-[10px] font-bold text-[var(--outline-variant)] leading-none mt-1 tracking-tighter uppercase">{item.direccion || 'Sin domicilio fiscal'}</span>
                    </td>
                    <td className="py-6 px-10 text-center">
                       <span className={`micro-tag ${item.tipo_cliente === 'EMPRESA' ? 'bg-[var(--primary-container)]/10 text-[var(--primary-container)]' : 'bg-[var(--surface-container-highest)]/30 text-[var(--on-surface-variant)]'}`}>
                         {item.tipo_cliente}
                       </span>
                    </td>
                    <td className="py-6 px-10 text-center">
                      <div className="flex flex-col items-center text-[11px] font-black tracking-tight text-[var(--on-surface-variant)] uppercase">
                        <span>{item.telefono || '--'}</span>
                        <span className="text-[9px] text-[var(--outline-variant)] uppercase">{item.email || '--'}</span>
                      </div>
                    </td>
                    {canEditCustomers && (
                    <td className="py-6 px-10 text-center">
                       <button onClick={() => openModal(item)} className="p-3 rounded-xl hover:bg-[var(--primary-container)]/10 text-[var(--primary-container)] transition-all">
                         <span className="material-symbols-outlined text-[18px]">edit</span>
                       </button>
                    </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Glassmorphism Clinical High-End */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[var(--on-secondary-fixed)]/20 backdrop-blur-[24px]">
             <div role="dialog" aria-modal="true" aria-labelledby="customer-form-title" className="paper-lowest p-10 rounded-[3rem] shadow-2xl w-full max-w-lg animate-fade-in relative">
                <header className="mb-10 flex items-end justify-between border-b border-[var(--surface-container)] pb-6">
                   <div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--primary-container)] mb-1">Entrada de Datos</h4>
                      <h3 id="customer-form-title" className="text-3xl font-black tracking-tighter text-[var(--on-secondary-fixed)]">Ficha de Cliente</h3>
                   </div>
                   <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full hover:bg-[var(--surface-container-low)] flex items-center justify-center transition-colors">
                      <span className="material-symbols-outlined text-[18px]">close</span>
                   </button>
                </header>
                
                <form onSubmit={handleSave} className="space-y-6">
                   {userRole === ROLES.SUPER_ADMIN && !editingItem && (
                     <div className="flex flex-col gap-1">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-1">Empresa</label>
                       <select
                         value={formData.empresa_id}
                         onChange={(e) => setFormData({ ...formData, empresa_id: e.target.value })}
                         className="h-12 paper-nested rounded-xl px-4 font-bold outline-none"
                         required
                       >
                         <option value="">Selecciona una empresa</option>
                         {companies.map((company) => (
                           <option key={company.id} value={company.id}>{company.razon_social}</option>
                         ))}
                       </select>
                     </div>
                   )}
                   {formError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{formError}</p>}
                   <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-1">Documento (DNI/RUC)</label>
                        <input type="text" value={formData.documento} onChange={(e) => setFormData({...formData, documento: e.target.value})} className="h-12 paper-nested rounded-xl px-4 font-black" required disabled={!!editingItem} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-1">Modalidad de Entidad</label>
                        <select value={formData.tipo_cliente} onChange={(e) => setFormData({...formData, tipo_cliente: e.target.value})} className="h-12 paper-nested rounded-xl px-4 font-bold outline-none cursor-pointer">
                          <option value="PERSONA">Persona</option>
                          <option value="EMPRESA">Empresa</option>
                        </select>
                      </div>
                   </div>
                   <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-1">Denominación / Razón Social</label>
                      <input type="text" value={formData.razon_social} onChange={(e) => setFormData({...formData, razon_social: e.target.value})} className="h-12 paper-nested rounded-xl px-4 font-black text-[var(--on-secondary-fixed)] uppercase" required />
                   </div>
                   <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-1">Domicilio Fiscal</label>
                      <input type="text" value={formData.direccion} onChange={(e) => setFormData({...formData, direccion: e.target.value})} className="h-12 paper-nested rounded-xl px-4 font-medium" />
                   </div>
                   <div className="grid grid-cols-2 gap-4 pt-6">
                      <button type="button" onClick={() => setIsModalOpen(false)} className="h-14 paper-nested rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-[var(--surface-container-high)] transition-all">Cancelar</button>
                      <button type="submit" className="h-14 btn-azure uppercase text-xs">Consolidar Ficha</button>
                   </div>
                </form>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Customers;
