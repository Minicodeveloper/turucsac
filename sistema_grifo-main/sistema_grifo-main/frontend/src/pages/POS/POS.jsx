import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../components/Sidebar';
import { posService, customerService } from '../../services/api';
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
    loadPrices();
  }, []);

  // Observación 4: Búsqueda dinámica. Si existe se carga, si no, queda libre
  useEffect(() => {
    const docClean = dni.trim();
    if (docClean.length === 8 || docClean.length === 11) {
      lookupCustomer(docClean);
    } else if (docClean.length === 0) {
      setCustomerName('CLIENTES VARIOS');
      setIsCustomerFound(false);
    } else {
      // Cliente libre digitando su documento
      setCustomerName('CLIENTE LIBRE');
      setIsCustomerFound(false);
    }
  }, [dni]);

  const loadPrices = async () => {
    try {
      const resp = await posService.getPrices();
      if (resp && resp.success) setPrices(resp.data);
    } catch (err) {
      console.error('Error al cargar precios:', err);
    }
  };

  const lookupCustomer = async (doc) => {
    try {
      const resp = await customerService.searchByDoc(doc);
      if (resp && resp.success && resp.data) {
        setCustomerName(resp.data.razon_social || resp.data.nombre);
        setIsCustomerFound(true);
        if (doc.length === 11) {
          setDocType('Factura Electrónica');
        } else {
          setDocType('Boleta de Venta');
        }
      } else {
        // No está en la BD: se permite como cliente libre con su DNI digitado
        setCustomerName('CLIENTES VARIOS');
        setIsCustomerFound(false);
      }
    } catch (err) {
      setCustomerName('CLIENTES VARIOS');
      setIsCustomerFound(false);
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
    return true;
  };

  const handleProcessSale = async () => {
    if (!validateBeforeProcess()) return;

    setIsProcessing(true);
    try {
      const resp = await posService.processSale({
        combustible: selectedFuel.name,
        galones: gallons,
        monto: numAmount,
        cliente_dni: dni.trim() || '00000000',
        placa: plate.toUpperCase().trim(),
        metodo_pago: paymentMethod,
        tipo_comprobante: docType
      });

      if (resp && resp.success) {
        generateTicket(resp.ticket_id, resp.sunat);
        // Limpiar formulario tras venta exitosa
        setAmount('0.00'); 
        setDni(''); 
        setCustomerName('CLIENTES VARIOS');
        setIsCustomerFound(false);
        setPlate('');
        setErrorMessage('');
        alert(`Venta procesada con éxito: ${resp.ticket_id}`);
      } else {
        setErrorMessage(resp?.message || 'Error al emitir en el servidor');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Error de conexión con el backend de facturación');
    } finally {
      setIsProcessing(false);
    }
  };

  // Observación 1: Generación del ticket exactamente con el layout del PDF de referencia
  const generateTicket = (ticketId, sunatData) => {
    const doc = new jsPDF({ format: [80, 210], unit: 'mm' });
    const fechaActual = new Date();
    const fechaHoraStr = `${fechaActual.toLocaleDateString()}, ${fechaActual.toLocaleTimeString()}`;
    const userSession = JSON.parse(sessionStorage.getItem('usuario') || '{}');
    const cajero = userSession.nombre_completo || userSession.name || 'ADMIN SISTEMA GRIFOS';

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

    // Encabezado TURUC S.A.C.
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("TURUC S.A.C.", 40, 9, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("Venta al mejor Precio", 40, 13, { align: "center" });
    doc.text("Cel. 955 114 219 - 960 466 647", 40, 16.5, { align: "center" });
    doc.text("ventas@turucsac.pe", 40, 20, { align: "center" });
    doc.text("Av. Principal N° 123, Urb. Industrial", 40, 23.5, { align: "center" });
    doc.text("Lima - Lima - Lima", 40, 27, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("RUC: 20613708457", 40, 31.5, { align: "center" });

    const tituloFiscal = docType.toUpperCase();
    doc.text(tituloFiscal, 40, 35.5, { align: "center" });
    doc.text(ticketId || "TKT-20260918-193213-1602", 40, 39.5, { align: "center" });

    // Bloque Adquiriente
    doc.setFontSize(7.5);
    doc.text("ADQUIRIENTE", 5, 45);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(`L.E/DNI: ${dni.trim() || '00000000'}`, 5, 49);
    doc.text(customerName.toUpperCase(), 5, 53);

    // Metadatos
    doc.setFont("helvetica", "bold");
    doc.text(`FECHA: ${fechaHoraStr}`, 5, 60);
    doc.setFont("helvetica", "normal");
    doc.text(`FORMA PAGO: ${paymentMethod.toUpperCase()}`, 5, 64);
    doc.text(`VENDEDOR: ${cajero.toUpperCase()}`, 5, 68);

    // Tabla de Ítems
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    doc.text("DESCRIPCION", 5, 74);
    doc.text("CANT.", 34, 74);
    doc.text("U.M.", 45, 74);
    doc.text("PRECIO", 54, 74);
    doc.text("IMPORTE", 75, 74, { align: "right" });

    drawDottedLine(76);

    doc.setFont("helvetica", "normal");
    doc.text(selectedFuel.name.toUpperCase(), 5, 81);
    doc.text(`${gallons}`, 34, 85);
    doc.text("GLI", 45, 85);
    doc.text(`${currentPrice.toFixed(2)}`, 54, 85);
    doc.text(`${numAmount.toFixed(2)}`, 75, 85, { align: "right" });

    drawDottedLine(88);

    // Total
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("TOTAL S/", 45, 93);
    doc.text(`${numAmount.toFixed(2)}`, 75, 93, { align: "right" });

    drawDottedLine(96);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.text(numeroALetras(numAmount), 40, 100.5, { align: "center" });

    drawDottedLine(103);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(`${paymentMethod.toUpperCase()} S/ ${numAmount.toFixed(2)}`, 5, 107.5);

    drawDottedLine(110);

    // Placa
    doc.text(`PLACA: ${plate.toUpperCase().trim() || 'S/P'}`, 5, 114.5);

    drawDottedLine(117);

    // Pie legal SUNAT
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.text("Representación impresa de la Boleta de Venta Electrónica", 40, 121, { align: "center" });
    doc.text("Autorizado mediante Resolución de Intendencia", 40, 124.5, { align: "center" });
    doc.text("N° 094-005-0001933/SUNAT", 40, 128, { align: "center" });

    // Código QR
    const qrData = `20613708457|${docType === 'Factura Electrónica' ? '01' : '03'}|${ticketId}|0.00|${numAmount.toFixed(2)}|${fechaActual.toISOString().split('T')[0]}|${dni || '00000000'}|`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrData)}`;

    try {
      doc.addImage(qrUrl, "PNG", 28, 131, 24, 24);
    } catch (e) {}

    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.text("Emitido desde WWW.TURUCSAC.PE", 40, 160, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.text("GRACIAS POR SU PREFERENCIA...", 40, 164, { align: "center" });

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
                  onChange={(e) => setDni(e.target.value)}
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