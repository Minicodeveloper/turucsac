import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { salesService } from '../../services/api';

const HistorialBoletas = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const resp = await salesService.getAll();
        if (resp.success) {
          setSales(resp.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  return (
    <div className="min-h-screen flex bg-[var(--surface)]">
      <Sidebar />
      <main className="flex-1 md:ml-64 pt-24 pb-12 px-10">
        <div className="max-w-7xl mx-auto space-y-8">
          <header className="flex items-end justify-between border-b-[3px] border-[var(--primary-container)] pb-6">
            <div>
              <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--primary-container)] mb-1">Comprobantes</h1>
              <h2 className="text-5xl font-black tracking-tighter text-[var(--on-secondary-fixed)] lowercase first-letter:uppercase">Historial de boletas</h2>
            </div>
          </header>

          <section className="paper-lowest rounded-3xl p-6 overflow-hidden">
            {loading ? (
              <div className="text-[var(--on-surface-variant)] text-sm font-bold">Cargando comprobantes...</div>
            ) : sales.length === 0 ? (
              <div className="text-[var(--on-surface-variant)] text-sm font-bold">No hay comprobantes emitidos aún.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead>
                    <tr className="border-b border-[var(--outline-variant)]/20">
                      <th className="py-3 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">Ticket</th>
                      <th className="py-3 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">Producto</th>
                      <th className="py-3 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">Serie / Correlativo</th>
                      <th className="py-3 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">Monto</th>
                      <th className="py-3 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">Fecha</th>
                      <th className="py-3 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">SUNAT</th>
                      <th className="py-3 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">Archivos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((sale) => (
                      <tr key={sale.id} className="border-b border-[var(--outline-variant)]/10 align-top">
                        <td className="py-4 px-4 text-sm font-bold text-[var(--on-secondary-fixed)]">{sale.ticket_id}</td>
                        <td className="py-4 px-4 text-sm font-medium text-[var(--on-surface-variant)]">{sale.nombre_producto}</td>
                        <td className="py-4 px-4 text-sm font-medium text-[var(--on-surface-variant)]">
                          {sale.serie || 'B001'}-{sale.correlativo || '-'}
                        </td>
                        <td className="py-4 px-4 text-sm font-black text-[var(--primary-container)]">S/ {Number(sale.monto_total || 0).toFixed(2)}</td>
                        <td className="py-4 px-4 text-sm text-[var(--on-surface-variant)]">
                          {new Date(sale.fecha_venta).toLocaleString('es-PE')}
                        </td>
                        <td className="py-4 px-4 text-sm">
                          {sale.sunat_codigo ? (
                            <div className="space-y-1">
                              <span className="inline-block rounded-full bg-emerald-500/15 text-emerald-700 px-2 py-1 text-[10px] font-black uppercase tracking-[0.15em]">
                                {sale.sunat_codigo}
                              </span>
                              <p className="text-[10px] text-[var(--on-surface-variant)]">{sale.sunat_mensaje || 'Comprobante procesado'}</p>
                            </div>
                          ) : (
                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--on-surface-variant)]">Pendiente</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-sm">
                          <div className="flex flex-wrap gap-2">
                            {sale.pdf_path && (
                              <a
                                href={sale.pdf_path}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-full bg-[var(--primary-container)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-white"
                              >
                                PDF
                              </a>
                            )}
                            {sale.sunat_xml_path && (
                              <a
                                href={sale.sunat_xml_path}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-full bg-slate-700 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-white"
                              >
                                XML
                              </a>
                            )}
                            {sale.sunat_cdr_path && (
                              <a
                                href={sale.sunat_cdr_path}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-full bg-slate-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-white"
                              >
                                CDR
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default HistorialBoletas;
