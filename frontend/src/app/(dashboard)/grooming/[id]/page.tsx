"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { getImageUrl } from "@/lib/images";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Dog, Scissors, Camera, CheckCircle, XCircle, Lock, AlertTriangle, Save, ClipboardList, MessageSquare, User, Clock, Calendar } from "lucide-react";
import { toast } from "sonner";

interface FichaDetail {
  id: number;
  citaId: number;
  razaTamanoMomento: string | null;
  temperaturaAnimal: number | null;
  notasInternas: string | null;
  fechaCierre: string | null;
  estadoIngreso: string | null;
  comportamiento: string | null;
  recomendaciones: string | null;
  cita: {
    fechaHoraInicio: string;
    estado: string;
    mascota: {
      id: number;
      nombre: string;
      raza: string | null;
      tamanio: string | null;
      alergiasConocidas: string | null;
      temperamento: string | null;
      imagen: string | null;
    };
    servicio: { id: number; nombre: string; duracionBaseMinutos: number };
    groomer: { id: number; usuario: { nombre: string; apellido: string } };
  };
  checklist: Array<{
    id: number;
    completado: boolean;
    observacion: string | null;
    plantillaChecklist: { id: number; item: string; requiereObservacion: boolean };
  }>;
  fotos: Array<{ id: number; tipo: string; urlFoto: string }>;
  consumoInsumos: Array<{
    id: number;
    producto: { id: number; nombre: string; sku: string };
    variante: { id: number; atributo: string; valor: string } | null;
    cantidad: number;
    merma: boolean;
    devuelto: boolean;
  }>;
}

