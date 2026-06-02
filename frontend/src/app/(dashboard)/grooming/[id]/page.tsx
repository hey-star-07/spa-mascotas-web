"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { getImageUrl } from "@/lib/images";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { RefreshCw } from "lucide-react";
import { Dog, Scissors, Camera, CheckCircle, Lock, AlertTriangle, Save, ClipboardList, MessageSquare, User, Clock, Calendar, Package, X, Upload } from "lucide-react";
import { toast } from "sonner";

// ============================================
// TIPOS
// ============================================
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

// ============================================
// COMPONENTE
// ============================================
export default function FichaTecnicaPage() {
  const params = useParams();
  const router = useRouter();
  const [ficha, setFicha] = useState<FichaDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados de edición
  const [estadoIngreso, setEstadoIngreso] = useState("");
  const [comportamiento, setComportamiento] = useState("");
  const [recomendaciones, setRecomendaciones] = useState("");
  const [savingEstado, setSavingEstado] = useState(false);
  const [savingRecomendaciones, setSavingRecomendaciones] = useState(false);
  const [notasInternas, setNotasInternas] = useState("");
  const [savingNotas, setSavingNotas] = useState(false);
  // Estados para FOTOS (subida de archivo)
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [fotoTipo, setFotoTipo] = useState<"antes" | "despues">("antes");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para INSUMOS
  const [insumoProductoId, setInsumoProductoId] = useState("");
  const [insumoCantidad, setInsumoCantidad] = useState("");
  const [productos, setProductos] = useState<any[]>([]);
  const [addingInsumo, setAddingInsumo] = useState(false);

  // ============================================
  // CARGA DE DATOS
  // ============================================
  const loadFicha = async () => {
    try {
      const { data } = await api.get(`/grooming/fichas/${params.id}`);
      setFicha(data.data);
      setEstadoIngreso(data.data.estadoIngreso || "");
      setComportamiento(data.data.comportamiento || "");
      setRecomendaciones(data.data.recomendaciones || "");
      setNotasInternas(data.data.notasInternas || "");
    } catch {
      toast.error("Error al cargar ficha");
      router.push("/groomer-dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!params.id || params.id === "undefined") {
      toast.error("Ficha no encontrada");
      router.push("/groomer-dashboard");
      return;
    }
    loadFicha();
    api.get("/inventory/productos").then(({ data }) => setProductos(data.data || []));
  }, [params.id]);

  // ============================================
  // CHECKLIST
  // ============================================
  const toggleChecklist = async (itemId: number) => {
    try {
      await api.put(`/grooming/checklist/${itemId}`, { completado: true });
      loadFicha();
    } catch { toast.error("Error al actualizar"); }
  };

  // ============================================
  // ESTADO DE INGRESO
  // ============================================
  const guardarEstadoIngreso = async () => {
    setSavingEstado(true);
    try {
      await api.put(`/grooming/fichas/${ficha?.id}`, { estadoIngreso, comportamiento });
      toast.success("Estado guardado");
    } catch { toast.error("Error"); }
    finally { setSavingEstado(false); }
  };

  const guardarNotasInternas = async () => {
    setSavingNotas(true);
    try {
      await api.put(`/grooming/fichas/${ficha?.id}`, { notasInternas });
      toast.success("Observaciones guardadas");
    } catch { toast.error("Error"); }
    finally { setSavingNotas(false); }
  };

  // ============================================
  // RECOMENDACIONES
  // ============================================
  const guardarRecomendaciones = async () => {
    setSavingRecomendaciones(true);
    try {
      await api.put(`/grooming/fichas/${ficha?.id}`, { recomendaciones });
      toast.success("Recomendaciones guardadas");
    } catch { toast.error("Error"); }
    finally { setSavingRecomendaciones(false); }
  };

  // ============================================
  // FOTOS - SUBIDA DE ARCHIVO (NO URL)
  // ============================================
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFoto(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const { data } = await api.post("/upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const imageUrl = data.data.url;

      // Guardar en la ficha
      await api.post("/grooming/fotos", {
        fichaGroomingId: ficha?.id,
        tipo: fotoTipo,
        urlFoto: imageUrl,
      });

      toast.success("Foto subida correctamente");
      loadFicha();
    } catch {
      toast.error("Error al subir foto");
    } finally {
      setUploadingFoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const deleteFoto = async (fotoId: number) => {
    try {
      await api.delete(`/grooming/fotos/${fotoId}`);
      toast.success("Foto eliminada");
      loadFicha();
    } catch { toast.error("Error"); }
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
    } catch { toast.error("Error"); }
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

  const regenerarChecklist = async () => {
    try {
      const { data } = await api.post(`/grooming/fichas/${ficha?.id}/regenerar-checklist`);
      toast.success(data.message || "Checklist regenerado");
      loadFicha();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al regenerar");
    }
  };

  // ============================================
  // CERRAR FICHA
  // ============================================
  const cerrarFicha = async () => {
    const completados = ficha?.checklist.filter((c) => c.completado).length || 0;
    const total = ficha?.checklist.length || 0;

    if (completados < total) {
      const pendientes = ficha?.checklist
        .filter((c) => !c.completado)
        .map((c) => c.plantillaChecklist.item)
        .join(", ");
      return toast.error(`Completa todos los items. Pendientes: ${pendientes}`);
    }

    if (total === 0) return toast.error("No hay items de checklist configurados.");

    const insumosUsados = ficha?.consumoInsumos.filter((i) => !i.devuelto) || [];
    const resumen = [
      `Checklist: ${completados}/${total} completado`,
      `Insumos a descontar: ${insumosUsados.length}`,
      `Groomer: ${ficha?.cita.groomer.usuario.nombre}`,
      "",
      "Confirmar cierre del servicio?",
    ].join("\n");

    if (!confirm(resumen)) return;

    try {
      await api.put(`/grooming/fichas/${ficha?.id}/cerrar`);
      toast.success("Servicio finalizado. Inventario actualizado. Cliente notificado.");
      router.push("/groomer-dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al cerrar ficha");
    }
  };

  // ============================================
  // RENDER
  // ============================================
  if (loading) return <LoadingSpinner text="Cargando ficha..." />;
  if (!ficha) return <p className="text-center py-8 font-bold">Ficha no encontrada</p>;

  const completados = ficha.checklist.filter((c) => c.completado).length;
  const total = ficha.checklist.length;
  const checklistCompleto = total > 0 && completados === total;

  return (
    <div className="space-y-6 pb-10">
      {/* HEADER */}
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

        {/* BOTÓN CERRAR - SIN PARPADEO, GRIS SI NO COMPLETO */}
        {!ficha.fechaCierre ? (
          checklistCompleto ? (
            <Button onClick={cerrarFicha} variant="accent" size="lg">
              <Lock className="mr-2 h-5 w-5" /> Cerrar Servicio
            </Button>
          ) : (
            <div className="text-right">
              <Button disabled variant="secondary" size="lg" className="opacity-60 cursor-not-allowed">
                <Lock className="mr-2 h-5 w-5" /> Completar Checklist ({completados}/{total})
              </Button>
              <p className="text-xs text-rose font-semibold mt-1">
                Completa los {total - completados} items restantes
              </p>
            </div>
          )
        ) : (
          <Badge variant="default" className="text-lg px-4 py-2">Servicio Cerrado</Badge>
        )}
      </div>

      {/* INFO GENERAL */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4 text-center"><User className="h-6 w-6 mx-auto mb-1" /><p className="text-xs">Groomer</p><p className="font-extrabold">{ficha.cita.groomer.usuario.nombre}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Calendar className="h-6 w-6 mx-auto mb-1" /><p className="text-xs">Fecha</p><p className="font-extrabold">{new Date(ficha.cita.fechaHoraInicio).toLocaleDateString()}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Clock className="h-6 w-6 mx-auto mb-1" /><p className="text-xs">Servicio</p><p className="font-extrabold">{ficha.cita.servicio.duracionBaseMinutos} min</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Badge variant={checklistCompleto ? "default" : "secondary"} className="text-sm">{completados}/{total}</Badge>
          <p className="text-xs mt-1">Checklist</p>
        </CardContent></Card>
      </div>

      {/* DATOS MASCOTA */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Datos de la Mascota</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-3">
            {ficha.cita.mascota.imagen ? (
              <img src={getImageUrl(ficha.cita.mascota.imagen) || ""} className="w-16 h-16 object-cover rounded-xl border-3 border-foreground" />
            ) : (
              <div className="w-16 h-16 rounded-xl border-3 border-foreground bg-primary flex items-center justify-center"><Dog className="h-8 w-8" /></div>
            )}
            <div>
              <p className="font-extrabold text-lg">{ficha.cita.mascota.nombre}</p>
              <p className="text-sm">{ficha.cita.mascota.raza || "Raza N/A"} • {ficha.cita.mascota.tamanio || "Tamaño N/A"}</p>
            </div>
          </div>
          {ficha.cita.mascota.alergiasConocidas && (
            <div className="bg-rose/10 border-2 border-rose rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-rose flex-shrink-0 mt-0.5" />
              <div><p className="text-sm font-extrabold text-rose">Alergias/Alertas</p><p className="text-xs">{ficha.cita.mascota.alergiasConocidas}</p></div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ESTADO DE INGRESO */}
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ClipboardList className="h-5 w-5" />Estado de Ingreso</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Estado físico al ingreso</Label>
            <textarea className="w-full min-h-[80px] rounded-xl border-3 border-foreground bg-white p-3 text-sm" placeholder="Nudos, heridas, pulgas, suciedad..." value={estadoIngreso} onChange={(e) => setEstadoIngreso(e.target.value)} disabled={!!ficha.fechaCierre} />
          </div>
          <div>
            <Label>Comportamiento</Label>
            <select className="w-full h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold" value={comportamiento} onChange={(e) => setComportamiento(e.target.value)} disabled={!!ficha.fechaCierre}>
              <option value="">Seleccionar</option>
              <option value="Tranquilo">Tranquilo</option>
              <option value="Nervioso">Nervioso</option>
              <option value="Agresivo">Agresivo</option>
              <option value="Jugueton">Juguetón</option>
            </select>
          </div>
          {!ficha.fechaCierre && <Button variant="outline" size="sm" onClick={guardarEstadoIngreso} disabled={savingEstado}><Save className="mr-2 h-3 w-3" />Guardar</Button>}
        </CardContent>
      </Card>

      {/* CHECKLIST */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Checklist de Servicio</CardTitle>
            <Badge variant={checklistCompleto ? "default" : "secondary"}>{completados}/{total}</Badge>
          </div>
          {total > 0 && (
            <div className="mt-3">
              <div className="flex gap-1">
                {Array.from({ length: total }).map((_, i) => (
                  <div key={i} className={`h-2.5 flex-1 rounded-full border-2 border-foreground transition-all ${i < completados ? (checklistCompleto ? "bg-primary" : "bg-accent") : "bg-gray-200"}`} />
                ))}
              </div>
              <div className="flex justify-between mt-1 text-[10px] text-foreground/50">
                <span>{checklistCompleto ? "Completado" : `${total - completados} pendiente(s)`}</span>
                <span>{Math.round((completados / Math.max(total, 1)) * 100)}%</span>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {total === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm font-semibold text-foreground/50 mb-3">
                No hay items de checklist para esta ficha.
              </p>
              {!ficha.fechaCierre && (
                <Button variant="outline" size="sm" onClick={regenerarChecklist}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Cargar checklist del servicio
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {ficha.checklist.map((item, index) => (
                <div key={item.id} className={`flex items-center justify-between p-3 border-2 border-foreground rounded-xl transition-all ${item.completado ? "bg-primary/20" : "bg-white"}`}>
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-xs font-bold text-foreground/40 w-5">{index + 1}.</span>
                    <button
                      onClick={() => !ficha.fechaCierre && !item.completado && toggleChecklist(item.id)}
                      disabled={!!ficha.fechaCierre || item.completado}
                      className="transition-transform hover:scale-110 flex-shrink-0"
                    >
                      {item.completado ? (
                        <CheckCircle className="h-6 w-6 text-primary" />
                      ) : (
                        <div className="h-6 w-6 rounded-full border-3 border-foreground/30 flex items-center justify-center">
                          <div className="h-3 w-3 rounded-full bg-foreground/20" />
                        </div>
                      )}
                    </button>
                    <span className={`font-semibold text-sm ${item.completado ? "line-through text-foreground/50" : ""}`}>
                      {item.plantillaChecklist.item}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!ficha.fechaCierre && completados < total && total > 0 && (
            <div className="mt-4 bg-rose/10 border-2 border-rose rounded-xl p-3">
              <p className="text-sm font-extrabold text-rose">Faltan {total - completados} item(s) por completar</p>
            </div>
          )}
          {!ficha.fechaCierre && checklistCompleto && (
            <div className="mt-4 bg-primary/20 border-2 border-primary rounded-xl p-3 text-center">
              <CheckCircle className="h-8 w-8 text-primary mx-auto mb-1" />
              <p className="text-sm font-extrabold text-primary">Checklist completo</p>
              <p className="text-xs text-foreground/70">Ya puedes cerrar el servicio</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* FOTOS - SUBIDA DE ARCHIVO */}
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Camera className="h-5 w-5" />Fotos Antes/Después</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            {ficha.fotos.map((foto) => (
              <div key={foto.id} className="relative group">
                <Badge className="absolute top-2 left-2 z-10">{foto.tipo === "antes" ? "Antes" : "Después"}</Badge>
                <img src={getImageUrl(foto.urlFoto) || ""} className="w-32 h-32 object-cover rounded-xl border-3 border-foreground" />
                {!ficha.fechaCierre && (
                  <button onClick={() => deleteFoto(foto.id)} className="absolute -top-2 -right-2 bg-rose text-white rounded-full p-1 border-2 border-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {!ficha.fechaCierre && (
            <div className="flex gap-3 items-end flex-wrap">
              <div>
                <Label>Tipo</Label>
                <select value={fotoTipo} onChange={(e) => setFotoTipo(e.target.value as any)} className="h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold">
                  <option value="antes">Antes</option>
                  <option value="despues">Después</option>
                </select>
              </div>
              <div>
                <Label>Seleccionar archivo</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadingFoto}>
                  <Upload className="mr-2 h-4 w-4" />
                  {uploadingFoto ? "Subiendo..." : "Elegir imagen"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* INSUMOS */}
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Package className="h-5 w-5" />Insumos del Servicio</CardTitle></CardHeader>
        <CardContent>
          {ficha.consumoInsumos.length === 0 ? (
            <p className="text-sm text-foreground/50 text-center py-4">No se han registrado insumos</p>
          ) : (
            <div className="space-y-2 mb-4">
              {ficha.consumoInsumos.map((insumo) => (
                <div key={insumo.id} className={`flex items-center justify-between p-2 border-2 border-foreground rounded-xl text-sm ${insumo.devuelto ? "bg-secondary/30" : insumo.merma ? "bg-rose/5" : ""}`}>
                  <div>
                    <span className="font-bold">{insumo.producto.nombre}</span>
                    <span className="ml-2 font-mono">{Number(insumo.cantidad)} uds</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {insumo.devuelto && <Badge variant="secondary" className="text-xs">Devuelto</Badge>}
                    {insumo.merma && <Badge variant="destructive" className="text-xs">Merma</Badge>}
                    {!ficha.fechaCierre && (
                      <div className="flex gap-1">
                        <Button size="sm" variant={insumo.devuelto ? "default" : "outline"} onClick={() => toggleDevuelto(insumo.id, insumo.devuelto)} className="text-[10px] h-7">Devolver</Button>
                        <Button size="sm" variant={insumo.merma ? "destructive" : "outline"} onClick={() => toggleMerma(insumo.id, insumo.merma)} className="text-[10px] h-7">Merma</Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {!ficha.fechaCierre && (
            <div className="flex gap-3 items-end border-t-2 pt-4">
              <select value={insumoProductoId} onChange={(e) => setInsumoProductoId(e.target.value)} className="h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold flex-1">
                <option value="">Producto</option>
                {productos.map((p: any) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
              <Input type="number" value={insumoCantidad} onChange={(e) => setInsumoCantidad(e.target.value)} placeholder="1.0" className="w-24" />
              <Button onClick={addInsumo} disabled={addingInsumo} variant="secondary">Agregar</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* NOTAS INTERNAS / OBSERVACIONES TÉCNICAS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Observaciones Técnicas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full min-h-[100px] rounded-xl border-3 border-foreground bg-white p-3 text-sm"
            placeholder="Notas internas del groomer (visibles solo para el equipo): técnicas utilizadas, productos aplicados, comportamiento de la mascota, etc."
            value={notasInternas}
            onChange={(e) => setNotasInternas(e.target.value)}
            disabled={!!ficha.fechaCierre}
          />
          {!ficha.fechaCierre && (
            <Button variant="outline" size="sm" className="mt-2" onClick={guardarNotasInternas} disabled={savingNotas}>
              <Save className="mr-2 h-3 w-3" />
              {savingNotas ? "Guardando..." : "Guardar observaciones"}
            </Button>
          )}
        </CardContent>
      </Card>
      {/* RECOMENDACIONES */}
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><MessageSquare className="h-5 w-5" />Recomendaciones</CardTitle></CardHeader>
        <CardContent>
          <textarea className="w-full min-h-[100px] rounded-xl border-3 border-foreground bg-white p-3 text-sm" placeholder="Recomendaciones para el dueño..." value={recomendaciones} onChange={(e) => setRecomendaciones(e.target.value)} disabled={!!ficha.fechaCierre} />
          {!ficha.fechaCierre && <Button variant="outline" size="sm" className="mt-2" onClick={guardarRecomendaciones}><Save className="mr-2 h-3 w-3" />Guardar</Button>}
        </CardContent>
      </Card>
    </div>
  );
}
