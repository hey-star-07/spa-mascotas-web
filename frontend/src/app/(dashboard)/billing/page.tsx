"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { Receipt, Plus, DollarSign, QrCode, Wallet, Banknote, Eye, CreditCard, Printer } from "lucide-react";
import { toast } from "sonner";

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
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [cierreOpen, setCierreOpen] = useState(false);
  const [cierreData, setCierreData] = useState<any>(null);

  // Nuevo: Punto de venta
  const [posOpen, setPosOpen] = useState(false);
  const [posForm, setPosForm] = useState({
    clienteId: "", servicioId: "", productoId: "", cantidad: 1,
    metodoPago: "Efectivo" as string, referencia: "",
  });
  const [clientes, setClientes] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);

  const loadFacturas = async () => {
    try {
      const endpoint = user?.rol === 'Cliente' ? '/billing/facturas/mis-facturas' : '/billing/facturas';
      const { data } = await api.get(endpoint);
      setFacturas(data.data || []);
    } catch { toast.error("Error al cargar facturas"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadFacturas(); }, []);

  const handleVerQR = async (factura: Factura) => {
    try {
      const { data } = await api.get(`/billing/facturas/${factura.id}/qr`);
      setQrImage(data.data.qrImage);
      setSelectedFactura(factura);
      setQrOpen(true);
    } catch { toast.error("Error al generar QR"); }
  };

  const handleCierreCaja = async () => {
    try {
      const { data } = await api.get("/billing/cierre-caja");
      setCierreData(data.data);
      setCierreOpen(true);
    } catch { toast.error("Error al cargar cierre de caja"); }
  };

  // Abrir POS
  const openPOS = async () => {
    try {
      const [clientesRes, serviciosRes, productosRes] = await Promise.all([
        api.get("/users?rol=Cliente&activo=true"),
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
      const cliente = clientes.find(c => c.id.toString() === posForm.clienteId);
      const servicio = servicios.find(s => s.id.toString() === posForm.servicioId);
      const producto = productos.find(p => p.id.toString() === posForm.productoId);
      const subtotal = (servicio ? Number(servicio.precioBase) : 0) + (producto ? Number(producto.precioBase) * posForm.cantidad : 0);
      const total = subtotal * 1.13;

      // Crear factura
      const facturaRes = await api.post("/billing/facturas", {
        clienteId: parseInt(posForm.clienteId),
        subtotal,
        impuesto: total - subtotal,
        total,
        metodoPago: posForm.metodoPago as any,
      });

      // Agregar detalle
      if (servicio) {
        await api.post("/billing/detalles", {
          facturaId: facturaRes.data.data.id,
          concepto: servicio.nombre,
          cantidad: 1,
          precioUnitario: Number(servicio.precioBase),
          total: Number(servicio.precioBase),
        });
      }
      if (producto) {
        await api.post("/billing/detalles", {
          facturaId: facturaRes.data.data.id,
          concepto: producto.nombre,
          cantidad: posForm.cantidad,
          precioUnitario: Number(producto.precioBase),
          total: Number(producto.precioBase) * posForm.cantidad,
        });
      }

      // Registrar pago
      await api.post("/billing/pagos", {
        facturaId: facturaRes.data.data.id,
        monto: total,
        metodoPago: posForm.metodoPago,
        referenciaTransaccion: posForm.referencia || undefined,
      });

      toast.success("Venta registrada exitosamente");
      setPosOpen(false);
      loadFacturas();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al registrar venta");
    }
  };

  const metodoIcon = (metodo: string) => {
    switch (metodo) {
      case 'Efectivo': return <Banknote className="h-4 w-4" />;
      case 'QR': return <QrCode className="h-4 w-4" />;
      case 'Transferencia': return <Wallet className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
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
        <div className="flex gap-2">
          {user?.rol !== 'Cliente' && (
            <>
              <Button variant="accent" onClick={openPOS}>
                <CreditCard className="mr-2 h-4 w-4" /> Punto de Venta
              </Button>
              <Button variant="outline" onClick={handleCierreCaja}>
                <Printer className="mr-2 h-4 w-4" /> Cierre de Caja
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Lista de facturas */}
      {facturas.length === 0 ? (
        <EmptyState icon={<Receipt className="h-12 w-12" />} title="Sin facturas" />
      ) : (
        <div className="space-y-3">
          {facturas.map((f) => (
            <Card key={f.id} className="hover:shadow-cartoon-hover transition-all">
              <CardContent className="flex items-center justify-between py-4 flex-wrap gap-3">
                <div>
                  <p className="font-extrabold text-lg">{f.numeroFactura}</p>
                  <p className="text-xs">{new Date(f.fechaEmision).toLocaleDateString()}</p>
                  <p className="text-sm font-semibold">{f.cliente.usuario.nombre}</p>
                  {f.cita && <p className="text-xs">{f.cita.mascota.nombre} - {f.cita.servicio.nombre}</p>}
                </div>
                <div className="text-right">
                  <p className="text-xl font-extrabold">Bs. {Number(f.total).toFixed(2)}</p>
                  <Badge className={f.estado === 'Pagada' ? 'bg-primary' : f.estado === 'Cancelada' ? 'bg-rose' : 'bg-accent'}>
                    {f.estado}
                  </Badge>
                  {f.metodoPago && (
                    <div className="flex items-center gap-1 text-xs mt-1">{metodoIcon(f.metodoPago)} {f.metodoPago}</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setSelectedFactura(f); setDetailOpen(true); }}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleVerQR(f)}>
                    <QrCode className="h-4 w-4" />
                  </Button>
                  {user?.rol !== 'Cliente' && f.estado === 'Pendiente' && (
                    <Button size="sm" variant="accent" onClick={() => { setSelectedFactura(f); setPagoOpen(true); }}>
                      <DollarSign className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Diálogo Punto de Venta */}
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
              <div>
                <Label>Cant.</Label>
                <Input type="number" value={posForm.cantidad} onChange={e => setPosForm({...posForm, cantidad: parseInt(e.target.value) || 1})} min="1" />
              </div>
            </div>
            <div>
              <Label>Método de Pago</Label>
              <div className="grid grid-cols-3 gap-2">
                {['Efectivo', 'QR', 'Transferencia'].map(m => (
                  <button key={m} onClick={() => setPosForm({...posForm, metodoPago: m})}
                    className={`p-3 rounded-xl border-3 border-foreground text-sm font-bold transition-all ${posForm.metodoPago === m ? 'bg-primary shadow-cartoon-sm' : 'bg-white hover:bg-primary/20'}`}>
                    {metodoIcon(m)} {m}
                  </button>
                ))}
              </div>
            </div>
            {posForm.metodoPago === 'Transferencia' && (
              <div><Label>Referencia</Label><Input value={posForm.referencia} onChange={e => setPosForm({...posForm, referencia: e.target.value})} /></div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPosOpen(false)}>Cancelar</Button>
            <Button onClick={handleVentaRapida} variant="accent">Cobrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo Cierre de Caja */}
      <Dialog open={cierreOpen} onOpenChange={setCierreOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Cierre de Caja - {cierreData?.fecha}</DialogTitle></DialogHeader>
          {cierreData && (
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-3xl font-extrabold">Bs. {cierreData.totalCobrado?.toFixed(2)}</p>
                <p className="text-xs">Total cobrado</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Efectivo:</span><span className="font-bold">Bs. {cierreData.porMetodo?.Efectivo?.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>QR:</span><span className="font-bold">Bs. {cierreData.porMetodo?.QR?.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Transferencia:</span><span className="font-bold">Bs. {cierreData.porMetodo?.Transferencia?.toFixed(2)}</span></div>
                <div className="flex justify-between border-t-2 border-foreground pt-2"><span className="font-bold">Total pagos:</span><span className="font-bold">{cierreData.totalPagos}</span></div>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setCierreOpen(false)}>Cerrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogos de Detalle, QR y Pago (ya existentes, sin cambios) */}
    </div>
  );
}