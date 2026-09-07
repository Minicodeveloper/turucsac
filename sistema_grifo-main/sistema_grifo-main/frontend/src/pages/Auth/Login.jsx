import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';

const Login = () => {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await authService.login({ nro_documento: user, password: password });
      if (data.success) {
        localStorage.setItem('token', data.token);
        sessionStorage.setItem('usuario', JSON.stringify(data.user));
        if (data.user && data.user.rol === 'admin') {
          navigate('/admin');
        } else {
          navigate('/modulos');
        }
      } else {
        setError(data.message || 'Autorización denegada');
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Error de comunicación - Verifique XAMPP");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface)] p-6">
      <div className="w-full max-w-sm paper-lowest p-12 rounded-[3rem] shadow-[0_32px_64px_rgba(11,29,45,0.06)] animate-fade-in relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--primary-container)] opacity-[0.03] rounded-bl-full"></div>
        
        <header className="mb-10 text-center">
          <div className="w-12 h-12 bg-[var(--primary-container)] rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-[#00AEEF20]">
             <span className="material-symbols-outlined text-white text-2xl">local_gas_station</span>
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-[var(--on-secondary-fixed)] uppercase">TurucSac</h1>
          <p className="text-[10px] font-black text-[var(--outline-variant)] uppercase tracking-[0.4em] mt-2">Protocolo de Acceso</p>
        </header>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-1">Documento d/ Identidad</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--outline-variant)] text-lg">id_card</span>
              <input 
                type="text" value={user} onChange={(e) => setUser(e.target.value)}
                placeholder="77665544"
                className="w-full h-14 paper-nested rounded-2xl pl-12 pr-4 outline-none font-black text-[var(--on-secondary-fixed)] tracking-tight focus:ring-2 ring-[var(--primary-container)]/10"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-1">Clave de Seguridad</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--outline-variant)] text-lg">verified_user</span>
              <input 
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••"
                className="w-full h-14 paper-nested rounded-2xl pl-12 pr-4 outline-none font-medium text-[var(--on-secondary-fixed)] focus:ring-2 ring-[var(--primary-container)]/10"
              />
            </div>
          </div>

          {error && <p className="text-error text-[10px] font-black text-center uppercase tracking-widest">{error}</p>}

          <button 
            type="submit"
            className="w-full h-16 btn-azure flex items-center justify-center gap-3 text-sm tracking-[0.2em] mt-8"
          >
            <span>INGRESAR</span>
            <span className="material-symbols-outlined text-sm">login</span>
          </button>
        </form>

        <footer className="mt-12 text-center">
          <p className="text-[9px] font-bold text-[var(--outline-variant)] uppercase tracking-widest">Soporte Técnico Especializado v2.0</p>
        </footer>
      </div>
    </div>
  );
};

export default Login;
