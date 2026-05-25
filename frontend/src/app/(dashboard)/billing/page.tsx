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
import { Receipt, Plus, DollarSign, QrCode, Wallet, Banknote, Eye } from "lucide-react";
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
  cliente: { usuario: { nombre: string; apellido: string } };
  detalles: Array<{ concepto: string; cantidad: number; precioUnitario: number; total: number }>;
  pagos: Array<{ monto: number; metodoPago: string; fechaPago: string }>;
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

  const estadoColor: Record<string, string> = {
    Pendiente: "bg-accent",
    Pagada: "bg-primary",
    Cancelada: "bg-rose",
  };

  const metodoIcon = (metodo: string) => {
    switch (metodo) {
      case 'Efectivo': return <Banknote className="h-4 w-4" />;
      case 'QR': return <QrCode className="h-4 w-4" />;
      case 'Transferencia': return <Wallet className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  if (loading) return <LoadingSpinner text="Cargando facturas..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Receipt className="h-8 w-8" strokeWidth={3} />
          <div>
            <h1 className="text-3xl font-extrabold">Facturación</h1>
            <p className="text-sm font-semibold text-foreground/70">{facturas.length} factura{facturas.length !== 1 && "s"}</p>
          </div>
        </div>
      </div>

      {facturas.length === 0 ? (
        <EmptyState icon={<Receipt className="h-12 w-12" />} title="Sin facturas" description="No hay facturas registradas" />
      ) : (
        <div className="space-y-3">
          {facturas.map((f) => (
            <Card key={f.id} className="hover:shadow-cartoon-hover transition-all">
              <CardContent className="flex items-center justify-between py-4 flex-wrap gap-3">
                <div>
                  <p className="font-extrabold text-lg">{f.numeroFactura}</p>
                  <p className="text-xs">{new Date(f.fechaEmision).toLocaleDateString()}</p>
                  <p className="text-sm font-semibold">{f.cliente.usuario.nombre} {f.cliente.usuario.apellido}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-extrabold">Bs. {Number(f.total).toFixed(2)}</p>
                  <Badge className={estadoColor[f.estado] || "bg-gray-300"}>{f.estado}</Badge>
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

      {/* Diálogo Detalle */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Factura {selectedFactura?.numeroFactura}</DialogTitle></DialogHeader>
          {selectedFactura && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span>Cliente:</span><span className="font-bold">{selectedFactura.cliente.usuario.nombre}</span></div>
              <table className="w-full text-sm">
                <thead><tr className="border-b-2 border-foreground"><th className="text-left py-1">Concepto</th><th className="text-center">Cant</th><th className="text-right">Precio</th><th className="text-right">Total</th></tr></thead>
                <tbody>
                  {selectedFactura.detalles.map((d, i) => (
                    <tr key={i} className="border-b border-foreground/20">
                      <td className="py-1">{d.concepto}</td>
                      <td className="text-center">{d.cantidad}</td>
                      <td className="text-right">Bs. {Number(d.precioUnitario).toFixed(2)}</td>
                      <td className="text-right font-bold">Bs. {Number(d.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-right space-y-1">
                <p className="text-sm">Subtotal: Bs. {Number(selectedFactura.subtotal).toFixed(2)}</p>
                <p className="text-sm">Impuesto: Bs. {Number(selectedFactura.impuesto).toFixed(2)}</p>
                <p className="text-xl font-extrabold">Total: Bs. {Number(selectedFactura.total).toFixed(2)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo QR */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader><DialogTitle>QR de Pago</DialogTitle></DialogHeader>
          {qrImage && (
            <div className="space-y-3">
              <img src={qrImage} alt="QR Pago" className="mx-auto border-3 border-foreground rounded-xl" />
              <p className="text-sm font-bold">Factura: {selectedFactura?.numeroFactura}</p>
              <p className="text-xl font-extrabold">Bs. {Number(selectedFactura?.total).toFixed(2)}</p>
              <p className="text-xs text-foreground/50">Escanee este QR para realizar el pago</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo Registrar Pago */}
      <Dialog open={pagoOpen} onOpenChange={setPagoOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Pago</DialogTitle></DialogHeader>
          <RegistrarPagoForm
            factura={selectedFactura}
            onSuccess={() => { setPagoOpen(false); loadFacturas(); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RegistrarPagoForm({ factura, onSuccess }: { factura: Factura | null; onSuccess: () => void }) {
  const [form, setForm] = useState<{ monto: number; metodoPago: string; referenciaTransaccion: string }>({ 
    monto: factura?.total || 0, 
    metodoPago: 'Efectivo', 
    referenciaTransaccion: '' 
    });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!factura) return;
    setLoading(true);
    try {
      await api.post('/billing/pagos', { facturaId: factura.id, ...form });
      toast.success('Pago registrado exitosamente');
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrar pago');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-3">
      <div><Label>Monto</Label><Input type="number" value={form.monto} onChange={e => setForm({...form, monto: parseFloat(e.target.value)})} /></div>
      <div>
        <Label>Método de Pago</Label>
        <select className="w-full h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold" value={form.metodoPago} onChange={e => setForm({...form, metodoPago: e.target.value})}>
          <option value="Efectivo">Efectivo</option>
          <option value="QR">QR</option>
          <option value="Transferencia">Transferencia</option>
        </select>
      </div>
      {form.metodoPago === 'Transferencia' && (
        <div><Label>Referencia</Label><Input value={form.referenciaTransaccion} onChange={e => setForm({...form, referenciaTransaccion: e.target.value})} /></div>
      )}
      <DialogFooter>
        <Button onClick={handleSubmit} disabled={loading}>{loading ? 'Registrando...' : 'Registrar Pago'}</Button>
      </DialogFooter>
    </div>
  );
}
