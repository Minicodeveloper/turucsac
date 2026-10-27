import React, { useCallback, useEffect, useState } from 'react';
import { cashClosingService } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import { ROLES, getUserRole } from '../../utils/roles';

const formatPEN = (value) => Number(value || 0).toLocaleString('es-PE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const CierresCaja = () => {
  const user = JSON.parse(sessionStorage.getItem('usuario') || '{}');
  const role = getUserRole(user);
  const isCashier = role === ROLES.CAJERO;
  const [summary, setSummary] = useState(null);
  const [closures, setClosures] = useState([]);
  const [openingAmount, setOpeningAmount] = useState('0.00');
  const [actualCash, setActualCash] = useState('');
  const [justification, setJustification] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const requestPageData = useCallback(async () => {
    const response = isCashier
      ? await cashClosingService.getSummary()
      : await cashClosingService.getHistory();
    if (!response?.success) {
      throw new Error(response?.message || 'No se pudo cargar la información de cierres.');
    }
    return response.data;
  }, [isCashier]);

  useEffect(() => {
    let active = true;
    requestPageData()
      .then((data) => {
        if (!active) return;
        if (isCashier) setSummary(data);
        else setClosures(data || []);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.response?.data?.message || requestError.message || 'Error al consultar cierres de caja.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [isCashier, requestPageData]);

  const expectedCash = Number(openingAmount || 0) + Number(summary?.ventas_efectivo || 0);
  const difference = Number(actualCash || 0) - expectedCash;
  const hasDifference = actualCash !== '' && Math.abs(difference) >= 0.01;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');

    if (actualCash === '' || !Number.isFinite(Number(actualCash)) || Number(actualCash) < 0) {
      setError('Ingresa el efectivo contado con un importe válido.');
      return;
    }
    if (hasDifference && !justification.trim()) {
      setError('Escribe una justificación para la diferencia de caja.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await cashClosingService.create({
        monto_inicial: Number(openingAmount),
        efectivo_real: Number(actualCash),
        justificacion: justification.trim(),
      });
      if (!response?.success) throw new Error(response?.message || 'No se pudo registrar el cierre.');

      setNotice(`Cierre registrado. Diferencia: S/ ${formatPEN(response.data.diferencia)}.`);
      setActualCash('');
      setJustification('');
      const data = await requestPageData();
      setSummary(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Error al registrar el cierre.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      <Sidebar />
      <main className="flex-1 md:ml-60 p-5 sm:p-8">
        <header className="mb-6">
          <p className="text-xs font-black uppercase tracking-widest text-sky-600">TURUCSAC · Caja</p>
          <h1 className="mt-1 text-2xl font-black">
            {isCashier ? 'Cierre de turno' : 'Historial de cierres de caja'}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {isCashier
              ? 'Verifica el efectivo esperado, registra el conteo físico y explica cualquier diferencia.'
              : 'Audita los turnos, medios de pago y diferencias reportadas por los cajeros.'}
          </p>
        </header>

        {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
        {notice && <div role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</div>}

        {loading ? (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Cargando información de caja…</p>
        ) : isCashier ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-black uppercase tracking-wide">Resumen del turno</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4"><dt className="text-slate-500">Ventas en efectivo</dt><dd className="font-bold">S/ {formatPEN(summary?.ventas_efectivo)}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-slate-500">Ventas con tarjeta</dt><dd className="font-bold">S/ {formatPEN(summary?.tarjetas_monto)}</dd></div>
                <div className="flex justify-between gap-4 border-t border-slate-100 pt-3"><dt className="text-slate-700">Efectivo esperado</dt><dd className="font-black text-sky-700">S/ {formatPEN(expectedCash)}</dd></div>
              </dl>
              <p className="mt-4 text-xs text-slate-400">Turno iniciado: {summary?.fecha_inicio || 'Sin cierres anteriores'}</p>
            </section>

            <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-black uppercase tracking-wide">Registrar conteo físico</h2>
              <label className="block text-sm font-semibold">
                Fondo inicial de caja (S/)
                <input
                  type="number" min="0" step="0.01" value={openingAmount}
                  onChange={(event) => setOpeningAmount(event.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
                  required
                />
              </label>
              <label className="block text-sm font-semibold">
                Efectivo contado (S/)
                <input
                  type="number" min="0" step="0.01" value={actualCash}
                  onChange={(event) => setActualCash(event.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
                  required
                />
              </label>
              {hasDifference && (
                <label className="block text-sm font-semibold text-amber-800">
                  Justificación de la diferencia (S/ {formatPEN(difference)})
                  <textarea
                    value={justification}
                    onChange={(event) => setJustification(event.target.value)}
                    maxLength={2000}
                    rows={3}
                    className="mt-1 block w-full rounded-lg border border-amber-300 px-3 py-2 text-slate-800"
                    required
                  />
                </label>
              )}
              <button
                type="submit" disabled={submitting}
                className="w-full rounded-lg bg-sky-600 px-4 py-3 text-sm font-black text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'REGISTRANDO…' : 'REGISTRAR CIERRE'}
              </button>
            </form>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                <tr>
                  <th className="p-3">Fecha</th>
                  {role === ROLES.SUPER_ADMIN && <th className="p-3">Empresa</th>}
                  <th className="p-3">Cajero</th><th className="p-3">Fondo inicial</th>
                  <th className="p-3">Efectivo esperado</th><th className="p-3">Efectivo contado</th>
                  <th className="p-3">Tarjetas</th><th className="p-3">Diferencia</th><th className="p-3">Justificación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {closures.map((closure) => (
                  <tr key={closure.id} className="align-top">
                    <td className="whitespace-nowrap p-3">{closure.fecha_cierre}</td>
                    {role === ROLES.SUPER_ADMIN && <td className="p-3">{closure.empresa_nombre || '—'}</td>}
                    <td className="p-3">{closure.usuario_nombre}</td>
                    <td className="whitespace-nowrap p-3">S/ {formatPEN(closure.monto_inicial)}</td>
                    <td className="whitespace-nowrap p-3">S/ {formatPEN(closure.efectivo_esperado)}</td>
                    <td className="whitespace-nowrap p-3">S/ {formatPEN(closure.efectivo_real)}</td>
                    <td className="whitespace-nowrap p-3">S/ {formatPEN(closure.tarjetas_monto)}</td>
                    <td className={`whitespace-nowrap p-3 font-bold ${Number(closure.diferencia) === 0 ? 'text-emerald-700' : 'text-red-700'}`}>S/ {formatPEN(closure.diferencia)}</td>
                    <td className="max-w-xs whitespace-pre-wrap p-3">{closure.justificacion || '—'}</td>
                  </tr>
                ))}
                {closures.length === 0 && <tr><td colSpan={role === ROLES.SUPER_ADMIN ? 9 : 8} className="p-8 text-center text-slate-500">Aún no hay cierres registrados.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default CierresCaja;
