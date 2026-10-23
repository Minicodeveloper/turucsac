import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../components/Sidebar';
import api, { posService, customerService } from '../../services/api';
import { jsPDF } from 'jspdf';

const fuels = [
  { id: '84', name: 'Gasolina 84', label: '84', subtext: 'GASOLINA 84', bg: 'bg-[#ff4d6d]', text: 'text-white' },
  { id: 'regular', name: 'Regular', label: 'REGULAR', subtext: 'GASOHOL REGULAR', bg: 'bg-[#00c49f]', text: 'text-white' },
  { id: 'premium', name: 'Premium', label: 'PREMIUM', subtext: 'GASOHOL PREMIUM', bg: 'bg-[#29b6f6]', text: 'text-white' },
  { id: '98', name: '98 Octanos', label: '98', subtext: 'GASOLINA 98', bg: 'bg-[#ffa726]', text: 'text-white' },
  { id: 'diesel', name: 'Diesel', label: 'DIESEL', subtext: 'DIESEL', bg: 'bg-[#546e7a]', text: 'text-white' },
  { id: 'gnv', name: 'GNV', label: 'GNV', subtext: 'G-5', bg: 'bg-white', text: 'text-slate-800', border: 'border border-slate-300' },
  { id: 'glp', name: 'GLP', label: 'GLP', subtext: 'GLP', bg: 'bg-white', text: 'text-slate-800', border: 'border border-slate-300' },
];

