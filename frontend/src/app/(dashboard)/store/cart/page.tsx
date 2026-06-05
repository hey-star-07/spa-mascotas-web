"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { getImageUrl } from "@/lib/images";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { ShoppingCart, Trash2, ArrowLeft, Send, User, Phone, MapPin, FileText, CheckCircle, Printer } from "lucide-react";
import { toast } from "sonner";

interface CartItem {
  id: number;
  cantidad: number;
  precioUnitario: number;
  producto: { id: number; nombre: string; imagenUrl: string | null; sku: string };
  variante: { id: number; atributo: string; valor: string } | null;
}

interface CartData {
  id: number;
  detalles: CartItem[];
  subtotal: number;
  total: number;
}

type PasoCompra = "carrito" | "datos-recibo" | "resumen" | "confirmado";

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [paso, setPaso] = useState<PasoCompra>("carrito");

  // Datos del recibo
  const [datosRecibo, setDatosRecibo] = useState({
    nombre: "",
    ci: "",
    telefono: "",
    direccion: "",
    email: "",
  });

  // WhatsApp
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [pedidoResult, setPedidoResult] = useState<any>(null);

  useEffect(() => { loadCart(); }, []);

  const loadCart = async () => {
    try {
      const { data } = await api.get("/store/cart");
      setCart(data.data);
    } catch { toast.error("Error al cargar carrito"); }
    finally { setLoading(false); }
  };

  const removeItem = async (detalleId: number) => {
    try {
      await api.delete(`/store/cart/${detalleId}`);
      toast.success("Eliminado");
      loadCart();
    } catch { toast.error("Error"); }
  };

  const irAPasoDatos = () => {
    if (!cart || cart.detalles.length === 0) return toast.error("Carrito vacío");
    setPaso("datos-recibo");
  };

  const irAPasoResumen = () => {
    if (!datosRecibo.nombre || !datosRecibo.ci || !datosRecibo.telefono) {
      return toast.error("Completa los campos requeridos: Nombre, CI y Teléfono");
    }
    setPaso("resumen");
  };

  const enviarPedido = async () => {
    if (!whatsappNumber) return toast.error("Ingresa tu número de WhatsApp");
    setSending(true);
    try {
      const { data } = await api.post("/store/pedido", {
        metodoContacto: "WhatsApp",
        contactoDestino: whatsappNumber,
      });
      setPedidoResult(data.data);
      setPaso("confirmado");
      toast.success("Pedido enviado exitosamente");
      
      // 👇 Abrir WhatsApp en una nueva pestaña (con delay para evitar bloqueo)
      setTimeout(() => {
        const link = data.data.whatsappLink;
        if (link) {
          window.open(link, "_blank", "noopener,noreferrer");
        }
      }, 500);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al enviar pedido");
    } finally { setSending(false); }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <LoadingSpinner text="Cargando carrito..." />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Navegación de pasos */}
      {paso !== "confirmado" && (
        <div className="flex items-center gap-2 text-sm">
          <Button variant="ghost" onClick={() => router.push("/store")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Tienda
          </Button>
          <span className="text-foreground/30">/</span>
          <span className={`font-bold ${paso === "carrito" ? "text-primary" : "text-foreground/50"}`}>Carrito</span>
          <span className="text-foreground/30">/</span>
          <span className={`font-bold ${paso === "datos-recibo" ? "text-primary" : "text-foreground/50"}`}>Datos</span>
          <span className="text-foreground/30">/</span>
          <span className={`font-bold ${paso === "resumen" ? "text-primary" : "text-foreground/50"}`}>Confirmar</span>
        </div>
      )}

      {/* PASO 1: CARRITO */}
      {paso === "carrito" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-6 w-6" /> Mi Carrito
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!cart || cart.detalles.length === 0 ? (
              <EmptyState icon={<ShoppingCart className="h-12 w-12" />} title="Carrito vacío" />
            ) : (
              <div className="space-y-3">
                {cart.detalles.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border-2 border-foreground rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                        {item.producto.imagenUrl ? (
                          <img src={getImageUrl(item.producto.imagenUrl) || ''} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <ShoppingCart className="h-6 w-6 text-foreground/30" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{item.producto.nombre}</p>
                        {item.variante && <p className="text-xs">{item.variante.valor}</p>}
                        <p className="text-xs">Bs. {Number(item.precioUnitario).toFixed(2)} x {item.cantidad}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-extrabold">Bs. {(Number(item.precioUnitario) * item.cantidad).toFixed(2)}</p>
                      <Button variant="destructive" size="sm" onClick={() => removeItem(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          {cart && cart.detalles.length > 0 && (
            <CardFooter>
              <div className="w-full space-y-3">
                <div className="flex justify-between text-lg font-extrabold border-t-3 border-foreground pt-4">
                  <span>Total:</span>
                  <span>Bs. {cart.total.toFixed(2)}</span>
                </div>
                <Button onClick={irAPasoDatos} className="w-full" variant="accent" size="lg">
                  Continuar
                  <ArrowLeft className="ml-2 h-5 w-5 rotate-180" />
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
      )}

      {/* PASO 2: DATOS DEL RECIBO */}
      {paso === "datos-recibo" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6" /> Datos para el Recibo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="flex items-center gap-1"><User className="h-4 w-4" /> Nombre completo *</Label>
                <Input value={datosRecibo.nombre} onChange={e => setDatosRecibo({...datosRecibo, nombre: e.target.value})} placeholder="Juan Pérez" />
              </div>
              <div>
                <Label>CI (Cédula) *</Label>
                <Input value={datosRecibo.ci} onChange={e => setDatosRecibo({...datosRecibo, ci: e.target.value})} placeholder="12345678 LP" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="flex items-center gap-1"><Phone className="h-4 w-4" /> Teléfono *</Label>
                <Input value={datosRecibo.telefono} onChange={e => setDatosRecibo({...datosRecibo, telefono: e.target.value})} placeholder="+591 77777777" />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={datosRecibo.email} onChange={e => setDatosRecibo({...datosRecibo, email: e.target.value})} placeholder="juan@email.com" type="email" />
              </div>
            </div>
            <div>
              <Label className="flex items-center gap-1"><MapPin className="h-4 w-4" /> Dirección</Label>
              <Input value={datosRecibo.direccion} onChange={e => setDatosRecibo({...datosRecibo, direccion: e.target.value})} placeholder="Calle Los Pinos #123" />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setPaso("carrito")} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver
              </Button>
              <Button onClick={irAPasoResumen} variant="accent" className="flex-1">
                Confirmar Datos
                <CheckCircle className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PASO 3: RESUMEN Y ENVÍO */}
      {paso === "resumen" && cart && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6" /> Resumen del Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Datos del cliente */}
            <div className="bg-secondary/30 rounded-xl p-3 text-sm space-y-1">
              <p><strong>Cliente:</strong> {datosRecibo.nombre}</p>
              <p><strong>CI:</strong> {datosRecibo.ci}</p>
              <p><strong>Tel:</strong> {datosRecibo.telefono}</p>
              {datosRecibo.email && <p><strong>Email:</strong> {datosRecibo.email}</p>}
              {datosRecibo.direccion && <p><strong>Dirección:</strong> {datosRecibo.direccion}</p>}
            </div>

            {/* Productos */}
            <div>
              <p className="font-bold text-sm mb-2">Productos:</p>
              <div className="space-y-2">
                {cart.detalles.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm border-b border-foreground/10 pb-1">
                    <span>{item.producto.nombre} x{item.cantidad}</span>
                    <span className="font-bold">Bs. {(Number(item.precioUnitario) * item.cantidad).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totales */}
            <div className="border-t-3 border-foreground pt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>Bs. {cart.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-extrabold">
                <span>Total:</span>
                <span>Bs. {cart.total.toFixed(2)}</span>
              </div>
            </div>

            {/* WhatsApp */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Phone className="h-4 w-4" /> Número de WhatsApp para recibir el pedido *
              </Label>
              <Input
                placeholder="+591 77777777"
                value={whatsappNumber}
                onChange={e => setWhatsappNumber(e.target.value)}
              />
              <p className="text-[10px] text-foreground/50">Recibirás el detalle de tu pedido por WhatsApp</p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setPaso("datos-recibo")} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver
              </Button>
              <Button onClick={enviarPedido} className="flex-1" variant="accent" disabled={sending}>
                <Send className="mr-2 h-5 w-5" />
                {sending ? "Enviando..." : "Enviar Pedido por WhatsApp"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PASO 4: CONFIRMADO */}
      {paso === "confirmado" && pedidoResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <CheckCircle className="h-8 w-8" /> Pedido Enviado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-primary/10 border-2 border-primary rounded-xl p-4 text-center">
              <p className="text-sm font-bold">Tu pedido ha sido enviado exitosamente</p>
              <p className="text-xs mt-1">Revisa tu WhatsApp para ver el detalle</p>
            </div>

            {/* Recibo */}
            <div id="recibo-impresion" className="border-3 border-foreground rounded-xl p-4 space-y-3 bg-white">
              <div className="text-center border-b-2 border-foreground pb-3">
                <p className="text-xl font-extrabold">Pet Spa</p>
                <p className="text-xs">Sistema de Gestión de Grooming</p>
                <p className="text-[10px] text-foreground/50">{new Date().toLocaleDateString()}</p>
              </div>

              <div className="text-sm space-y-1">
                <p><strong>Cliente:</strong> {datosRecibo.nombre}</p>
                <p><strong>CI:</strong> {datosRecibo.ci}</p>
                <p><strong>Tel:</strong> {datosRecibo.telefono}</p>
              </div>

              <div className="border-t-2 border-foreground pt-2">
                <p className="font-bold text-xs mb-2">PRODUCTOS:</p>
                {cart?.detalles.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs border-b border-dashed border-foreground/20 py-1">
                    <span>{item.producto.nombre} x{item.cantidad}</span>
                    <span className="font-bold">Bs. {(Number(item.precioUnitario) * item.cantidad).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-foreground pt-2 text-right">
                <p className="text-sm"><strong>Total: Bs. {cart?.total.toFixed(2)}</strong></p>
              </div>

              <div className="text-center text-[10px] text-foreground/50 border-t-2 border-foreground pt-2">
                <p>¡Gracias por tu compra!</p>
                <p>Pet Spa - Cuidamos a tus mascotas</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handlePrint} variant="outline" className="flex-1">
                <Printer className="mr-2 h-4 w-4" /> Imprimir Recibo
              </Button>
              <Button onClick={() => router.push("/billing")} variant="secondary" className="flex-1">
                <FileText className="mr-2 h-4 w-4" /> Ver Facturación
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}