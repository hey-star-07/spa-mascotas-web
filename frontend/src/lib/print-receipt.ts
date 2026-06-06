/**
 * Genera e imprime un comprobante de pago a partir de los datos de una factura.
 * Se abre una ventana nueva con el HTML del recibo y se lanza window.print().
 */
export interface FacturaPrint {
  numeroFactura: string;
  fechaEmision: string;
  cliente: { usuario: { nombre: string; apellido: string; email: string } };
  cita?: { mascota: { nombre: string }; servicio: { nombre: string } } | null;
  detalles: Array<{ concepto: string; cantidad: number; precioUnitario: number; total: number }>;
  subtotal: number;
  impuesto: number;
  total: number;
  metodoPago?: string | null;
  pagos?: Array<{ monto: number; metodoPago: string; fechaPago: string }>;
  estado: string;
}

export function printReceipt(factura: FacturaPrint) {
  const fecha = new Date(factura.fechaEmision).toLocaleDateString('es-BO', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const hora = new Date(factura.fechaEmision).toLocaleTimeString('es-BO', {
    hour: '2-digit', minute: '2-digit',
  });

  const filas = factura.detalles.map(d => `
    <tr>
      <td style="padding:6px 4px;border-bottom:1px solid #eee">${d.concepto}</td>
      <td style="padding:6px 4px;border-bottom:1px solid #eee;text-align:center">${d.cantidad}</td>
      <td style="padding:6px 4px;border-bottom:1px solid #eee;text-align:right">Bs. ${Number(d.precioUnitario).toFixed(2)}</td>
      <td style="padding:6px 4px;border-bottom:1px solid #eee;text-align:right;font-weight:700">Bs. ${Number(d.total).toFixed(2)}</td>
    </tr>
  `).join('');

  const pagosHtml = (factura.pagos || []).map(p => `
    <div style="display:flex;justify-content:space-between;font-size:11px;color:#555;margin-top:3px">
      <span>${p.metodoPago}</span>
      <span>Bs. ${Number(p.monto).toFixed(2)}</span>
      <span>${new Date(p.fechaPago).toLocaleDateString('es-BO')}</span>
    </div>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Comprobante ${factura.numeroFactura}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Nunito',sans-serif; background:#fff; color:#1a1a1a; }
    .receipt { max-width:340px; margin:0 auto; padding:24px 20px; }
    .header { text-align:center; border-bottom:3px solid #1a1a1a; padding-bottom:14px; margin-bottom:14px; }
    .logo { font-size:22px; font-weight:900; letter-spacing:-0.5px; }
    .logo span { color:#A8D5BA; }
    .subtitle { font-size:11px; color:#777; margin-top:2px; }
    .num { font-size:11px; font-weight:700; background:#f5f5f5; border:2px solid #1a1a1a; border-radius:8px; display:inline-block; padding:3px 10px; margin-top:6px; }
    .section { margin-bottom:12px; }
    .section-title { font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:.5px; color:#999; margin-bottom:4px; }
    .info-row { display:flex; justify-content:space-between; font-size:12px; margin-bottom:2px; }
    .info-row span:last-child { font-weight:700; }
    table { width:100%; border-collapse:collapse; font-size:12px; margin-bottom:10px; }
    th { text-align:left; font-size:10px; font-weight:900; text-transform:uppercase; color:#999; padding:4px 4px 8px; border-bottom:2px solid #1a1a1a; }
    th:last-child, th:nth-child(3), th:nth-child(2) { text-align:right; }
    .totals { border-top:2px solid #1a1a1a; padding-top:10px; }
    .total-row { display:flex; justify-content:space-between; font-size:13px; margin-bottom:4px; }
    .total-final { font-size:20px; font-weight:900; border-top:2px solid #1a1a1a; padding-top:8px; margin-top:4px; display:flex; justify-content:space-between; }
    .estado { text-align:center; margin-top:14px; }
    .badge { display:inline-block; padding:4px 16px; border-radius:100px; border:2px solid #1a1a1a; font-weight:900; font-size:12px; }
    .badge-pagada { background:#A8D5BA; }
    .badge-pendiente { background:#F4E4BA; }
    .footer { text-align:center; margin-top:18px; padding-top:14px; border-top:2px dashed #ccc; font-size:10px; color:#999; }
    .paw { font-size:18px; }
    @media print {
      body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
      .no-print { display:none; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="logo">🐾 Pet <span>Spa</span></div>
      <div class="subtitle">Sistema de Servicios de Grooming</div>
      <div class="num">${factura.numeroFactura}</div>
    </div>

    <div class="section">
      <div class="section-title">Fecha y hora</div>
      <div class="info-row"><span>${fecha}</span><span>${hora}</span></div>
    </div>

    <div class="section">
      <div class="section-title">Cliente</div>
      <div class="info-row">
        <span>${factura.cliente.usuario.nombre} ${factura.cliente.usuario.apellido}</span>
      </div>
      <div style="font-size:11px;color:#777">${factura.cliente.usuario.email}</div>
    </div>

    ${factura.cita ? `
    <div class="section">
      <div class="section-title">Servicio</div>
      <div class="info-row"><span>${factura.cita.servicio.nombre}</span><span>${factura.cita.mascota.nombre}</span></div>
    </div>` : ''}

    <div class="section">
      <div class="section-title">Detalle</div>
      <table>
        <thead><tr>
          <th>Concepto</th><th style="text-align:center">Cant</th>
          <th style="text-align:right">P.Unit</th><th style="text-align:right">Total</th>
        </tr></thead>
        <tbody>${filas}</tbody>
      </table>
    </div>

    <div class="totals">
      <div class="total-row"><span>Subtotal</span><span>Bs. ${Number(factura.subtotal).toFixed(2)}</span></div>
      ${Number(factura.impuesto) > 0 ? `<div class="total-row"><span>Impuesto</span><span>Bs. ${Number(factura.impuesto).toFixed(2)}</span></div>` : ''}
      <div class="total-final"><span>TOTAL</span><span>Bs. ${Number(factura.total).toFixed(2)}</span></div>
    </div>

    ${factura.metodoPago || (factura.pagos && factura.pagos.length > 0) ? `
    <div class="section" style="margin-top:12px">
      <div class="section-title">Pago</div>
      ${factura.metodoPago ? `<div class="info-row"><span>Método</span><span>${factura.metodoPago}</span></div>` : ''}
      ${pagosHtml}
    </div>` : ''}

    <div class="estado">
      <span class="badge badge-${factura.estado.toLowerCase()}">${factura.estado}</span>
    </div>

    <div class="footer">
      <div class="paw">🐾</div>
      <div>Gracias por confiar en Pet Spa</div>
      <div style="margin-top:3px">Este documento es su comprobante de pago</div>
    </div>
  </div>

  <div class="no-print" style="text-align:center;margin:16px 0">
    <button onclick="window.print()" style="padding:10px 28px;font-family:inherit;font-size:14px;font-weight:700;background:#A8D5BA;border:3px solid #1a1a1a;border-radius:10px;cursor:pointer">
      🖨️ Imprimir
    </button>
    <button onclick="window.close()" style="margin-left:8px;padding:10px 20px;font-family:inherit;font-size:14px;font-weight:700;background:#fff;border:3px solid #1a1a1a;border-radius:10px;cursor:pointer">
      Cerrar
    </button>
  </div>

  <script>
    // Auto-print después de cargar
    window.onload = () => setTimeout(() => window.print(), 400);
  </script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=420,height=700');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}