const POS = () => {
  const [prices, setPrices] = useState({});
  const [selectedFuel, setSelectedFuel] = useState(fuels[1]);
  const [amount, setAmount] = useState('0.00');
  const [dni, setDni] = useState('');
  const [customerName, setCustomerName] = useState('CLIENTES VARIOS');
  const [isCustomerFound, setIsCustomerFound] = useState(false);
  const [plate, setPlate] = useState('');
  const [docType, setDocType] = useState('Boleta de Venta');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo (Soles)');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    posService.getPrices()
      .then(resp => {
        if (mounted && resp?.success) setPrices(resp.data);
      })
      .catch(err => {
        if (mounted) console.error('Error al cargar precios:', err);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const docClean = dni.trim();
    if (docClean.length !== 8 && docClean.length !== 11) return undefined;

    let mounted = true;
    customerService.searchByDoc(docClean)
      .then(resp => {
        if (!mounted) return;
        if (resp?.success && resp.data) {
          setCustomerName(resp.data.razon_social || resp.data.nombre);
          setIsCustomerFound(true);
          setDocType(docClean.length === 11 ? 'Factura Electrónica' : 'Boleta de Venta');
        } else {
          setCustomerName('CLIENTES VARIOS');
          setIsCustomerFound(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setCustomerName('CLIENTES VARIOS');
          setIsCustomerFound(false);
        }
      });
    return () => { mounted = false; };
  }, [dni]);

  const handleDniChange = (value) => {
    setDni(value);
    setIsCustomerFound(false);
    const docClean = value.trim();
    if (docClean.length === 0) {
      setCustomerName('CLIENTES VARIOS');
    } else if (docClean.length !== 8 && docClean.length !== 11) {
      setCustomerName('CLIENTE LIBRE');
    }
  };

  const currentPrice = useMemo(() => prices[selectedFuel.name] || 16.50, [prices, selectedFuel]);
  const numAmount = parseFloat(amount) || 0;
  const gallons = (numAmount > 0 && currentPrice > 0) ? (numAmount / currentPrice).toFixed(3) : '0.000';

  // Cálculos contables
  const opGravada = useMemo(() => (numAmount / 1.18).toFixed(2), [numAmount]);
  const igvTotal = useMemo(() => (numAmount - parseFloat(opGravada)).toFixed(2), [numAmount, opGravada]);

  // Validaciones antes de emitir
  const validateBeforeProcess = () => {
    setErrorMessage('');
    if (numAmount <= 0) {
      setErrorMessage('⚠️ Ingrese un importe válido en soles mayor a 0.00.');
      return false;
    }
    if (!plate.trim()) {
      setErrorMessage('⚠️ Debe ingresar la PLACA del vehículo para emitir el comprobante.');
      return false;
    }
    if (docType === 'Factura Electrónica' && dni.trim().length !== 11) {
      setErrorMessage('⚠️ Para emitir FACTURA ELECTRÓNICA se requiere un número de RUC válido de 11 dígitos.');
      return false;
    }
    if (docType !== 'Nota de Venta' && dni.trim() && !isCustomerFound) {
      setErrorMessage('⚠️ Registre y seleccione al cliente antes de emitir un comprobante electrónico.');
      return false;
    }
    return true;
  };

  const handleProcessSale = async () => {
    if (!validateBeforeProcess()) return;

    const printWindow = docType === 'Nota de Venta' ? null : window.open('about:blank', '_blank');
    setIsProcessing(true);
    try {
      const resp = await posService.processSale({
        combustible: selectedFuel.name,
        galones: gallons,
        monto: numAmount,
        cliente_dni: dni.trim() || '00000000',
        cliente_nombre: customerName,
        placa: plate.toUpperCase().trim(),
        metodo_pago: paymentMethod,
        tipo_comprobante: docType
      });

      if (resp && resp.success) {
        if (docType === 'Nota de Venta') {
          generateTicket(resp.ticket_id, resp.company, resp.seller);
          alert(`Nota de venta interna guardada: ${resp.ticket_id}. No fue enviada a SUNAT.`);
        } else if (resp.sunat?.success) {
          let pdfOpened = false;
          if (resp.sunat.pdf_disponible) {
            try {
              const response = await api.get(
                `/descargar_ticket.php?ticket_id=${encodeURIComponent(resp.ticket_id)}&tipo=pdf`,
                { responseType: 'blob' }
              );
              const fileUrl = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
              const ticketWindow = printWindow || window.open(fileUrl, '_blank');
              if (printWindow) printWindow.location.href = fileUrl;
              pdfOpened = Boolean(ticketWindow);
              window.setTimeout(() => URL.revokeObjectURL(fileUrl), 60_000);
            } catch (error) {
              printWindow?.close();
              console.error('SUNAT aceptó el comprobante, pero no se pudo abrir el PDF.', error);
            }
          } else {
            printWindow?.close();
          }
          alert(pdfOpened
            ? `Comprobante aceptado por SUNAT: ${resp.sunat.serie}-${resp.sunat.correlativo}`
            : `SUNAT aceptó ${resp.sunat.serie}-${resp.sunat.correlativo}, pero no se pudo abrir el PDF. ${resp.sunat.pdf_error || 'Descárguelo desde el historial.'} No vuelva a emitir esta venta.`);
        } else {
          printWindow?.close();
          alert(`La venta quedó registrada, pero SUNAT no confirmó la emisión. ${resp.sunat?.mensaje || 'Revise el estado en el historial antes de volver a emitir.'}`);
        }
        // Limpiar formulario tras venta exitosa
        setAmount('0.00'); 
        setDni(''); 
        setCustomerName('CLIENTES VARIOS');
        setIsCustomerFound(false);
        setPlate('');
        setErrorMessage('');
      } else {
        printWindow?.close();
        setErrorMessage(resp?.message || 'Error al emitir en el servidor');
      }
    } catch (err) {
      printWindow?.close();
      console.error(err);
      setErrorMessage(err.response?.data?.message || err.message || 'Error de conexión con el backend de facturación');
    } finally {
      setIsProcessing(false);
    }
  };

  // Observación 1: Generación del ticket exactamente con el layout del PDF de referencia
  const generateTicket = (ticketId, company = {}, seller = {}) => {
    const doc = new jsPDF({ format: [80, 210], unit: 'mm' });
    const fechaActual = new Date();
    const fechaHoraStr = `${fechaActual.toLocaleDateString()}, ${fechaActual.toLocaleTimeString()}`;
    const companyName = company.razon_social || 'Empresa no identificada';
    const companyAddress = company.direccion || '';
    const companyRuc = company.ruc || '';
    const sellerName = (seller.nombre_completo || 'NO REGISTRADO').toUpperCase();
    const sellerRole = seller.rol ? ` (${seller.rol.toUpperCase()})` : '';
    const paymentLabel = paymentMethod.trim().toUpperCase() === 'EFECTIVO (SOLES)'
      ? 'EFECTIVO'
      : paymentMethod.trim().toUpperCase();

    const drawDottedLine = (y) => {
      doc.setLineDashPattern([0.8, 0.8], 0);
      doc.line(5, y, 75, y);
      doc.setLineDashPattern([], 0);
    };

    const numeroALetras = (monto) => {
      const entero = Math.floor(monto);
      const centavos = Math.round((monto - entero) * 100).toString().padStart(2, '0');
      return `SON: ${entero} CON ${centavos}/100 SOLES`;
    };

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(doc.splitTextToSize(companyName, 68), 40, 9, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    if (companyAddress) {
      doc.text(doc.splitTextToSize(companyAddress, 68), 40, 15, { align: "center" });
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(`RUC: ${companyRuc}`, 40, 22, { align: "center" });

    const tituloFiscal = docType.toUpperCase();
    doc.text(tituloFiscal, 40, 27, { align: "center" });
    doc.text(ticketId || "TKT", 40, 31, { align: "center" });

    // Bloque Adquiriente
    doc.setFontSize(7.5);
    doc.text("ADQUIRIENTE", 5, 37);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(`L.E/DNI: ${dni.trim() || '00000000'}`, 5, 41);
    doc.text(customerName.toUpperCase(), 5, 45);

    // Metadatos
    doc.setFont("helvetica", "bold");
    doc.text(`FECHA: ${fechaHoraStr}`, 5, 52);
    doc.setFont("helvetica", "normal");
    doc.text(`FORMA PAGO: ${paymentLabel}`, 5, 56);
    doc.text(
      doc.splitTextToSize(`ATENDIDO POR: ${sellerName}${sellerRole}`, 70),
      5,
      60
    );

    // Tabla de Ítems
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    doc.text("DESCRIPCION", 5, 66);
    doc.text("CANT.", 34, 66);
    doc.text("U.M.", 45, 66);
    doc.text("PRECIO", 54, 66);
    doc.text("IMPORTE", 75, 66, { align: "right" });

    drawDottedLine(68);

    doc.setFont("helvetica", "normal");
    doc.text(selectedFuel.name.toUpperCase(), 5, 73);
    doc.text(`${gallons}`, 34, 77);
    doc.text("GLI", 45, 77);
    doc.text(`${currentPrice.toFixed(2)}`, 54, 77);
    doc.text(`${numAmount.toFixed(2)}`, 75, 77, { align: "right" });

    drawDottedLine(80);

    // Total
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("TOTAL S/", 45, 85);
    doc.text(`${numAmount.toFixed(2)}`, 75, 85, { align: "right" });

    drawDottedLine(88);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.text(numeroALetras(numAmount), 40, 92.5, { align: "center" });

    drawDottedLine(95);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(`${paymentLabel} S/ ${numAmount.toFixed(2)}`, 5, 100);

    drawDottedLine(103);

    // Placa
    doc.text(`PLACA: ${plate.toUpperCase().trim() || 'S/P'}`, 5, 108);

    drawDottedLine(111);

    // Una nota de venta no es un comprobante electrónico.
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.text("NOTA DE VENTA INTERNA - NO ES COMPROBANTE SUNAT", 40, 115, { align: "center" });

    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.text("Emitido desde el sistema TURUCSAC", 40, 151, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.text("GRACIAS POR SU PREFERENCIA...", 40, 155, { align: "center" });

    doc.save(`${ticketId || 'ticket'}.pdf`);
  };

  return (
    <div className="min-h-screen flex bg-[#f4f7f9] text-slate-800 text-xs font-sans">
      <Sidebar />

      <main className="flex-1 md:ml-60 p-4 flex flex-col gap-3">
        {/* Cabecera limpia TURUCSAC */}
        <header className="bg-[#24a0ed] text-white px-4 py-2.5 rounded flex justify-between items-center shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-black tracking-wider text-sm uppercase">TURUCSAC &gt;&gt;</span>
            <span className="text-[11px] font-bold text-sky-100 uppercase">ESTACIÓN DE SERVICIO - DESPACHO</span>
          </div>
          <span className="bg-sky-800/40 text-[10px] px-2.5 py-1 rounded font-bold uppercase tracking-wider">
            Terminal Operativo
          </span>
        </header>

        {/* Alerta de validación */}
        {errorMessage && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-2.5 rounded text-xs font-bold flex justify-between items-center shadow-xs">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage('')} className="text-red-600 font-bold px-2 hover:text-red-800">✕</button>
          </div>
        )}

        {/* Botonera de Selección de Combustible */}
        <section className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {fuels.map((f) => {
            const isSelected = selectedFuel.id === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFuel(f)}
                className={`h-16 rounded shadow-xs flex flex-col justify-center items-center cursor-pointer transition-all ${f.bg} ${f.text} ${f.border || ''} ${
                  isSelected ? 'ring-4 ring-cyan-500 font-black scale-[1.02]' : 'opacity-90 hover:opacity-100'
                }`}
              >
                <span className="text-lg font-black tracking-tight">{f.label}</span>
                <span className="text-[9px] uppercase font-semibold">{f.subtext}</span>
              </button>
            );
          })}
        </section>

        {/* Cuerpo Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start flex-1">
          {/* Lado Izquierdo: Datos de la Venta */}
          <div className="lg:col-span-8 bg-white p-4 rounded border border-slate-200 shadow-xs space-y-4">
            
            {/* Observación 2: Combo TIPO DOC */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Tipo Doc (Comprobante)
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="h-9 bg-slate-50 border border-slate-300 rounded px-2.5 font-bold text-xs outline-none focus:border-[#24a0ed]"
                >
                  <option value="Boleta de Venta">Boleta de Venta</option>
                  <option value="Factura Electrónica">Factura Electrónica</option>
                  <option value="Nota de Venta">Nota de Venta</option>
                </select>
              </div>

              {/* Observación 3: Combo MODALIDAD DE PAGO */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Modalidad de Pago
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-9 bg-slate-50 border border-slate-300 rounded px-2.5 font-bold text-xs outline-none focus:border-[#24a0ed]"
                >
                  <option value="Efectivo (Soles)">Efectivo (Soles)</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Yape / Plin">Yape / Plin</option>
                </select>
              </div>
            </div>

            {/* Observación 4: DNI / RUC (Clientes existentes o cliente libre) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Identificación / DNI Cliente
                </label>
                <input
                  type="text"
                  value={dni}
                  onChange={(e) => handleDniChange(e.target.value)}
                  className="h-9 border border-slate-300 rounded px-2.5 font-black text-sm outline-none focus:border-[#24a0ed]"
                  placeholder="DNI (8 dígitos) o RUC (11 dígitos)"
                />
                <div className="flex items-center justify-between mt-0.5 text-[10px]">
                  <span className="font-bold text-slate-600 truncate">{customerName}</span>
                  {isCustomerFound ? (
                    <span className="text-emerald-600 font-extrabold uppercase">✓ Registrado</span>
                  ) : dni.trim() ? (
                    <span className="text-sky-600 font-extrabold uppercase">• Cliente Libre</span>
                  ) : null}
                </div>
              </div>

              {/* Placa Obligatoria */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Placa Vehículo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  className="h-9 border border-slate-300 rounded px-2.5 font-black text-sm uppercase outline-none focus:border-[#24a0ed]"
                  placeholder="ABC-123"
                />
              </div>
            </div>

            {/* Importe de despacho central */}
            <div className="pt-2 border-t border-slate-100 flex flex-col items-center">
              <label className="text-[11px] font-black uppercase tracking-widest text-[#24a0ed] mb-2">
                Importe de Despacho (S/)
              </label>
              
              <div className="relative w-full max-w-sm">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-black text-slate-400">S/</span>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-20 bg-slate-50 border-2 border-slate-200 rounded-xl text-center text-5xl font-black text-slate-900 outline-none focus:border-[#24a0ed] focus:bg-white"
                />
              </div>

              {/* Atajos Rápidos */}
              <div className="flex flex-wrap justify-center gap-2 mt-3">
                {[20, 50, 100, 200].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmount(v.toFixed(2))}
                    className="px-4 py-1.5 rounded bg-slate-100 border border-slate-200 text-xs font-black text-slate-700 hover:bg-[#24a0ed] hover:text-white transition-colors cursor-pointer"
                  >
                    S/ {v}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAmount('250.00')}
                  className="px-5 py-1.5 rounded bg-slate-800 text-white text-xs font-black hover:bg-black transition-colors cursor-pointer"
                >
                  FULL
                </button>
              </div>
            </div>
          </div>

          {/* Lado Derecho: Resumen Tributario y Botón Emitir */}
          <div className="lg:col-span-4 bg-white p-4 rounded border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 pb-2">
              Detalle Consolidado
            </h4>

            <div className="space-y-3 font-semibold text-xs text-slate-600">
              <div className="flex justify-between items-center">
                <span>Variedad:</span>
                <span className="font-black text-slate-900 text-sm">{selectedFuel.name}</span>
              </div>

              <div className="flex justify-between items-center">
                <span>Precio Unitario:</span>
                <span className="font-bold text-slate-800">S/ {currentPrice.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span>Volumen Neto:</span>
                <span className="font-black text-base text-[#24a0ed]">{gallons} <span className="text-[10px]">GL</span></span>
              </div>

              <div className="border-t border-slate-100 pt-2 space-y-1 text-[11px]">
                <div className="flex justify-between items-center text-slate-500">
                  <span>Op. Gravada:</span>
                  <span>S/ {opGravada}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>IGV (18%):</span>
                  <span>S/ {igvTotal}</span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3 flex flex-col items-end">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total a Validar</span>
                <span className="text-4xl font-black text-slate-900 font-mono">S/ {numAmount.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleProcessSale}
              disabled={isProcessing}
              className="w-full h-12 bg-[#00c49f] hover:bg-[#00a887] text-white font-black text-sm uppercase tracking-wider rounded transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? 'PROCESANDO...' : 'EMITIR & IMPRIMIR'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default POS;