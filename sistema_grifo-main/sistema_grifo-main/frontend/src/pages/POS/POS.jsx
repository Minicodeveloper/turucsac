import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../components/Sidebar';
import { posService, customerService } from '../../services/api';
import { jsPDF } from 'jspdf';

const fuels = [
  { id: '84', name: 'Gasolina 84', color: 'bg-red-600', label: '84' },
  { id: 'regular', name: 'Regular', color: 'bg-green-600', label: 'REG' },
  { id: 'premium', name: 'Premium', color: 'bg-blue-600', label: 'PRE' },
  { id: '98', name: '98 Octanos', color: 'bg-yellow-400', label: '98', textColor: 'text-slate-900' },
  { id: 'diesel', name: 'Diesel', color: 'bg-slate-700', label: 'DSL' },
  { id: 'gnv', name: 'GNV', color: 'bg-cyan-600', label: 'GNV' },
  { id: 'glp', name: 'GLP', color: 'bg-white', label: 'GLP', textColor: 'text-slate-800', border: 'border border-slate-200' },
];

const POS = () => {
  const [prices, setPrices] = useState({});
  const [selectedFuel, setSelectedFuel] = useState(fuels[1]);
  const [amount, setAmount] = useState('0.00');
  const [dni, setDni] = useState('');
  const [customer, setCustomer] = useState(null);
  const [plate, setPlate] = useState('');
  const [docType, setDocType] = useState('Boleta de Venta');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo (Soles)');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadPrices();
  }, []);

  useEffect(() => {
    if (dni.length === 8 || dni.length === 11) {
      lookupCustomer(dni);
    } else {
      setCustomer(null);
    }
  }, [dni]);

  const loadPrices = async () => {
    try {
      const resp = await posService.getPrices();
      if (resp.success) setPrices(resp.data);
    } catch (err) {
      console.error(err);
    }
  };

  const lookupCustomer = async (doc) => {
    try {
      const resp = await customerService.searchByDoc(doc);
      if (resp.success && resp.data) {
        setCustomer(resp.data);
        if (doc.length === 11) setDocType('Factura Electrónica');
        else setDocType('Boleta de Venta');
      } else {
        setCustomer(null);
      }
    } catch (err) {
      setCustomer(null);
    }
  };

  const currentPrice = useMemo(() => prices[selectedFuel.name] || 0, [prices, selectedFuel]);
  const numAmount = parseFloat(amount) || 0;
  const gallons = (numAmount > 0 && currentPrice > 0) ? (numAmount / currentPrice).toFixed(3) : '0.000';

  const handleProcessSale = async () => {
    if (numAmount <= 0) return alert('Importe inválido');
    if (currentPrice <= 0) return alert('Precio no disponible para este combustible. Verifique inventario.');
    
    setIsProcessing(true);
    try {
      // Simular latencia de firma digital
      await new Promise(r => setTimeout(r, 1000));

      const resp = await posService.processSale({
        combustible: selectedFuel.name,
        galones: gallons,
        monto: numAmount,
        cliente_dni: dni || '00000000',
        placa: plate.toUpperCase(),
        metodo_pago: paymentMethod,
        tipo_comprobante: docType
      });

      if (resp.success) {
        generateTicket(resp.ticket_id, resp.sunat);
        // Limpiar para el siguiente cliente
        setAmount('0.00'); 
        setDni(''); 
        setCustomer(null); 
        setPlate('');
        alert(`Venta procesada con éxito: ${resp.ticket_id}`);
      } else {
        alert(resp.message);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión con el servidor de SUNAT/Grifo');
    } finally {
      setIsProcessing(false);
    }
  };






      const generateTicket = (ticketId, sunatData) => {
        // Formato de papel térmico continuo (80mm x 200mm)
        const doc = new jsPDF({ format: [80, 200], unit: 'mm' });
        const fecha = new Date().toLocaleString();
        const userSession = JSON.parse(sessionStorage.getItem('usuario') || '{}');
        const cajero = userSession.name || 'DAVIS';

        // Helper para líneas punteadas idénticas al ticket térmico
        const drawDottedLine = (y) => {
          doc.setLineDashPattern([0.8, 0.8], 0);
          doc.line(5, y, 75, y);
          doc.setLineDashPattern([], 0);
        };

        // Función auxiliar para convertir el total a letras simple
        const numeroALetras = (monto) => {
          const entero = Math.floor(monto);
          const centavos = Math.round((monto - entero) * 100).toString().padStart(2, '0');
          // Para números habituales o texto estándar
          return `SON: ${entero} CON ${centavos}/100 SOLES`;
        };

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("TURUC S.A.C.", 40, 10, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.text("Venta al mejor Precio", 40, 14, { align: "center" });
        doc.text("Cel. 955 114 219 - 960 466 647", 40, 17.5, { align: "center" });
        doc.text("ventas@turucsac.pe", 40, 21, { align: "center" });
        doc.text("Av. Principal N° 123, Urb. Industrial", 40, 24.5, { align: "center" });
        doc.text("Lima - Lima - Lima", 40, 28, { align: "center" });

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text("RUC: 20613708457", 40, 32.5, { align: "center" });

        const esFactura = docType.toLowerCase().includes('factura');
        const tituloDoc = esFactura ? "FACTURA ELECTRONICA" : "BOLETA DE VENTA ELECTRONICA";
        doc.text(tituloDoc, 40, 36.5, { align: "center" });
        doc.text(ticketId || "B001-37", 40, 40.5, { align: "center" });

        // Bloque Adquiriente
        doc.setFontSize(7.5);
        doc.text("ADQUIRIENTE", 5, 46);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.text(`L.E/DNI: ${dni || '78631951'}`, 5, 50);
        const nombreCliente = customer?.razon_social || (esFactura ? 'EMPRESA REGISTRADA' : 'CLIENTES VARIOS');
        doc.text(nombreCliente.toUpperCase(), 5, 54);
        doc.text("-", 5, 57.5);

        // Metadatos
        doc.setFont("helvetica", "bold");
        doc.text(`FECHA: ${fecha}`, 5, 62);
        doc.setFont("helvetica", "normal");
        doc.text("FORMA PAGO: CONTADO", 5, 66);
        doc.text(`VENDEDOR: ${cajero.toUpperCase()}`, 5, 70);

        // Tabla de ítems
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.8);
        doc.text("DESCRIPCION", 5, 75);
        doc.text("CANT.", 36, 75);
        doc.text("U.M.", 47, 75);
        doc.text("PRECIO", 55, 75);
        doc.text("IMPORTE", 75, 75, { align: "right" });

        drawDottedLine(77);

        doc.setFont("helvetica", "normal");
        doc.text(selectedFuel.name.toUpperCase(), 5, 81);
        doc.text(`${gallons}`, 36, 85);
        doc.text("GLI", 47, 85);
        doc.text(`${currentPrice.toFixed(2)}`, 55, 85);
        doc.text(`${numAmount.toFixed(2)}`, 75, 85, { align: "right" });

        drawDottedLine(88);

        // Totales
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
        doc.text(`EFECTIVO S/ ${numAmount.toFixed(2)}`, 5, 107.5);

        drawDottedLine(110);

        // Placa
        const placaValor = plate.trim() ? plate.toUpperCase() : 'ABC123';
        doc.text(`PLACA: ${placaValor}`, 5, 114.5);

        drawDottedLine(117);

        // Pie legal
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6);
        doc.text("Representación impresa de la Boleta de Venta Electrónica", 40, 121, { align: "center" });
        doc.text("Autorizado mediante Resolución de Intendencia", 40, 124.5, { align: "center" });
        doc.text("N° 094-005-0001933/SUNAT", 40, 128, { align: "center" });

        // Código QR
        const qrData = `20613708457|${esFactura ? '01' : '03'}|${ticketId}|0.00|${numAmount.toFixed(2)}|${fecha}|${dni || '00000000'}|`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrData)}`;
        
        try {
          doc.addImage(qrUrl, "PNG", 30, 131, 20, 20);
        } catch (e) {}

        doc.setFontSize(6.5);
        doc.setFont("helvetica", "bold");
        doc.text("Emitido desde WWW.TURUCSAC.PE", 40, 156, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.text("GRACIAS POR SU PREFERENCIA...", 40, 160, { align: "center" });

        doc.save(`${ticketId || 'ticket'}.pdf`);
      };



  return (
    <div className="min-h-screen flex bg-[var(--surface)]">
      <Sidebar />
      <main className="flex-1 md:ml-64 pt-24 pb-12 px-10">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header Section */}
          <header className="flex items-end justify-between border-b-[3px] border-[var(--primary-container)] pb-6">
            <div>
              <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--primary-container)] mb-1">Terminal Operativo</h1>
              <h2 className="text-5xl font-black tracking-tighter text-[var(--on-secondary-fixed)] lowercase first-letter:uppercase">Interfaz de despacho</h2>
            </div>
          </header>

          {/* Product Selection: The Multi-Grid */}
          <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {fuels.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFuel(f)}
                  className={`paper-lowest p-6 rounded-2xl flex flex-col items-center justify-center gap-4 transition-all ${
                    selectedFuel.id === f.id ? 'ring-2 ring-[var(--primary-container)] shadow-lg shadow-[#00AEEF10]' : 'hover:bg-[var(--surface-container-low)]'
                  }`}
                >
                  <div className="w-14 h-14 rounded-xl shadow-sm border border-[var(--color-outline-variant)]/20 flex items-center justify-center overflow-hidden">
                    <img 
                      src={`/sistema_grifo-main/frontend/dist/logos/${f.name}.png`} 
                      alt={f.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[12px] font-black uppercase text-[var(--on-secondary-fixed)] tracking-tight">{f.name}</span>
                </button>
              ))}
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Input Section: Clinical Tonal Transitions */}
            <div className="lg:col-span-8 paper-lowest rounded-2xl p-10 shadow-[0_4px_32px_rgba(11,29,45,0.02)] space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-1">Comprobante Fiscal</label>
                    <select value={docType} onChange={(e) => setDocType(e.target.value)} className="h-14 bg-[var(--surface-container-low)] rounded-xl px-4 outline-none font-bold text-[var(--on-secondary-fixed)] appearance-none cursor-pointer hover:bg-[var(--surface-container)] transition-colors">
                      <option>Boleta de Venta</option>
                      <option>Factura Electrónica</option>
                      <option>Nota de Venta</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-1">Modalidad Pago</label>
                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="h-14 bg-[var(--surface-container-low)] rounded-xl px-4 outline-none font-bold text-[var(--on-secondary-fixed)] appearance-none cursor-pointer hover:bg-[var(--surface-container)] transition-colors">
                      <option>Efectivo (Soles)</option>
                      <option>Tarjeta Crédito/Débito</option>
                      <option>Puntos / Fidelidad</option>
                    </select>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="flex flex-col gap-2 relative">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-1">Identificación Cliente</label>
                    <input type="text" value={dni} onChange={(e) => setDni(e.target.value)} className="h-14 bg-[var(--surface-container-low)] rounded-xl px-4 outline-none font-black text-2xl tracking-tighter text-[var(--primary-container)] focus:ring-2 ring-[var(--primary-container)]/10" placeholder="60000000" />
                    {customer && (
                      <div className="absolute right-4 top-[2.4rem] micro-tag bg-[var(--primary-container)]/10 text-[var(--primary-container)]">REGISTRADO</div>
                    )}
                    {customer && <p className="text-[9px] font-black text-[var(--on-surface-variant)] uppercase mt-1 ml-1 truncate">{customer.razon_social}</p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)] ml-1">Placa Vehículo</label>
                    <input type="text" value={plate} onChange={(e) => setPlate(e.target.value)} className="h-14 bg-[var(--surface-container-low)] rounded-xl px-4 outline-none font-black text-2xl tracking-[0.2em] text-[var(--on-secondary-fixed)] uppercase" placeholder="ABC-123" />
                  </div>
               </div>

               {/* Import Input: The Hero Metric */}
               <div className="pt-10 flex flex-col items-center">
                  <label className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--primary-container)] mb-8">Importe de Despacho (S/)</label>
                  <div className="relative w-full max-w-md">
                     <span className="absolute left-6 top-1/2 -translate-y-1/2 text-4xl font-black text-[var(--outline-variant)]">S/</span>
                     <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full h-32 bg-[var(--surface-container-low)] rounded-[2.5rem] text-center text-7xl font-black text-[var(--on-secondary-fixed)] outline-none border-none focus:ring-4 ring-[var(--primary-container)]/5" />
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 mt-10">
                     {[20, 50, 100, 200].map(v => (
                        <button key={v} onClick={() => setAmount(v.toFixed(2))} className="px-6 py-2 rounded-full paper-nested text-[11px] font-black text-[var(--on-secondary-fixed)] hover:bg-[var(--primary-container)] hover:text-white transition-all">S/ {v}</button>
                     ))}
                     <button onClick={() => setAmount('250.00')} className="px-8 py-2 rounded-full bg-[var(--on-secondary-fixed)] text-white text-[11px] font-black hover:bg-black transition-all">FULL</button>
                  </div>
               </div>
            </div>

            {/* Receipt Summary: Executive Data Asymmetry */}
            <div className="lg:col-span-4 sticky top-24 space-y-6">
               <div className="paper-nested rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary-container)] opacity-[0.03] rounded-bl-[100%]"></div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--primary-container)] mb-10 border-b border-[var(--outline-variant)]/10 pb-4">Detalle Consolidado</h4>
                  <div className="space-y-8">
                     <div className="flex justify-between items-end">
                        <span className="text-[11px] font-bold text-[var(--on-surface-variant)] uppercase tracking-tighter">Variedad</span>
                        <span className="text-xl font-black text-[var(--on-secondary-fixed)]">{selectedFuel.name}</span>
                     </div>
                     <div className="flex justify-between items-end">
                        <span className="text-[11px] font-bold text-[var(--on-surface-variant)] uppercase tracking-tighter">Volumen Neto</span>
                        <span className="text-3xl font-black text-[var(--primary-container)]">{gallons} <span className="text-[10px]">GL</span></span>
                     </div>
                     <div className="flex justify-between items-end">
                        <span className="text-[11px] font-bold text-[var(--on-surface-variant)] uppercase tracking-tighter">Precio Unitario</span>
                        <span className="text-xl font-black text-[var(--on-secondary-fixed)]">S/ {currentPrice.toFixed(2)}</span>
                     </div>
                     <div className="pt-10 flex flex-col items-end">
                        <span className="text-[10px] font-black text-[var(--outline-variant)] uppercase tracking-widest mb-1">Total a Validar</span>
                        <span className="text-6xl font-black text-[var(--on-secondary-fixed)] tracking-tighter">S/ {numAmount.toFixed(2)}</span>
                     </div>
                  </div>
               </div>

               <button 
                onClick={handleProcessSale}
                disabled={isProcessing}
                className="w-full h-24 btn-azure flex items-center justify-center gap-4 text-xl tracking-tighter group"
               >
                  {isProcessing ? (
                     <span className="material-symbols-outlined animate-spin text-3xl">sync</span>
                  ) : (
                     <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform">point_of_sale</span>
                  )}
                  <span className="font-black uppercase tracking-widest text-sm">Validar & Imprimir</span>
               </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default POS;
