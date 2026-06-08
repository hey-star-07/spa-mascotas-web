"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Receipt, DollarSign, QrCode, Wallet, Banknote, Eye,
  CreditCard, Printer, CheckCircle, ShoppingBag, X
} from "lucide-react";
import { toast } from "sonner";
import { printReceipt } from "@/lib/print-receipt";

interface Factura {
  id: number;
  numeroFactura: string;
  fechaEmision: string;
  subtotal: number;
  impuesto: number;
  total: number;
  estado: string;
  metodoPago: string | null;
  cliente: { id: number; usuario: { nombre: string; apellido: string; email: string } };
  cita: { mascota: { nombre: string }; servicio: { nombre: string } } | null;
  pedido?: { id: number; estado: string; metodoContacto: string } | null;
  detalles: Array<{ concepto: string; cantidad: number; precioUnitario: number; total: number }>;
  pagos: Array<{ monto: number; metodoPago: string; fechaPago: string; referenciaTransaccion: string | null }>;
}

export default function BillingPage() {
  const { user } = useAuthStore();
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [pagoOpen, setPagoOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [cierreOpen, setCierreOpen] = useState(false);
  const [cierreData, setCierreData] = useState<any>(null);
  const [posOpen, setPosOpen] = useState(false);
  const [posForm, setPosForm] = useState({
    clienteId: "", servicioId: "", productoId: "", cantidad: 1,
    metodoPago: "Efectivo" as string, referencia: "",
  });
  const [clientes, setClientes] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [pagoForm, setPagoForm] = useState({ monto: 0, metodoPago: "Efectivo" as string, referencia: "" });

  const loadFacturas = async () => {
    try {
      const endpoint = user?.rol === 'Cliente' ? '/billing/facturas/mis-facturas' : '/billing/facturas';
      const { data } = await api.get(endpoint);
      setFacturas(data.data || []);
    } catch { toast.error("Error al cargar facturas"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadFacturas(); }, []);

  const metodoIcon = (metodo: string) => {
    switch (metodo) {
      case 'Efectivo': return <Banknote className="h-4 w-4" />;
      case 'QR': return <QrCode className="h-4 w-4" />;
      case 'Transferencia': return <Wallet className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const metodoColor = (metodo: string) => {
    switch (metodo) {
      case 'Efectivo': return 'bg-primary';
      case 'QR': return 'bg-lavender';
      case 'Transferencia': return 'bg-accent';
      default: return 'bg-gray-200';
    }
  };

  const handlePrint = (factura: Factura) => {
    printReceipt({
      ...factura,
      cita: factura.cita ?? null,
    });
  };

  const handleCierreCaja = async () => {
    try {
      const { data } = await api.get("/billing/cierre-caja");
      setCierreData(data.data);
      setCierreOpen(true);
    } catch { toast.error("Error al cargar cierre de caja"); }
  };

  const openPOS = async () => {
    try {
      const [clientesRes, serviciosRes, productosRes] = await Promise.all([
        api.get("/users/clientes"),
        api.get("/services?active=true"),
        api.get("/inventory/catalogo-tienda"),
      ]);
      setClientes(clientesRes.data.data?.users || []);
      setServicios(serviciosRes.data.data || []);
      setProductos(productosRes.data.data || []);
      setPosOpen(true);
    } catch { toast.error("Error al cargar datos para POS"); }
  };

  const handleVentaRapida = async () => {
    if (!posForm.clienteId) return toast.error("Selecciona un cliente");
    if (!posForm.servicioId && !posForm.productoId) return toast.error("Selecciona un servicio o producto");
    try {
      const servicio = servicios.find(s => s.id.toString() === posForm.servicioId);
      const producto = productos.find(p => p.id.toString() === posForm.productoId);
      const subtotal = (servicio ? Number(servicio.precioBase) : 0) + (producto ? Number(producto.precioBase) * posForm.cantidad : 0);
      const facturaRes = await api.post("/billing/facturas", {
        clienteId: parseInt(posForm.clienteId),
        subtotal, impuesto: 0, total: subtotal,
        metodoPago: posForm.metodoPago as any,
      });
      if (servicio) {
        await api.post("/billing/detalles", { facturaId: facturaRes.data.data.id, concepto: servicio.nombre, cantidad: 1, precioUnitario: Number(servicio.precioBase), total: Number(servicio.precioBase) });
      }
      if (producto) {
        await api.post("/billing/detalles", { facturaId: facturaRes.data.data.id, concepto: producto.nombre, cantidad: posForm.cantidad, precioUnitario: Number(producto.precioBase), total: Number(producto.precioBase) * posForm.cantidad });
      }
      await api.post("/billing/pagos", { facturaId: facturaRes.data.data.id, monto: subtotal, metodoPago: posForm.metodoPago, referenciaTransaccion: posForm.referencia || undefined });
      toast.success("Venta registrada");
      setPosOpen(false);
      loadFacturas();
    } catch (error: any) { toast.error(error.response?.data?.message || "Error al registrar venta"); }
  };

  const openPagoDialog = (factura: Factura) => {
    setSelectedFactura(factura);
    setPagoForm({ monto: Number(factura.total), metodoPago: "Efectivo", referencia: "" });
    setPagoOpen(true);
  };

  const handleRegistrarPago = async () => {
    if (!selectedFactura) return;
    if (pagoForm.monto <= 0) return toast.error("Monto inválido");
    if (pagoForm.metodoPago === 'Transferencia' && !pagoForm.referencia) return toast.error("Ingresa la referencia");
    try {
      await api.post("/billing/pagos", { facturaId: selectedFactura.id, monto: pagoForm.monto, metodoPago: pagoForm.metodoPago, referenciaTransaccion: pagoForm.referencia || undefined });
      toast.success("Pago registrado");
      // Recargar y mostrar comprobante
      await loadFacturas();
      const updated = (await api.get(user?.rol === 'Cliente' ? '/billing/facturas/mis-facturas' : '/billing/facturas')).data.data?.find((f: Factura) => f.id === selectedFactura.id);
      if (updated) { handlePrint(updated); }
      setPagoOpen(false);
    } catch (error: any) { toast.error(error.response?.data?.message || "Error al registrar pago"); }
  };

  if (loading) return <LoadingSpinner text="Cargando facturación..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Receipt className="h-8 w-8" strokeWidth={3} />
          <div>
            <h1 className="text-3xl font-extrabold">Facturación</h1>
            <p className="text-sm font-semibold text-foreground/70">{facturas.length} factura{facturas.length !== 1 && "s"}</p>
          </div>
        </div>
        {user?.rol !== 'Cliente' && (
          <div className="flex gap-2">
            <Button variant="accent" onClick={openPOS}><CreditCard className="mr-2 h-4 w-4" /> Punto de Venta</Button>
            <Button variant="outline" onClick={handleCierreCaja}><Printer className="mr-2 h-4 w-4" /> Cierre de Caja</Button>
          </div>
        )}
      </div>

      {/* Lista */}
      {facturas.length === 0 ? (
        <EmptyState icon={<Receipt className="h-12 w-12" />} title="Sin facturas" description="No se encontraron comprobantes de pago" />
      ) : (
        <div className="space-y-3">
          {facturas.map((f) => (
            <Card key={f.id} className={`hover:shadow-cartoon-hover transition-all ${f.estado === 'Cancelada' ? 'opacity-60' : ''}`}>
              <CardContent className="flex items-center justify-between py-4 flex-wrap gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-extrabold text-lg">{f.numeroFactura}</p>
                    {/* Etiqueta si es pedido de tienda */}
                    {f.pedido && (
                      <Badge className="bg-lavender/80 text-foreground text-[10px] flex items-center gap-1">
                        <ShoppingBag className="h-3 w-3" /> Pedido Tienda
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-foreground/50">{new Date(f.fechaEmision).toLocaleDateString('es-BO')}</p>
                  {user?.rol !== 'Cliente' && <p className="text-sm font-semibold">{f.cliente.usuario.nombre} {f.cliente.usuario.apellido}</p>}
                  {f.cita && <p className="text-xs text-foreground/60">{f.cita.mascota.nombre} · {f.cita.servicio.nombre}</p>}
                  {f.pedido && <p className="text-xs text-foreground/60">Pedido #{f.pedido.id} · {f.pedido.metodoContacto}</p>}
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xl font-extrabold">Bs. {Number(f.total).toFixed(2)}</p>
                  <Badge className={`${f.estado === 'Pagada' ? 'bg-primary' : f.estado === 'Cancelada' ? 'bg-rose' : 'bg-accent'} mt-1`}>
                    {f.estado}
                  </Badge>
                  {f.metodoPago && (
                    <div className={`flex items-center gap-1 justify-end text-xs mt-1 px-2 py-0.5 rounded-full ${metodoColor(f.metodoPago)}`}>
                      {metodoIcon(f.metodoPago)} {f.metodoPago}
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex gap-2 shrink-0">
                  {/* Ver detalle */}
                  <Button size="sm" variant="outline" onClick={() => { setSelectedFactura(f); setDetailOpen(true); }} title="Ver detalle">
                    <Eye className="h-4 w-4" />
                  </Button>
                  {/* QR */}
                  <Button size="sm" variant="secondary" onClick={() => { setSelectedFactura(f); setQrOpen(true); }} title="Ver QR">
                    <QrCode className="h-4 w-4" />
                  </Button>
                  {/* IMPRIMIR — disponible para todos */}
                  <Button size="sm" variant="outline" onClick={() => handlePrint(f)} title="Imprimir comprobante">
                    <Printer className="h-4 w-4" />
                  </Button>
                  {/* Cobrar (solo admin/recepcion, solo pendientes) */}
                  {user?.rol !== 'Cliente' && f.estado === 'Pendiente' && (
                    <Button size="sm" variant="accent" onClick={() => openPagoDialog(f)} title="Registrar pago">
                      <DollarSign className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── DETALLE ── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Factura {selectedFactura?.numeroFactura}</DialogTitle>
            <DialogDescription>{new Date(selectedFactura?.fechaEmision || '').toLocaleDateString('es-BO')}</DialogDescription>
          </DialogHeader>
          {selectedFactura && (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              <div className="flex justify-between text-sm"><span>Cliente:</span><span className="font-bold">{selectedFactura.cliente.usuario.nombre} {selectedFactura.cliente.usuario.apellido}</span></div>
              {selectedFactura.cita && <div className="flex justify-between text-sm"><span>Servicio:</span><span className="font-bold">{selectedFactura.cita.servicio.nombre} · {selectedFactura.cita.mascota.nombre}</span></div>}
              {selectedFactura.pedido && <div className="flex justify-between text-sm"><span>Pedido Tienda:</span><span className="font-bold">#{selectedFactura.pedido.id}</span></div>}
              <table className="w-full text-sm">
                <thead><tr className="border-b-2 border-foreground">
                  <th className="text-left py-1">Concepto</th><th className="text-center">Cant</th><th className="text-right">Precio</th><th className="text-right">Total</th>
                </tr></thead>
                <tbody>
                  {selectedFactura.detalles.map((d, i) => (
                    <tr key={i} className="border-b border-foreground/20">
                      <td className="py-1.5">{d.concepto}</td>
                      <td className="text-center">{d.cantidad}</td>
                      <td className="text-right">Bs. {Number(d.precioUnitario).toFixed(2)}</td>
                      <td className="text-right font-bold">Bs. {Number(d.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-right space-y-1 border-t-2 border-foreground pt-2">
                <p className="text-sm">Subtotal: Bs. {Number(selectedFactura.subtotal).toFixed(2)}</p>
                {Number(selectedFactura.impuesto) > 0 && <p className="text-sm">Impuesto: Bs. {Number(selectedFactura.impuesto).toFixed(2)}</p>}
                <p className="text-xl font-extrabold">Total: Bs. {Number(selectedFactura.total).toFixed(2)}</p>
              </div>
              {selectedFactura.pagos.length > 0 && (
                <div className="border-t-2 border-foreground pt-2">
                  <p className="text-xs font-bold mb-1">Pagos registrados:</p>
                  {selectedFactura.pagos.map((p, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="flex items-center gap-1">{metodoIcon(p.metodoPago)} {p.metodoPago}</span>
                      <span className="font-bold">Bs. {Number(p.monto).toFixed(2)}</span>
                      <span className="text-foreground/50">{new Date(p.fechaPago).toLocaleDateString('es-BO')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Cerrar</Button>
            {/* ✅ BOTÓN IMPRIMIR EN EL DETALLE */}
            {selectedFactura && (
              <Button onClick={() => handlePrint(selectedFactura)}>
                <Printer className="mr-2 h-4 w-4" /> Imprimir
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── REGISTRAR PAGO ── */}
      <Dialog open={pagoOpen} onOpenChange={setPagoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" /> Registrar Pago</DialogTitle>
            <DialogDescription>Factura: {selectedFactura?.numeroFactura} · Total: Bs. {Number(selectedFactura?.total).toFixed(2)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Monto</Label>
              <Input type="number" value={pagoForm.monto} onChange={e => setPagoForm({...pagoForm, monto: parseFloat(e.target.value) || 0})} className="text-xl font-extrabold" />
            </div>
            <div>
              <Label>Método de Pago</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {[
                  { k: "Efectivo", icon: <Banknote className="h-8 w-8" />, color: "primary" },
                  { k: "QR",       icon: <QrCode   className="h-8 w-8" />, color: "lavender" },
                  { k: "Transferencia", icon: <Wallet className="h-8 w-8" />, color: "accent" },
                ].map(({ k, icon, color }) => (
                  <button key={k} onClick={() => setPagoForm({...pagoForm, metodoPago: k, referencia: ""})}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-3 transition-all ${
                      pagoForm.metodoPago === k
                        ? `border-${color} bg-${color}/10 shadow-cartoon-sm`
                        : `border-foreground/30 hover:bg-${color}/10`
                    }`}>
                    <span className={pagoForm.metodoPago === k ? `text-${color}` : "text-foreground/50"}>{icon}</span>
                    <span className="text-xs font-bold">{k}</span>
                  </button>
                ))}
              </div>
            </div>
            {pagoForm.metodoPago === "Transferencia" && (
              <div><Label>Referencia *</Label><Input value={pagoForm.referencia} onChange={e => setPagoForm({...pagoForm, referencia: e.target.value})} placeholder="N° de operación" /></div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPagoOpen(false)}>Cancelar</Button>
            <Button onClick={handleRegistrarPago} variant="accent">
              <CheckCircle className="mr-2 h-4 w-4" /> Confirmar y Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── QR ── */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2"><QrCode className="h-6 w-6" /> Pago por QR</DialogTitle>
            <DialogDescription>Escanee con su aplicación bancaria</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="border-3 border-foreground rounded-xl p-4 bg-white shadow-cartoon">
                <img src="http://localhost:3000/uploads/qr.jpeg" alt="QR" className="w-56 h-56 object-contain"
                  onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
              </div>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4 border-2 border-foreground">
              <p className="text-sm font-bold">{selectedFactura?.numeroFactura}</p>
              <p className="text-3xl font-extrabold mt-2">Bs. {Number(selectedFactura?.total).toFixed(2)}</p>
              <p className="text-xs text-foreground/50 mt-1">{selectedFactura?.cliente.usuario.nombre} {selectedFactura?.cliente.usuario.apellido}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQrOpen(false)}>Cerrar</Button>
            {selectedFactura && <Button onClick={() => handlePrint(selectedFactura)}><Printer className="mr-2 h-4 w-4" /> Imprimir</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── PUNTO DE VENTA ── */}
      <Dialog open={posOpen} onOpenChange={setPosOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Punto de Venta</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div>
              <Label>Cliente *</Label>
              <select value={posForm.clienteId} onChange={e => setPosForm({...posForm, clienteId: e.target.value})} className="w-full h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold">
                <option value="">Seleccionar cliente</option>
                {clientes.map((c: any) => <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>)}
              </select>
            </div>
            <div>
              <Label>Servicio</Label>
              <select value={posForm.servicioId} onChange={e => setPosForm({...posForm, servicioId: e.target.value})} className="w-full h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold">
                <option value="">Ninguno</option>
                {servicios.map((s: any) => <option key={s.id} value={s.id}>{s.nombre} - Bs. {Number(s.precioBase).toFixed(2)}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <Label>Producto</Label>
                <select value={posForm.productoId} onChange={e => setPosForm({...posForm, productoId: e.target.value})} className="w-full h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold">
                  <option value="">Ninguno</option>
                  {productos.map((p: any) => <option key={p.id} value={p.id}>{p.nombre} - Bs. {Number(p.precioBase).toFixed(2)}</option>)}
                </select>
              </div>
              <div><Label>Cant.</Label><Input type="number" value={posForm.cantidad} onChange={e => setPosForm({...posForm, cantidad: parseInt(e.target.value) || 1})} min="1" /></div>
            </div>
            <div>
              <Label>Método de Pago</Label>
              <div className="grid grid-cols-3 gap-2">
                {['Efectivo','QR','Transferencia'].map(m => (
                  <button key={m} onClick={() => setPosForm({...posForm, metodoPago: m})}
                    className={`p-3 rounded-xl border-3 border-foreground text-sm font-bold transition-all ${posForm.metodoPago === m ? 'bg-primary shadow-cartoon-sm' : 'bg-white hover:bg-primary/20'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            {posForm.metodoPago === 'Transferencia' && <div><Label>Referencia</Label><Input value={posForm.referencia} onChange={e => setPosForm({...posForm, referencia: e.target.value})} /></div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPosOpen(false)}>Cancelar</Button>
            <Button onClick={handleVentaRapida} variant="accent">Cobrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── CIERRE DE CAJA ── */}
      <Dialog open={cierreOpen} onOpenChange={setCierreOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Printer className="h-5 w-5" /> Cierre de Caja</DialogTitle>
            <DialogDescription>{cierreData?.fecha}</DialogDescription>
          </DialogHeader>
          {cierreData && (
            <div className="space-y-4">
              <div className="text-center bg-primary/10 border-2 border-primary rounded-xl p-4">
                <p className="text-sm font-bold">Total Cobrado</p>
                <p className="text-4xl font-extrabold mt-1">Bs. {cierreData.totalCobrado?.toFixed(2)}</p>
                <p className="text-xs mt-1">{cierreData.totalPagos} pagos</p>
              </div>
              {[{k:'Efectivo',icon:<Banknote/>,color:'primary'},{k:'QR',icon:<QrCode/>,color:'lavender'},{k:'Transferencia',icon:<Wallet/>,color:'accent'}].map(({k,icon,color}) => (
                <div key={k} className={`flex items-center justify-between p-3 bg-${color}/10 border-2 border-${color} rounded-xl`}>
                  <div className="flex items-center gap-2">{icon}<span className="font-bold">{k}</span></div>
                  <span className="text-lg font-extrabold">Bs. {cierreData.porMetodo?.[k]?.toFixed(2) || '0.00'}</span>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCierreOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}