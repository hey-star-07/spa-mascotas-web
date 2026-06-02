"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { ShoppingCart, Trash2, ArrowLeft, Send, MessageCircle } from "lucide-react";
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

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");

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

  const enviarPedido = async () => {
    if (!whatsappNumber) return toast.error("Ingresa tu número de WhatsApp");
    setSending(true);
    try {
      const { data } = await api.post("/store/pedido", {
        metodoContacto: "WhatsApp",
        contactoDestino: whatsappNumber,
      });
      toast.success("Pedido generado");
      // Abrir WhatsApp
      window.open(data.data.whatsappLink, "_blank");
      router.push("/store");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error");
    } finally { setSending(false); }
  };

  if (loading) return <LoadingSpinner text="Cargando carrito..." />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.push("/store")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Seguir comprando
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" /> Mi Carrito
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!cart || cart.detalles.length === 0 ? (
            <EmptyState icon={<ShoppingCart className="h-12 w-12" />} title="Carrito vacío" description="Agrega productos desde la tienda" />
          ) : (
            <div className="space-y-3">
              {cart.detalles.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border-2 border-foreground rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                      {item.producto.imagenUrl ? (
                        <img src={`http://localhost:3000${item.producto.imagenUrl}`} className="w-full h-full object-cover rounded-lg" />
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
          <CardFooter className="flex-col gap-4">
            <div className="w-full flex justify-between text-lg font-extrabold border-t-3 border-foreground pt-4">
              <span>Total:</span>
              <span>Bs. {cart.total.toFixed(2)}</span>
            </div>
            <div className="w-full space-y-2">
              <Label>Tu número de WhatsApp</Label>
              <Input
                placeholder="+591 77777777"
                value={whatsappNumber}
                onChange={e => setWhatsappNumber(e.target.value)}
              />
            </div>
            <Button onClick={enviarPedido} className="w-full" variant="accent" disabled={sending}>
              <Send className="mr-2 h-5 w-5" />
              {sending ? "Generando pedido..." : "Enviar pedido por WhatsApp"}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}