export default function FichaTecnicaPage() {
  const params = useParams();
  const router = useRouter();
  const [ficha, setFicha] = useState<FichaDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados para edición
  const [estadoIngreso, setEstadoIngreso] = useState("");
  const [comportamiento, setComportamiento] = useState("");
  const [recomendaciones, setRecomendaciones] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [fotoTipo, setFotoTipo] = useState<"antes" | "despues">("antes");
  const [savingEstado, setSavingEstado] = useState(false);
  const [savingRecomendaciones, setSavingRecomendaciones] = useState(false);

  // Estados para insumos
  const [insumoProductoId, setInsumoProductoId] = useState("");
  const [insumoCantidad, setInsumoCantidad] = useState("");
  const [productos, setProductos] = useState<any[]>([]);
  const [addingInsumo, setAddingInsumo] = useState(false);

  const loadFicha = async () => {
    try {
      const { data } = await api.get(`/grooming/fichas/${params.id}`);
      setFicha(data.data);
      setEstadoIngreso(data.data.estadoIngreso || "");
      setComportamiento(data.data.comportamiento || "");
      setRecomendaciones(data.data.recomendaciones || "");
    } catch {
      toast.error("Error al cargar ficha");
      router.push("/groomer-dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFicha();
    // Cargar productos para insumos
    api.get("/inventory/productos").then(({ data }) => setProductos(data.data || []));
  }, [params.id]);

  // ============================================
  // CHECKLIST
  // ============================================
  const toggleChecklist = async (itemId: number, currentValue: boolean) => {
    try {
      await api.put(`/grooming/checklist/${itemId}`, { completado: !currentValue });
      loadFicha();
    } catch { toast.error("Error al actualizar checklist"); }
  };

  // ============================================
  // ESTADO DE INGRESO
  // ============================================
  const guardarEstadoIngreso = async () => {
    setSavingEstado(true);
    try {
      await api.put(`/grooming/fichas/${ficha?.id}`, {
        estadoIngreso,
        comportamiento,
      });
      toast.success("Estado de ingreso guardado");
    } catch { toast.error("Error al guardar"); }
    finally { setSavingEstado(false); }
  };

  // ============================================
  // RECOMENDACIONES
  // ============================================
  const guardarRecomendaciones = async () => {
    setSavingRecomendaciones(true);
    try {
      await api.put(`/grooming/fichas/${ficha?.id}`, { recomendaciones });
      toast.success("Recomendaciones guardadas");
    } catch { toast.error("Error al guardar"); }
    finally { setSavingRecomendaciones(false); }
  };

  // ============================================
  // FOTOS
  // ============================================
  const addFoto = async () => {
    if (!fotoUrl) return toast.error("Ingresa URL de la foto");
    try {
      await api.post("/grooming/fotos", {
        fichaGroomingId: ficha?.id,
        tipo: fotoTipo,
        urlFoto: fotoUrl,
      });
      toast.success("Foto agregada");
      setFotoUrl("");
      loadFicha();
    } catch { toast.error("Error al agregar foto"); }
  };

  const deleteFoto = async (fotoId: number) => {
    try {
      await api.delete(`/grooming/fotos/${fotoId}`);
      toast.success("Foto eliminada");
      loadFicha();
    } catch { toast.error("Error al eliminar"); }
  };

  // ============================================
  // INSUMOS
  // ============================================
  const addInsumo = async () => {
    if (!insumoProductoId || !insumoCantidad) return toast.error("Selecciona producto y cantidad");
    setAddingInsumo(true);
    try {
      await api.post("/grooming/insumos", {
        fichaGroomingId: ficha?.id,
        productoId: parseInt(insumoProductoId),
        cantidad: parseFloat(insumoCantidad),
      });
      toast.success("Insumo registrado");
      setInsumoProductoId("");
      setInsumoCantidad("");
      loadFicha();
    } catch { toast.error("Error al agregar insumo"); }
    finally { setAddingInsumo(false); }
  };

  const toggleMerma = async (insumoId: number, currentMerma: boolean) => {
    try {
      await api.put(`/grooming/insumos/${insumoId}`, { merma: !currentMerma });
      loadFicha();
    } catch { toast.error("Error"); }
  };

  const toggleDevuelto = async (insumoId: number, currentDevuelto: boolean) => {
    try {
      await api.put(`/grooming/insumos/${insumoId}`, { devuelto: !currentDevuelto });
      loadFicha();
    } catch { toast.error("Error"); }
  };

  // ============================================
  // CERRAR FICHA
  // ============================================
  const cerrarFicha = async () => {
    const completados = ficha?.checklist.filter(c => c.completado).length || 0;
    const total = ficha?.checklist.length || 0;

    if (total >= 5 && completados < 5) {
      return toast.error(`Completa al menos 5 items del checklist (${completados}/${total})`);
    }

    if (!confirm("¿Cerrar esta ficha? Se validará el checklist, descontarán los insumos y se notificará al cliente.")) return;

    try {
      await api.put(`/grooming/fichas/${ficha?.id}/cerrar`);
      toast.success("✅ Servicio finalizado. Cliente notificado.");
      router.push("/groomer-dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al cerrar ficha");
    }
  };

  if (loading) return <LoadingSpinner text="Cargando ficha técnica..." />;
  if (!ficha) return <p className="text-center py-8 font-bold">Ficha no encontrada</p>;

  const completados = ficha.checklist.filter(c => c.completado).length;
  const total = ficha.checklist.length;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/groomer-dashboard")}>
            ← Volver
          </Button>
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-2">
              <Scissors className="h-8 w-8" strokeWidth={3} />
              Ficha Técnica
            </h1>
            <p className="text-sm font-semibold text-foreground/70">
              <Dog className="inline h-4 w-4" /> {ficha.cita.mascota.nombre} — {ficha.cita.servicio.nombre}
            </p>
          </div>
        </div>
        {!ficha.fechaCierre ? (
          <Button onClick={cerrarFicha} variant="accent" size="lg" className="animate-pulse">
            <Lock className="mr-2 h-5 w-5" /> Cerrar Servicio
          </Button>
        ) : (
          <Badge variant="default" className="text-lg px-4 py-2">✅ Cerrada</Badge>
        )}
      </div>

      {/* Info general */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <User className="h-6 w-6 mx-auto mb-1" />
            <p className="text-xs text-foreground/70">Groomer</p>
            <p className="font-extrabold">{ficha.cita.groomer.usuario.nombre}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Calendar className="h-6 w-6 mx-auto mb-1" />
            <p className="text-xs text-foreground/70">Fecha</p>
            <p className="font-extrabold">{new Date(ficha.cita.fechaHoraInicio).toLocaleDateString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-1" />
            <p className="text-xs text-foreground/70">Servicio</p>
            <p className="font-extrabold">{ficha.cita.servicio.duracionBaseMinutos} min</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Badge variant={completados === total ? "default" : "secondary"} className="text-sm">
              {completados}/{total}
            </Badge>
            <p className="text-xs text-foreground/70 mt-1">Checklist</p>
          </CardContent>
        </Card>
      </div>

      {/* Datos de la mascota */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Datos de la Mascota</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-3">
            {ficha.cita.mascota.imagen ? (
              <img src={getImageUrl(ficha.cita.mascota.imagen) || ''} alt={ficha.cita.mascota.nombre}
                className="w-16 h-16 object-cover rounded-xl border-3 border-foreground" />
            ) : (
              <div className="w-16 h-16 rounded-xl border-3 border-foreground bg-primary flex items-center justify-center">
                <Dog className="h-8 w-8" />
              </div>
            )}
            <div>
              <p className="font-extrabold text-lg">{ficha.cita.mascota.nombre}</p>
              <p className="text-sm">{ficha.cita.mascota.raza || 'Raza no especificada'} • {ficha.cita.mascota.tamanio || 'Tamaño N/A'}</p>
            </div>
          </div>
          {ficha.cita.mascota.alergiasConocidas && (
            <div className="bg-rose/10 border-2 border-rose rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-rose flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-extrabold text-rose">Alergias/Alertas</p>
                <p className="text-xs">{ficha.cita.mascota.alergiasConocidas}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ESTADO DE INGRESO */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Estado de Ingreso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Estado físico al ingreso</Label>
            <textarea
              className="w-full min-h-[80px] rounded-xl border-3 border-foreground bg-white p-3 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-primary/50"
              placeholder="Describí el estado de la mascota al ingresar: nudos, heridas, pulgas, suciedad, etc."
              value={estadoIngreso}
              onChange={(e) => setEstadoIngreso(e.target.value)}
              disabled={!!ficha.fechaCierre}
            />
          </div>
          <div>
            <Label>Comportamiento durante el servicio</Label>
            <select
              className="w-full h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold focus:outline-none focus:ring-4 focus:ring-primary/50"
              value={comportamiento}
              onChange={(e) => setComportamiento(e.target.value)}
              disabled={!!ficha.fechaCierre}
            >
              <option value="">Seleccionar comportamiento</option>
              <option value="Tranquilo">Tranquilo — Cooperó durante el servicio</option>
              <option value="Nervioso">Nervioso — Requirió manejo cuidadoso</option>
              <option value="Agresivo">Agresivo — Requirió bozal o contención</option>
              <option value="Jugueton">Juguetón — Muy activo, difícil de mantener quieto</option>
            </select>
          </div>
          {!ficha.fechaCierre && (
            <Button variant="outline" size="sm" onClick={guardarEstadoIngreso} disabled={savingEstado}>
              <Save className="mr-2 h-3 w-3" />
              {savingEstado ? "Guardando..." : "Guardar estado de ingreso"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* CHECKLIST */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Checklist de Servicio</span>
            <Badge variant={completados === total ? "default" : "secondary"}>
              {completados}/{total} completado{completados !== 1 && "s"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {ficha.checklist.map((item) => (
              <div key={item.id}
                className={`flex items-center justify-between p-3 border-2 border-foreground rounded-xl transition-all ${
                  item.completado ? "bg-primary/20" : "bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => !ficha.fechaCierre && toggleChecklist(item.id, item.completado)}
                    disabled={!!ficha.fechaCierre}
                    className="transition-transform hover:scale-110"
                  >
                    {item.completado ? (
                      <CheckCircle className="h-6 w-6 text-primary" />
                    ) : (
                      <XCircle className="h-6 w-6 text-foreground/30" />
                    )}
                  </button>
                  <span className={`font-semibold text-sm ${item.completado ? "line-through text-foreground/50" : ""}`}>
                    {item.plantillaChecklist.item}
                  </span>
                </div>
                {item.plantillaChecklist.requiereObservacion && item.completado && (
                  <Input placeholder="Observación..." className="w-48 text-xs h-8" />
                )}
              </div>
            ))}
          </div>
          {total >= 5 && completados < 5 && !ficha.fechaCierre && (
            <p className="text-xs text-rose font-semibold mt-3 text-center">
              ⚠️ Completá al menos 5 items para poder cerrar el servicio
            </p>
          )}
        </CardContent>
      </Card>

      {/* FOTOS */}
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Camera className="h-5 w-5" /> Fotos Antes/Después</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            {ficha.fotos.map((foto) => (
              <div key={foto.id} className="relative group">
                <Badge className="absolute top-2 left-2 z-10">{foto.tipo}</Badge>
                <img src={getImageUrl(foto.urlFoto) || ''} alt={foto.tipo}
                  className="w-32 h-32 object-cover rounded-xl border-3 border-foreground" />
                {!ficha.fechaCierre && (
                  <button
                    onClick={() => deleteFoto(foto.id)}
                    className="absolute -top-2 -right-2 bg-rose text-white rounded-full p-1 border-2 border-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {!ficha.fechaCierre && (
            <div className="flex gap-3 items-end flex-wrap">
              <div>
                <Label>Tipo</Label>
                <select value={fotoTipo} onChange={e => setFotoTipo(e.target.value as any)}
                  className="h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold">
                  <option value="antes">Antes</option>
                  <option value="despues">Después</option>
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <Label>URL de la foto</Label>
                <Input value={fotoUrl} onChange={e => setFotoUrl(e.target.value)} placeholder="https://..." />
              </div>
              <Button onClick={addFoto}><Camera className="mr-2 h-4 w-4" /> Agregar Foto</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* INSUMOS */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Insumos Utilizados</CardTitle></CardHeader>
        <CardContent>
          {ficha.consumoInsumos.length === 0 ? (
            <p className="text-sm text-foreground/50">No se han registrado insumos para este servicio</p>
          ) : (
            <div className="space-y-2 mb-4">
              {ficha.consumoInsumos.map((insumo) => (
                <div key={insumo.id}
                  className={`flex items-center justify-between p-3 border-2 border-foreground rounded-xl text-sm ${
                    insumo.devuelto ? "bg-secondary/50" : insumo.merma ? "bg-rose/10" : ""
                  }`}>
                  <div>
                    <span className="font-bold">{insumo.producto.nombre}</span>
                    {insumo.variante && <span className="text-xs ml-1">({insumo.variante.valor})</span>}
                    <span className="ml-2 font-mono">{insumo.cantidad} uds</span>
                  </div>
                  <div className="flex gap-2">
                    {!ficha.fechaCierre && (
                      <>
                        <Button size="sm" variant={insumo.devuelto ? "default" : "outline"}
                          onClick={() => toggleDevuelto(insumo.id, insumo.devuelto)} className="text-[10px] h-7">
                          {insumo.devuelto ? "Devuelto ✓" : "Devolver"}
                        </Button>
                        <Button size="sm" variant={insumo.merma ? "destructive" : "outline"}
                          onClick={() => toggleMerma(insumo.id, insumo.merma)} className="text-[10px] h-7">
                          {insumo.merma ? "Merma ✓" : "Merma"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {!ficha.fechaCierre && (
            <div className="flex gap-3 items-end flex-wrap border-t-2 border-foreground/20 pt-4">
              <div>
                <Label>Producto</Label>
                <select value={insumoProductoId} onChange={e => setInsumoProductoId(e.target.value)}
                  className="h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold">
                  <option value="">Seleccionar</option>
                  {productos.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Cantidad</Label>
                <Input type="number" step="0.1" value={insumoCantidad}
                  onChange={e => setInsumoCantidad(e.target.value)} placeholder="1.0" className="w-24" />
              </div>
              <Button onClick={addInsumo} disabled={addingInsumo} variant="secondary">
                {addingInsumo ? "Agregando..." : "Agregar Insumo"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* RECOMENDACIONES */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Recomendaciones para el dueño
          </CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full min-h-[100px] rounded-xl border-3 border-foreground bg-white p-3 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-primary/50"
            placeholder="Ej: Se recomienda cepillado diario para evitar nudos, usar shampoo medicado, volver en 4 semanas para mantenimiento..."
            value={recomendaciones}
            onChange={(e) => setRecomendaciones(e.target.value)}
            disabled={!!ficha.fechaCierre}
          />
          {!ficha.fechaCierre && (
            <Button variant="outline" size="sm" className="mt-2" onClick={guardarRecomendaciones} disabled={savingRecomendaciones}>
              <Save className="mr-2 h-3 w-3" />
              {savingRecomendaciones ? "Guardando..." : "Guardar recomendaciones"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}