"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Calendar, Clock, Plus, Trash2, Ban, User, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

interface Disponibilidad {
  id: number;
  groomerId: number;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  intervaloDescanso?: { inicio: string; fin: string };
  groomer: { usuario: { nombre: string; apellido: string } };
}

interface Bloqueo {
  id: number;
  groomerId: number | null;
  tipo: string;
  fechaInicio: string;
  fechaFin: string;
  descripcion: string | null;
  groomer: { usuario: { nombre: string; apellido: string } } | null;
}

interface Groomer {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
}

export default function AvailabilityPage() {
  const { user } = useAuthStore();
  const [disponibilidades, setDisponibilidades] = useState<Disponibilidad[]>([]);
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [groomers, setGroomers] = useState<Groomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number>(1); // Lunes por defecto
  const [horarioDialogOpen, setHorarioDialogOpen] = useState(false);
  const [bloqueoDialogOpen, setBloqueoDialogOpen] = useState(false);
  const [selectedGroomer, setSelectedGroomer] = useState<number | null>(null);

  const loadData = async () => {
    try {
      const [dispRes, bloqRes, groomersRes] = await Promise.all([
        api.get("/availability"),
        api.get("/availability/bloqueos"),
        api.get("/users/groomers"),
      ]);
      setDisponibilidades(dispRes.data.data || []);
      setBloqueos(bloqRes.data.data || []);
      
      // 👇 Mapear: usar groomer.id (de la tabla groomers), NO usuario.id
      const groomerList = (groomersRes.data.data || []).map((u: any) => ({
        id: u.groomer?.id || u.id,  // 👈 Usar groomer.id si existe
        usuarioId: u.id,             // Guardar usuario.id por separado
        nombre: u.nombre,
        apellido: u.apellido || "",
        email: u.email,
      }));
      setGroomers(groomerList);
      
      if (groomerList.length > 0 && !selectedGroomer) {
        setSelectedGroomer(groomerList[0].id);
      }
    } catch (error: any) {
      console.error("Error cargando datos:", error);
      toast.error("Error al cargar datos de disponibilidad");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Filtrar disponibilidad por groomer y día seleccionado
  const disponibilidadDia = disponibilidades.filter(
    d => d.diaSemana === selectedDay && (!selectedGroomer || d.groomerId === selectedGroomer)
  );

  // Bloqueos activos
  const bloqueosActivos = bloqueos.filter(b => new Date(b.fechaFin) >= new Date());

  const deleteDisponibilidad = async (id: number) => {
    try {
      await api.delete(`/availability/${id}`);
      toast.success("Horario eliminado");
      loadData();
    } catch { toast.error("Error al eliminar"); }
  };

  const deleteBloqueo = async (id: number) => {
    try {
      await api.delete(`/availability/bloqueos/${id}`);
      toast.success("Bloqueo eliminado");
      loadData();
    } catch { toast.error("Error al eliminar"); }
  };

  const getHorarioGroomer = (groomerId: number, dia: number) => {
    return disponibilidades.find(d => d.groomerId === groomerId && d.diaSemana === dia);
  };

  if (loading) return <LoadingSpinner text="Cargando agenda..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8" strokeWidth={3} />
          <div>
            <h1 className="text-3xl font-extrabold">Disponibilidad y Agenda</h1>
            <p className="text-sm font-semibold text-foreground/70">
              {groomers.length} groomer{groomers.length !== 1 && "s"} configurado{groomers.length !== 1 && "s"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setBloqueoDialogOpen(true)} variant="outline">
            <Ban className="mr-2 h-4 w-4" /> Nuevo Bloqueo
          </Button>
          <Button onClick={() => setHorarioDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Agregar Horario
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel izquierdo: Selector de groomer + Calendario de días */}
        <div className="space-y-4">
          {/* Selector de Groomer */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" /> Groomer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <select
                className="w-full h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold shadow-cartoon-sm focus:outline-none focus:ring-4 focus:ring-primary/50"
                value={selectedGroomer || ""}
                onChange={(e) => setSelectedGroomer(parseInt(e.target.value))}
              >
                <option value="">Todos los groomers</option>
                {groomers.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nombre} {g.apellido}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          {/* Selector de Días */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Día de la Semana</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {DIAS_CORTOS.map((dia, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedDay(index)}
                    className={`p-3 rounded-xl border-3 border-foreground text-center font-extrabold transition-all ${
                      selectedDay === index
                        ? "bg-primary shadow-cartoon-sm translate-x-[2px] translate-y-[2px]"
                        : "bg-white hover:bg-primary/20"
                    }`}
                  >
                    <span className="text-xs block">{dia}</span>
                  </button>
                ))}
              </div>
              <p className="text-center mt-3 font-extrabold text-lg">{DIAS[selectedDay]}</p>
            </CardContent>
          </Card>

          {/* Bloqueos Activos */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-rose" /> Bloqueos Activos ({bloqueosActivos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bloqueosActivos.length === 0 ? (
                <p className="text-xs text-foreground/50 font-semibold">No hay bloqueos activos</p>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {bloqueosActivos.slice(0, 5).map((b) => (
                    <div key={b.id} className="flex items-center justify-between p-2 border-2 border-foreground rounded-xl bg-rose/10 text-xs">
                      <div>
                        <Badge variant="destructive" className="text-[10px]">{b.tipo}</Badge>
                        <p className="font-bold mt-1">
                          {new Date(b.fechaInicio).toLocaleDateString()} → {new Date(b.fechaFin).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="destructive" size="sm" className="h-7 w-7 p-0" onClick={() => deleteBloqueo(b.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Panel derecho: Detalle del día seleccionado */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horarios del {DIAS[selectedDay]}
                {selectedGroomer && (
                  <Badge variant="outline">
                    {groomers.find(g => g.id === selectedGroomer)?.nombre}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {groomers.length === 0 ? (
                <EmptyState icon={<User className="h-12 w-12" />} title="No hay groomers" description="Registra un groomer primero" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-3 border-foreground text-left">
                        <th className="pb-3 font-extrabold px-2">Groomer</th>
                        <th className="pb-3 font-extrabold px-2">Horario</th>
                        <th className="pb-3 font-extrabold px-2">Descanso</th>
                        <th className="pb-3 font-extrabold px-2 text-center">Estado</th>
                        <th className="pb-3 font-extrabold px-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedGroomer ? (
                        // Mostrar solo el groomer seleccionado
                        (() => {
                          const horario = getHorarioGroomer(selectedGroomer, selectedDay);
                          const groomer = groomers.find(g => g.id === selectedGroomer);
                          return (
                            <tr key={selectedGroomer} className="border-b-2 border-foreground/20">
                              <td className="py-3 px-2 font-bold">{groomer?.nombre} {groomer?.apellido}</td>
                              <td className="py-3 px-2">
                                {horario ? (
                                  <span className="font-mono font-bold">{horario.horaInicio} - {horario.horaFin}</span>
                                ) : (
                                  <span className="text-foreground/40">Sin horario</span>
                                )}
                              </td>
                              <td className="py-3 px-2 text-xs">
                                {horario?.intervaloDescanso 
                                  ? `${horario.intervaloDescanso.inicio} - ${horario.intervaloDescanso.fin}`
                                  : "—"}
                              </td>
                              <td className="py-3 px-2 text-center">
                                {horario ? (
                                  <Badge variant="default">Configurado</Badge>
                                ) : (
                                  <Badge variant="destructive">Sin configurar</Badge>
                                )}
                              </td>
                              <td className="py-3 px-2">
                                {horario && (
                                  <Button variant="destructive" size="sm" className="h-7 w-7 p-0" onClick={() => deleteDisponibilidad(horario.id)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })()
                      ) : (
                        // Mostrar todos los groomers
                        groomers.map((g) => {
                          const horario = getHorarioGroomer(g.id, selectedDay);
                          return (
                            <tr key={g.id} className="border-b-2 border-foreground/20">
                              <td className="py-3 px-2 font-bold">{g.nombre} {g.apellido}</td>
                              <td className="py-3 px-2">
                                {horario ? (
                                  <span className="font-mono font-bold">{horario.horaInicio} - {horario.horaFin}</span>
                                ) : (
                                  <span className="text-foreground/40">Sin horario</span>
                                )}
                              </td>
                              <td className="py-3 px-2 text-xs">
                                {horario?.intervaloDescanso 
                                  ? `${horario.intervaloDescanso.inicio} - ${horario.intervaloDescanso.fin}`
                                  : "—"}
                              </td>
                              <td className="py-3 px-2 text-center">
                                {horario ? (
                                  <Badge variant="default">Configurado</Badge>
                                ) : (
                                  <Badge variant="destructive">Sin configurar</Badge>
                                )}
                              </td>
                              <td className="py-3 px-2">
                                {horario && (
                                  <Button variant="destructive" size="sm" className="h-7 w-7 p-0" onClick={() => deleteDisponibilidad(horario.id)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Diálogo Agregar Horario */}
      <HorarioDialog
        open={horarioDialogOpen}
        onOpenChange={setHorarioDialogOpen}
        groomers={groomers}
        diaSemana={selectedDay}
        onSuccess={() => { setHorarioDialogOpen(false); loadData(); }}
      />

      {/* Diálogo Agregar Bloqueo */}
      <BloqueoDialog
        open={bloqueoDialogOpen}
        onOpenChange={setBloqueoDialogOpen}
        groomers={groomers}
        onSuccess={() => { setBloqueoDialogOpen(false); loadData(); }}
      />
    </div>
  );
}

// Componente Diálogo de Horario
function HorarioDialog({ open, onOpenChange, groomers, diaSemana, onSuccess }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groomers: Groomer[];
  diaSemana: number;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    groomerId: groomers[0]?.id || 0,
    diaSemana: diaSemana,
    horaInicio: "08:00",
    horaFin: "18:00",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm(prev => ({ ...prev, diaSemana, groomerId: groomers[0]?.id || 0 }));
  }, [diaSemana, groomers]);

  const handleSubmit = async () => {
    if (!form.groomerId) return toast.error("Selecciona un groomer");
    if (form.horaInicio >= form.horaFin) return toast.error("Hora fin debe ser mayor");

    setLoading(true);
    try {
      await api.post("/availability", form);
      toast.success(`Horario agregado para ${DIAS[form.diaSemana]}`);
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al agregar horario");
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Horario - {DIAS[diaSemana]}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Groomer *</Label>
            <select
              className="w-full h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold"
              value={form.groomerId}
              onChange={e => setForm({...form, groomerId: parseInt(e.target.value)})}
            >
              {groomers.map(g => (
                <option key={g.id} value={g.id}>{g.nombre} {g.apellido}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Hora Inicio</Label>
              <Input type="time" value={form.horaInicio} onChange={e => setForm({...form, horaInicio: e.target.value})} />
            </div>
            <div>
              <Label>Hora Fin</Label>
              <Input type="time" value={form.horaFin} onChange={e => setForm({...form, horaFin: e.target.value})} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Guardando..." : "Agregar Horario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Componente Diálogo de Bloqueo
function BloqueoDialog({ open, onOpenChange, groomers, onSuccess }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groomers: Groomer[];
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    tipo: "FERIADO",
    fechaInicio: "",
    fechaFin: "",
    descripcion: "",
    groomerId: null as number | null,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.fechaInicio || !form.fechaFin) return toast.error("Selecciona fechas");
    if (new Date(form.fechaFin) <= new Date(form.fechaInicio)) return toast.error("Fecha fin debe ser posterior");

    setLoading(true);
    try {
      await api.post("/availability/bloqueos", {
        ...form,
        fechaInicio: new Date(form.fechaInicio).toISOString(),
        fechaFin: new Date(form.fechaFin).toISOString(),
        groomerId: form.groomerId || null,
      });
      toast.success("Bloqueo creado exitosamente");
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al crear bloqueo");
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo Bloqueo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Tipo de Bloqueo *</Label>
            <select
              className="w-full h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold"
              value={form.tipo}
              onChange={e => setForm({...form, tipo: e.target.value})}
            >
              <option value="FERIADO">Feriado</option>
              <option value="VACACIONES">Vacaciones</option>
              <option value="MANTENIMIENTO">Mantenimiento</option>
              <option value="AUSENCIA">Ausencia</option>
            </select>
          </div>
          <div>
            <Label>Groomer afectado (opcional - vacío = global)</Label>
            <select
              className="w-full h-12 rounded-xl border-3 border-foreground bg-white px-4 font-bold"
              value={form.groomerId || ""}
              onChange={e => setForm({...form, groomerId: e.target.value ? parseInt(e.target.value) : null})}
            >
              <option value="">Todos (global)</option>
              {groomers.map(g => (
                <option key={g.id} value={g.id}>{g.nombre} {g.apellido}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fecha Inicio *</Label>
              <Input type="date" value={form.fechaInicio} onChange={e => setForm({...form, fechaInicio: e.target.value})} />
            </div>
            <div>
              <Label>Fecha Fin *</Label>
              <Input type="date" value={form.fechaFin} onChange={e => setForm({...form, fechaFin: e.target.value})} />
            </div>
          </div>
          <div>
            <Label>Descripción</Label>
            <Input placeholder="Motivo del bloqueo..." value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Creando..." : "Crear Bloqueo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}