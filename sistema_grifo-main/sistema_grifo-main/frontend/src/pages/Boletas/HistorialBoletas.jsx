import React, { useEffect, useState, useMemo } from 'react';
import Sidebar from '../../components/Sidebar';
import api, { salesService } from '../../services/api';

const HistorialBoletas = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros ERP
  const [filtroTexto, setFiltroTexto] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('TODOS');

  // Estado para modal de confirmación simple
  const [saleToDelete, setSaleToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const resp = await salesService.getAll();
      if (resp && resp.success) {
        setSales(resp.data || []);
      }
    } catch (err) {
      console.error('Error al cargar ventas:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPEN = (val) => {
    const num = Number(val) || 0;
    return num.toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Filtrado en memoria
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const matchText =
        (s.ticket_id || '').toLowerCase().includes(filtroTexto.toLowerCase()) ||
        (s.nombre_producto || '').toLowerCase().includes(filtroTexto.toLowerCase()) ||
        (`${s.serie || ''}-${s.correlativo || ''}`).toLowerCase().includes(filtroTexto.toLowerCase());

      const matchTipo =
        tipoFiltro === 'TODOS' ||
        (tipoFiltro === 'BOLETA' && (s.serie || '').startsWith('B')) ||
        (tipoFiltro === 'FACTURA' && (s.serie || '').startsWith('F'));

      return matchText && matchTipo;
    });
  }, [sales, filtroTexto, tipoFiltro]);

  const totalEmitido = useMemo(() => {
    return filteredSales.reduce((acc, curr) => acc + Number(curr.monto_total || 0), 0);
  }, [filteredSales]);

  // Manejador de descarga directa para PDF, XML y CDR
  const handleDownloadFile = (sale, tipo = 'pdf') => {
    const backendBase = (api.defaults.baseURL || import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
    const param = sale.ticket_id 
      ? `ticket_id=${encodeURIComponent(sale.ticket_id)}` 
      : `id=${sale.id}`;

    const url = `${backendBase}/descargar_ticket.php?${param}&tipo=${tipo}`;

    if (tipo === 'pdf') {
      window.open(url, '_blank');
    } else {
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${tipo}_${sale.ticket_id || sale.id}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Función para eliminar la boleta seleccionada
  const confirmarEliminarBoleta = async () => {
    if (!saleToDelete) return;
    setDeleting(true);
    try {
      const idBorrar = saleToDelete.id || saleToDelete.ticket_id;
      const resp = await api.delete(`/sales.php?id=${idBorrar}`);
      
      if (resp && resp.data && resp.data.success) {
        // Remover de la tabla de inmediato
        setSales((prev) => prev.filter((s) => s.id !== saleToDelete.id));
        setSaleToDelete(null);
      } else {
        alert(resp?.data?.message || 'No se pudo eliminar el comprobante.');
      }
    } catch (err) {
      console.error('Error al eliminar boleta:', err);
      alert('Error en el servidor al intentar eliminar la boleta.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f4f7f9] text-slate-800 text-xs font-sans">
      <Sidebar />

      <main className="flex-1 md:ml-60 p-4 flex flex-col gap-3">
        {/* Cabecera Principal ERP */}
        <header className="bg-[#24a0ed] text-white px-4 py-2.5 rounded flex justify-between items-center shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-black tracking-wider text-sm uppercase">TURUCSAC &gt;&gt;</span>
            <span className="text-[11px] font-bold text-sky-100 uppercase">
              FACTURACIÓN ELECTRÓNICA - HISTORIAL DE COMPROBANTES
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-sky-800/50 px-2.5 py-1 rounded font-mono font-bold">
              {filteredSales.length} Documentos
            </span>
            <button
              type="button"
              onClick={fetchSales}
              title="Actualizar bandeja"
              className="bg-sky-800/40 hover:bg-sky-800/60 p-1 rounded text-white transition-colors cursor-pointer"
            >
              <span className={`material-symbols-outlined text-base ${loading ? 'animate-spin' : ''}`}>sync</span>
            </button>
          </div>
        </header>

        {/* Barra de Filtros y Búsqueda */}
        <div className="bg-white p-2.5 rounded border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <label className="font-bold text-slate-600 text-[11px]">Buscar:</label>
              <div className="relative">
                <input
                  type="text"
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                  placeholder="N° Ticket, Serie o Producto..."
                  className="h-7 border border-slate-300 rounded px-2 text-xs font-semibold outline-none w-56 focus:border-[#24a0ed]"
                />
                {filtroTexto && (
                  <button
                    onClick={() => setFiltroTexto('')}
                    className="absolute right-1.5 top-1.5 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <label className="font-bold text-slate-600 text-[11px]">Tipo:</label>
              <select
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value)}
                className="h-7 border border-slate-300 rounded px-2 text-xs font-semibold bg-slate-50 outline-none cursor-pointer"
              >
                <option value="TODOS">TODOS LOS COMPROBANTES</option>
                <option value="BOLETA">BOLETAS (B001)</option>
                <option value="FACTURA">FACTURAS (F001)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded border border-slate-200">
            <span className="font-bold text-slate-600 text-[11px]">Total Filtrado:</span>
            <span className="font-mono font-black text-slate-900 text-xs">
              S/ {formatPEN(totalEmitido)}
            </span>
          </div>
        </div>

        {/* Grilla Contable de Comprobantes */}
        <div className="bg-white rounded border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase text-[10px] font-black tracking-wider">
                  <th className="py-2.5 px-3">Fecha y Hora</th>
                  <th className="py-2.5 px-3">Ticket ID</th>
                  <th className="py-2.5 px-3">Comprobante</th>
                  <th className="py-2.5 px-3">Producto / Variedad</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3 text-center">Estado SUNAT</th>
                  <th className="py-2.5 px-3 text-center">Archivos</th>
                  <th className="py-2.5 px-3 text-center w-12">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="material-symbols-outlined animate-spin text-3xl text-[#24a0ed]">sync</span>
                        <span className="font-bold text-[11px] uppercase">Cargando comprobantes...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-10 text-center text-slate-400 italic">
                      No se encontraron comprobantes emitidos con los criterios actuales.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                      {/* Fecha y Hora */}
                      <td className="py-2 px-3">
                        <div className="flex flex-col leading-tight">
                          <span className="font-bold text-slate-800">
                            {new Date(sale.fecha_venta).toLocaleDateString('es-PE')}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(sale.fecha_venta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>

                      {/* Ticket */}
                      <td className="py-2 px-3 font-mono font-bold text-slate-700">
                        {sale.ticket_id || `#${sale.id}`}
                      </td>

                      {/* Serie / Correlativo */}
                      <td className="py-2 px-3 font-mono font-bold text-[#24a0ed]">
                        {sale.serie || 'B001'}-{sale.correlativo || sale.id}
                      </td>

                      {/* Producto */}
                      <td className="py-2 px-3 font-bold text-slate-700 uppercase">
                        {sale.nombre_producto || 'COMBUSTIBLE'}
                      </td>

                      {/* Monto */}
                      <td className="py-2 px-3 text-right font-mono font-black text-slate-900">
                        S/ {formatPEN(sale.monto_total)}
                      </td>

                      {/* SUNAT */}
                      <td className="py-2 px-3 text-center">
                        {sale.sunat_codigo ? (
                          <span
                            title={sale.sunat_mensaje || 'Comprobante procesado'}
                            className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300"
                          >
                            {sale.sunat_codigo} ACEPTADO
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            PENDIENTE
                          </span>
                        )}
                      </td>

                      {/* Botones de Descarga */}
                      <td className="py-2 px-3 text-center">
                        <div className="flex justify-center items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDownloadFile(sale, 'pdf')}
                            className="px-2 py-0.5 bg-[#24a0ed] hover:bg-sky-600 text-white rounded font-mono font-bold text-[10px] transition-colors flex items-center gap-0.5 shadow-xs cursor-pointer"
                            title="Descargar comprobante en PDF"
                          >
                            <span className="material-symbols-outlined text-[11px]">download</span>
                            PDF
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadFile(sale, 'xml')}
                            className="px-2 py-0.5 bg-slate-700 hover:bg-slate-800 text-white rounded font-mono font-bold text-[10px] transition-colors flex items-center gap-0.5 shadow-xs cursor-pointer"
                            title="Descargar XML firmado SUNAT"
                          >
                            <span className="material-symbols-outlined text-[11px]">code</span>
                            XML
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadFile(sale, 'cdr')}
                            className="px-2 py-0.5 bg-slate-500 hover:bg-slate-600 text-white rounded font-mono font-bold text-[10px] transition-colors flex items-center gap-0.5 shadow-xs cursor-pointer"
                            title="Descargar Constancia de Recepción SUNAT (CDR)"
                          >
                            <span className="material-symbols-outlined text-[11px]">inventory_2</span>
                            CDR
                          </button>
                        </div>
                      </td>

                      {/* Botón Eliminar Comprobante */}
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setSaleToDelete(sale)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Eliminar este comprobante"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal de confirmación para eliminar la boleta */}
      {saleToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded border border-slate-200 shadow-xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="bg-rose-600 text-white px-4 py-2.5 flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wide flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">warning</span>
                Eliminar Comprobante
              </span>
              <button
                type="button"
                onClick={() => setSaleToDelete(null)}
                className="text-white hover:text-rose-200"
              >
                ✕
              </button>
            </div>

            <div className="p-4 flex flex-col gap-3">
              <p className="text-slate-700 text-xs leading-relaxed">
                ¿Estás seguro de que deseas eliminar la boleta{' '}
                <b className="font-mono text-slate-900">
                  {saleToDelete.serie || 'B001'}-{saleToDelete.correlativo || saleToDelete.id}
                </b>{' '}
                ({saleToDelete.ticket_id}) por el monto de{' '}
                <b className="text-slate-900">S/ {formatPEN(saleToDelete.monto_total)}</b>?
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSaleToDelete(null)}
                  className="px-3 py-1.5 rounded border border-slate-300 font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmarEliminarBoleta}
                  disabled={deleting}
                  className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors cursor-pointer text-xs flex items-center gap-1"
                >
                  {deleting ? (
                    <span className="material-symbols-outlined animate-spin text-[14px]">sync</span>
                  ) : (
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                  )}
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistorialBoletas;