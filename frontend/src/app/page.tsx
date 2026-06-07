"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Scissors, Star, Heart, Phone, Mail, MapPin,
  Clock, Shield, Sparkles, ChevronDown, ChevronLeft,
  ChevronRight, Award, Leaf, Zap, Camera, ArrowRight,
  CheckCircle, MessageCircle, Instagram, Facebook,
} from "lucide-react";
import { bg } from "date-fns/locale";
// ─────────────────────────────────────────────
// HOOK: simple intersection observer para reveal
// ─────────────────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}
// ─────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────
const SERVICES = [
  {
    icon: Scissors,
    title: "Baño & Grooming",
    desc: "Baño, secado profesional, corte de pelo personalizado y limpieza profunda adaptada a cada raza.",
    price: "Desde Bs. 60",
    img: "/images/service-grooming.png",
    color: "#A8D5BA",
  },
  {
    icon: Sparkles,
    title: "Spa Completo",
    desc: "Hidratación de pelaje, masajes relajantes, aromaterapia y tratamientos premium para tu mascota.",
    price: "Desde Bs. 120",
    img: "/images/service-spa.png",
    color: "#F4E4BA",
  },
  {
    icon: Scissors,
    title: "Corte Exprés",
    desc: "Arreglo rápido para cuando el tiempo apremia. Uñas, orejas y pelaje en menos de 45 minutos.",
    price: "Desde Bs. 40",
    img: "/images/service-express.png",
    color: "#E8A87C",
  },
  {
    icon: Heart,
    title: "Cuidado Médico",
    desc: "Revisión de piel, detección de parásitos y orientación veterinaria básica incluida en cada visita.",
    price: "Desde Bs. 80",
    img: "/images/service-care.png",
    color: "#F4C2C2",
  },
  {
    icon: Camera,
    title: "Sesión Fotográfica",
    desc: "Capturamos el antes y después de cada sesión. Recibe fotos profesionales de tu mascota.",
    price: "Incluido",
    img: "/images/service-photo.png",
    color: "#C3B1E1",
  },
  {
    icon: Leaf,
    title: "Productos Naturales",
    desc: "Shampoos, acondicionadores y accesorios 100% naturales disponibles en nuestra tienda.",
    price: "Ver tienda",
    img: "/images/service-products.png",
    color: "#A8D5BA",
  },
];

const REVIEWS = [
  {
    name: "María González",
    pet: "Toy Poodle",
    rating: 5,
    text: "Mi Coco siempre sale hermoso. Los groomers son increíblemente cuidadosos y pacientes. ¡La mejor decisión que tomé para mi perrito!",
    img: "/images/review-1.png",
    date: "hace 2 días",
  },
  {
    name: "Roberto Quispe",
    pet: "Golden Retriever",
    rating: 5,
    text: "El servicio de spa completo fue extraordinario. Thor llegó a casa relajado y con un pelaje brillante como nunca antes. Totalmente recomendado.",
    img: "/images/review-2.png",
    date: "hace 1 semana",
  },
  {
    name: "Daniela Flores",
    pet: "Gato Persa",
    rating: 5,
    text: "Pensé que mi gata no toleraría el baño, pero el equipo fue tan amable con ella que quedó tranquila todo el tiempo. Volveré pronto.",
    img: "/images/review-3.png",
    date: "hace 2 semanas",
  },
  {
    name: "Carlos Mamani",
    pet: "Schnauzer Mini",
    rating: 5,
    text: "Me mandan fotos del proceso y el resultado siempre supera mis expectativas. La atención personalizada marca la diferencia.",
    img: "/images/review-4.png",
    date: "hace 3 semanas",
  },
];

const NEWS = [
  {
    tag: "Promoción",
    title: "Descuento de bienvenida",
    desc: "Trae a tu mascota por primera vez y obtén un 20% de descuento en cualquier servicio.",
    img: "/images/news-1.png",
    color: "#A8D5BA",
  },
  {
    tag: "Nuevo servicio",
    title: "Aromaterapia canina",
    desc: "Incorporamos aromaterapia con aceites esenciales seguros para reducir el estrés de tu mascota.",
    img: "/images/news-2.png",
    color: "#C3B1E1",
  },
  {
    tag: "Temporada",
    title: "Pack anti-pulgas verano",
    desc: "Tratamiento preventivo completo + baño especial. Protege a tu mascota durante la temporada calurosa.",
    img: "/images/news-3.png",
    color: "#F4E4BA",
  },
];

const VALUES = [
  { icon: Shield, title: "Seguridad primero", desc: "Todos nuestros productos son dermatológicamente probados y 100% seguros para animales." },
  { icon: Heart,  title: "Con amor real",     desc: "Cada groomer ama a los animales. Tu mascota es tratada con la misma ternura que en casa." },
  { icon: Award,  title: "Profesionales certificados", desc: "Nuestro equipo tiene certificación internacional en grooming y bienestar animal." },
  { icon: Leaf,   title: "Eco-responsables", desc: "Productos naturales, agua reutilizada y empaques biodegradables en toda nuestra operación." },
  { icon: Zap,    title: "Siempre puntuales", desc: "Respetamos tu tiempo. Turnos exactos sin esperas innecesarias." },
  { icon: Camera, title: "Documentamos todo", desc: "Fotos antes y después de cada sesión para que veas la transformación de tu mascota." },
];

const STATS = [
  { value: "800+", label: "Mascotas atendidas" },
  { value: "4.9",  label: "Calificación promedio" },
  { value: "6",    label: "Servicios especializados" },
  { value: "100%", label: "Clientes satisfechos" },
];

// ─────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────
function Stars({ n = 5 }: { n?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: n }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-accent text-accent" />
      ))}
    </div>
  );
}

function ImagePlaceholder({ color, icon: Icon, label }: { color: string; icon?: any; label?: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ background: color }}>
      {Icon && <Icon className="h-12 w-12 text-foreground/30" strokeWidth={1.5} />}
      {label && <p className="text-xs font-bold text-foreground/30">{label}</p>}
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="text-sm font-bold text-foreground/70 hover:text-foreground transition-colors relative group">
      {children}
      <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300 rounded-full" />
    </a>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function LandingPage() {
  const [mounted, setMounted]           = useState(false);
  const [reviewIdx, setReviewIdx]       = useState(0);
  const [contactForm, setContactForm]   = useState({ nombre: "", email: "", mensaje: "" });
  const [sent, setSent]                 = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const prevReview = () => setReviewIdx(i => (i - 1 + REVIEWS.length) % REVIEWS.length);
  const nextReview = () => setReviewIdx(i => (i + 1) % REVIEWS.length);

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 4000);
    setContactForm({ nombre: "", email: "", mensaje: "" });
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">

      {/* ════════════════════════════════════════
          NAV
      ════════════════════════════════════════ */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b-3 border-foreground shadow-cartoon-sm">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary border-3 border-foreground shadow-cartoon-sm flex items-center justify-center">
              <Scissors className="h-5 w-5 text-foreground" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-extrabold text-lg leading-none">Pet Spa</p>
              <p className="text-[10px] font-semibold text-foreground/50 leading-none">Grooming & Wellness</p>
            </div>
          </div>

          {/* Links */}
          <div className="hidden md:flex items-center gap-7">
            <NavLink href="#servicios">Servicios</NavLink>
            <NavLink href="#nosotros">Nosotros</NavLink>
            <NavLink href="#novedades">Novedades</NavLink>
            <NavLink href="#opiniones">Opiniones</NavLink>
            <NavLink href="#contacto">Contacto</NavLink>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-2">
            <Link href="/login">
              <button className="hidden sm:block px-4 py-2 rounded-xl border-3 border-foreground font-extrabold text-sm bg-white shadow-cartoon-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                Ingresar
              </button>
            </Link>
            <Link href="/register">
              <button className="px-4 py-2 rounded-xl border-3 border-foreground font-extrabold text-sm bg-primary shadow-cartoon-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                Agendar cita
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ════════════════════════════════════════
          HERO
      ════════════════════════════════════════ */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        {/* Fondo imagen hero */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-bg.png"
            alt="Pet Spa ambiente"
            className="w-full h-full object-cover"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          <div className="absolute inset-0 bg-background/75" />
          {/* Patrón decorativo si no hay imagen */}
          <div className="absolute inset-0 -z-10" style={{
            background: "linear-gradient(135deg, #A8D5BA 0%, #FFF8F0 40%, #F4E4BA 100%)"
          }} />
        </div>

        {/* Blob decorativo */}
        <div className="absolute top-20 right-0 w-96 h-96 rounded-full bg-primary/20 -translate-y-1/4 translate-x-1/4 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-64 h-64 rounded-full bg-secondary/40 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-5 py-20 grid lg:grid-cols-2 gap-16 items-center">
          {/* Texto */}
          <div
            className="space-y-7"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "none" : "translateY(32px)",
              transition: "all 0.8s cubic-bezier(.22,1,.36,1)",
            }}
          >
            <div className="inline-flex items-center gap-2 bg-white border-3 border-foreground rounded-full px-4 py-1.5 shadow-cartoon-sm text-sm font-bold">
              <Star className="h-4 w-4 fill-accent text-accent" />
              Calificación 4.9 · +800 mascotas atendidas
            </div>

            <h1 className="text-5xl md:text-[3.75rem] font-extrabold leading-[1.1] tracking-tight">
              Tu mascota merece<br />
              <span className="relative">
                <span className="relative z-10">lo mejor</span>
                <span className="absolute bottom-1 left-0 right-0 h-5 bg-primary/60 -z-10 -skew-x-2 rounded" />
              </span>
            </h1>

            <p className="text-lg text-foreground/70 font-semibold leading-relaxed max-w-lg">
              Grooming profesional, spa y cuidado integral en un ambiente seguro, amoroso y pensado para el bienestar de tu compañero.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/register">
                <button className="group flex items-center gap-2 px-8 py-4 rounded-2xl border-3 border-foreground font-extrabold text-lg bg-primary shadow-cartoon hover:shadow-cartoon-sm hover:translate-x-1 hover:translate-y-1 transition-all">
                  Reservar turno
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <a href="#servicios">
                <button className="flex items-center gap-2 px-8 py-4 rounded-2xl border-3 border-foreground font-extrabold text-lg bg-white shadow-cartoon-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                  Ver servicios
                  <ChevronDown className="h-5 w-5" />
                </button>
              </a>
            </div>

            {/* Badges confianza */}
            <div className="flex flex-wrap gap-3 pt-2">
              {[
                { icon: Shield,  label: "Productos seguros" },
                { icon: Award,   label: "Equipo certificado" },
                { icon: Clock,   label: "Turnos puntuales" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 bg-white/80 border-2 border-foreground rounded-full px-3 py-1.5 text-xs font-bold shadow-cartoon-sm">
                  <Icon className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Imagen hero derecha */}
          <div
            className="hidden lg:block relative"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "none" : "translateX(32px) scale(0.97)",
              transition: "all 0.9s cubic-bezier(.22,1,.36,1) 0.2s",
            }}
          >
            {/* Card principal */}
            <div className="relative rounded-3xl border-3 border-foreground shadow-cartoon overflow-hidden aspect-[4/5] bg-secondary">
              <img src="/images/hero-pet.png" alt="Mascota en Pet Spa"
                className="w-full h-full object-cover"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            </div>

            {/* Floating card — rating */}
            <div className="absolute -bottom-4 -left-6 bg-white border-3 border-foreground rounded-2xl shadow-cartoon p-4 min-w-[160px]">
              <p className="text-xs font-bold text-foreground/50 mb-1">Calificación general</p>
              <div className="flex items-end gap-2">
                <p className="text-4xl font-extrabold leading-none">4.9</p>
                <Stars />
              </div>
              <p className="text-[10px] text-foreground/40 mt-1 font-semibold">Basado en 230 reseñas</p>
            </div>

            {/* Floating card — servicio activo */}
            <div className="absolute -top-4 -right-6 bg-primary border-3 border-foreground rounded-2xl shadow-cartoon p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white border-2 border-foreground rounded-xl flex items-center justify-center">
                  <Scissors className="h-4 w-4" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-xs font-extrabold leading-none">Grooming</p>
                  <p className="text-[10px] text-foreground/60 font-semibold">En progreso</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          STATS
      ════════════════════════════════════════ */}
      <section className="bg-foreground text-background border-y-3 border-foreground py-10">
        <div className="max-w-4xl mx-auto px-5 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.1} className="text-center">
              <p className="text-4xl md:text-5xl font-extrabold text-primary">{s.value}</p>
              <p className="text-sm font-semibold text-background/60 mt-1">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════
          SERVICIOS
      ════════════════════════════════════════ */}
      <section id="servicios" className="py-24 max-w-6xl mx-auto px-5">
        <Reveal className="text-center mb-14">
          <p className="text-sm font-extrabold text-accent tracking-widest uppercase mb-2">Nuestros servicios</p>
          <h2 className="text-4xl md:text-5xl font-extrabold leading-tight">
            Todo lo que tu mascota necesita
          </h2>
          <p className="text-foreground/60 font-semibold mt-3 max-w-xl mx-auto">
            Servicios especializados con los mejores productos y profesionales apasionados por los animales.
          </p>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SERVICES.map((s, i) => {
            const Icon = s.icon;
            return (
              <Reveal key={s.title} delay={i * 0.08}>
                <div className="group rounded-2xl border-3 border-foreground shadow-cartoon overflow-hidden bg-white hover:shadow-cartoon-sm hover:translate-x-1 hover:translate-y-1 transition-all cursor-default">
                  {/* Imagen servicio */}
                  <div className="h-44 relative overflow-hidden">
                    <img src={s.img} alt={s.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  
                    <div className="absolute top-3 right-3 bg-white border-2 border-foreground rounded-full px-3 py-1 text-xs font-extrabold shadow-cartoon-sm">
                      {s.price}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg border-2 border-foreground flex items-center justify-center shrink-0" style={{ background: s.color }}>
                        <Icon className="h-4 w-4 text-foreground" strokeWidth={2.5} />
                      </div>
                      <h3 className="font-extrabold text-base">{s.title}</h3>
                    </div>
                    <p className="text-sm text-foreground/60 font-semibold leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="text-center mt-10">
          <Link href="/register">
            <button className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border-3 border-foreground font-extrabold bg-primary shadow-cartoon hover:shadow-cartoon-sm hover:translate-x-1 hover:translate-y-1 transition-all">
              Reservar mi cita ahora
              <ArrowRight className="h-5 w-5" />
            </button>
          </Link>
        </Reveal>
      </section>

      {/* ════════════════════════════════════════
          NOSOTROS — Cómo tratamos a las mascotas
      ════════════════════════════════════════ */}
      <section id="nosotros" className="bg-secondary/30 border-y-3 border-foreground py-24">
        <div className="max-w-6xl mx-auto px-5">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Imagen */}
            <Reveal className="relative">
              <div className="rounded-3xl border-3 border-foreground shadow-cartoon overflow-hidden aspect-square bg-primary/20">
                <img src="/images/about-team.png" alt="Nuestro equipo"
                  className="w-full h-full object-cover"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
              </div>
              {/* Imagen pequeña encima */}
              <div className="absolute -bottom-6 -right-6 w-36 h-36 rounded-2xl border-3 border-foreground shadow-cartoon overflow-hidden bg-secondary">
                <img src="/images/about-detail.png" alt="Detalle cuidado"
                  className="w-full h-full object-cover"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
                
              </div>
              {/* Badge experiencia */}
              <div className="absolute -top-4 -left-4 bg-foreground text-background rounded-2xl border-3 border-foreground shadow-cartoon px-4 py-3 text-center">
                <p className="text-3xl font-extrabold text-primary">5+</p>
                <p className="text-xs font-bold">años de<br />experiencia</p>
              </div>
            </Reveal>

            {/* Texto */}
            <div className="space-y-8">
              <Reveal>
                <p className="text-sm font-extrabold text-primary tracking-widest uppercase">Nuestra filosofía</p>
                <h2 className="text-4xl md:text-5xl font-extrabold mt-2 leading-tight">
                  Tratamos a cada mascota como si fuera nuestra
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="text-foreground/70 font-semibold leading-relaxed">
                  En Pet Spa creemos que el bienestar animal empieza por la confianza. Cada visita es una experiencia diseñada para que tu mascota se sienta segura, tranquila y bien cuidada — desde el primer contacto hasta el último detalle del arreglo.
                </p>
              </Reveal>
              <div className="grid sm:grid-cols-2 gap-4">
                {VALUES.map((v, i) => {
                  const Icon = v.icon;
                  return (
                    <Reveal key={v.title} delay={i * 0.07}>
                      <div className="flex gap-3 p-4 rounded-xl border-2 border-foreground/20 bg-white hover:border-foreground hover:shadow-cartoon-sm transition-all">
                        <div className="w-9 h-9 rounded-xl bg-primary border-2 border-foreground flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-foreground" strokeWidth={2.5} />
                        </div>
                        <div>
                          <p className="font-extrabold text-sm">{v.title}</p>
                          <p className="text-xs text-foreground/60 font-semibold mt-0.5 leading-relaxed">{v.desc}</p>
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          GALERÍA — Antes / Después
      ════════════════════════════════════════ */}
      <section className="py-24 max-w-6xl mx-auto px-5">
        <Reveal className="text-center mb-14">
          <p className="text-sm font-extrabold text-lavender tracking-widest uppercase mb-2">Resultados reales</p>
          <h2 className="text-4xl md:text-5xl font-extrabold">Transformaciones increíbles</h2>
          <p className="text-foreground/60 font-semibold mt-3 max-w-lg mx-auto">
            Documentamos el antes y después de cada sesión para que veas la diferencia con tus propios ojos.
          </p>
        </Reveal>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Antes",   img: "/images/gallery-before-1.png", color: "#F4C2C2" },
            { label: "Después", img: "/images/gallery-after-1.png",  color: "#A8D5BA" },
            { label: "Antes",   img: "/images/gallery-before-2.png", color: "#F4E4BA" },
            { label: "Después", img: "/images/gallery-after-2.png",  color: "#C3B1E1" },
          ].map((g, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="relative rounded-2xl overflow-hidden border-3 border-foreground shadow-cartoon aspect-square group">
                <img src={g.img} alt={g.label}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
                
                <div className={`absolute top-2 left-2 border-2 border-foreground rounded-full px-2.5 py-1 text-[10px] font-extrabold shadow-cartoon-sm ${g.label === "Antes" ? "bg-rose text-foreground" : "bg-primary text-foreground"}`}>
                  {g.label}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Fila larga */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          {[
            { label: "Antes",   img: "/images/gallery-before-3.png", color: "#E8A87C" },
            { label: "Después", img: "/images/gallery-after-3.png",  color: "#A8D5BA" },
            { label: "Después", img: "/images/gallery-after-4.png",  color: "#C3B1E1" },
          ].map((g, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="relative rounded-2xl overflow-hidden border-3 border-foreground shadow-cartoon aspect-video group">
                <img src={g.img} alt={g.label}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
                <div className={`absolute top-2 left-2 border-2 border-foreground rounded-full px-2.5 py-1 text-[10px] font-extrabold shadow-cartoon-sm ${g.label === "Antes" ? "bg-rose" : "bg-primary"}`}>
                  {g.label}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════
          NOVEDADES
      ════════════════════════════════════════ */}
      <section id="novedades" className="bg-foreground text-background py-24">
        <div className="max-w-6xl mx-auto px-5">
          <Reveal className="mb-12">
            <p className="text-sm font-extrabold text-primary tracking-widest uppercase mb-2">Novedades</p>
            <div className="flex items-end justify-between flex-wrap gap-4">
              <h2 className="text-4xl md:text-5xl font-extrabold leading-tight">Lo último del spa</h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-5">
            {NEWS.map((n, i) => (
              <Reveal key={n.title} delay={i * 0.1}>
                <div className="rounded-2xl border-3 overflow-hidden bg-white/5 hover:bg-white/10 transition-colors cursor-default group" style={{ borderColor: n.color }}>
                  <div className="h-44 relative overflow-hidden">
                    <img src={n.img} alt={n.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                    <div className="absolute inset-0 -z-10" style={{ background: n.color + "30" }} />
                    <span className="absolute top-3 left-3 text-[10px] font-extrabold border-2 border-foreground/30 rounded-full px-2.5 py-1 text-foreground bg-background/80 backdrop-blur-sm">
                      {n.tag}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-extrabold text-lg text-background mb-1">{n.title}</h3>
                    <p className="text-sm text-background/60 font-semibold leading-relaxed">{n.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          OPINIONES
      ════════════════════════════════════════ */}
      <section id="opiniones" className="py-24 max-w-6xl mx-auto px-5">
        <Reveal className="text-center mb-14">
          <p className="text-sm font-extrabold text-accent tracking-widest uppercase mb-2">Opiniones</p>
          <h2 className="text-4xl md:text-5xl font-extrabold">Lo que dicen nuestros clientes</h2>
          <div className="flex items-center justify-center gap-3 mt-4">
            <Stars />
            <p className="font-extrabold text-xl">4.9</p>
            <p className="text-foreground/50 font-semibold text-sm">basado en 230 reseñas verificadas</p>
          </div>
        </Reveal>

        {/* Carrusel */}
        <div className="relative">
          <div className="overflow-hidden rounded-3xl border-3 border-foreground shadow-cartoon">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${reviewIdx * 100}%)` }}
            >
              {REVIEWS.map((r) => (
                <div key={r.name} className="min-w-full bg-white p-8 md:p-12">
                  <div className="max-w-2xl mx-auto">
                    <Stars />
                    <p className="text-xl md:text-2xl font-semibold text-foreground/80 leading-relaxed mt-5 mb-8 italic">
                      "{r.text}"
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl border-3 border-foreground overflow-hidden bg-secondary shadow-cartoon-sm shrink-0">
                        <img src={r.img} alt={r.name}
                          className="w-full h-full object-cover"
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-secondary">
                          <MessageCircle className="h-6 w-6 text-foreground/30" />
                        </div>
                      </div>
                      <div>
                        <p className="font-extrabold">{r.name}</p>
                        <p className="text-sm text-foreground/50 font-semibold">Mascota: {r.pet} · {r.date}</p>
                      </div>
                      <CheckCircle className="h-6 w-6 text-primary ml-auto shrink-0" strokeWidth={2.5} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Controles */}
          <button onClick={prevReview}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl border-3 border-foreground bg-white shadow-cartoon-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center">
            <ChevronLeft className="h-5 w-5" strokeWidth={3} />
          </button>
          <button onClick={nextReview}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl border-3 border-foreground bg-white shadow-cartoon-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center">
            <ChevronRight className="h-5 w-5" strokeWidth={3} />
          </button>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-5">
            {REVIEWS.map((_, i) => (
              <button key={i} onClick={() => setReviewIdx(i)}
                className={`h-2.5 rounded-full border-2 border-foreground transition-all ${i === reviewIdx ? "w-8 bg-primary" : "w-2.5 bg-white"}`} />
            ))}
          </div>
        </div>

        {/* Grid mini reseñas */}
        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          {[
            { plataforma: "Google", calificacion: "4.9", reseñas: "180 reseñas" },
            { plataforma: "Facebook", calificacion: "4.8", reseñas: "32 reseñas" },
            { plataforma: "Reservas directas", calificacion: "5.0", reseñas: "18 reseñas" },
          ].map((p) => (
            <div key={p.plataforma} className="flex items-center gap-3 p-4 rounded-2xl border-3 border-foreground shadow-cartoon-sm bg-white">
              <div className="w-10 h-10 rounded-xl bg-secondary border-2 border-foreground flex items-center justify-center shrink-0">
                <Star className="h-5 w-5 fill-accent text-accent" />
              </div>
              <div>
                <p className="font-extrabold text-lg leading-none">{p.calificacion} <span className="text-sm text-foreground/40 font-semibold">/ 5</span></p>
                <p className="text-xs font-semibold text-foreground/50">{p.plataforma} · {p.reseñas}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════
          CTA — RESERVAR
      ════════════════════════════════════════ */}
      <section className="mx-4 mb-4 rounded-3xl border-3 border-foreground overflow-hidden shadow-cartoon">
        <div className="relative">
          <img src="/images/cta-bg.png" alt="Pet Spa ambiente"
            className="w-full h-64 md:h-80 object-cover"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          <div className="absolute inset-0 bg-foreground/70" />
          <div className="absolute inset-0 flex items-center justify-center text-center p-6">
            <div className="space-y-5 max-w-xl">
              <p className="text-sm font-extrabold text-primary tracking-widest uppercase">Tu mascota te lo agradecerá</p>
              <h2 className="text-4xl md:text-5xl font-extrabold text-background leading-tight">
                Reserva tu turno hoy
              </h2>
              <p className="text-background/70 font-semibold">
                Proceso rápido, sin complicaciones. En menos de 2 minutos tienes tu cita confirmada.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/register">
                  <button className="px-8 py-4 rounded-2xl border-3 border-background font-extrabold text-foreground bg-primary shadow-[4px_4px_0px_rgba(255,255,255,0.4)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                    Crear cuenta y reservar
                  </button>
                </Link>
                <Link href="/login">
                  <button className="px-8 py-4 rounded-2xl border-3 border-background font-extrabold text-background hover:bg-white/10 transition-all">
                    Ya tengo cuenta
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          CONTACTO
      ════════════════════════════════════════ */}
      <section id="contacto" className="py-24 max-w-6xl mx-auto px-5">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Info */}
          <div className="space-y-8">
            <Reveal>
              <p className="text-sm font-extrabold text-primary tracking-widest uppercase mb-2">Contacto</p>
              <h2 className="text-4xl md:text-5xl font-extrabold leading-tight">Estamos aquí para ayudarte</h2>
              <p className="text-foreground/60 font-semibold mt-3 leading-relaxed">
                ¿Tienes dudas sobre algún servicio? ¿Necesitas información sobre el cuidado de tu mascota? Escríbenos o llámanos, con gusto te atendemos.
              </p>
            </Reveal>

            <div className="space-y-4">
              {[
                { icon: Phone,  label: "Teléfono", value: "+591 73 123 456" },
                { icon: Mail,   label: "Correo",   value: "hola@petspa.com" },
                { icon: MapPin, label: "Dirección", value: "La Paz, Bolivia" },
                { icon: Clock,  label: "Horario",  value: "Lun – Sáb · 8:00 – 18:00" },
              ].map(({ icon: Icon, label, value }) => (
                <Reveal key={label} delay={0.05}>
                  <div className="flex items-center gap-4 p-4 rounded-2xl border-3 border-foreground shadow-cartoon-sm bg-white hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                    <div className="w-11 h-11 rounded-xl bg-primary border-2 border-foreground flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-foreground" strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground/50">{label}</p>
                      <p className="font-extrabold">{value}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Redes sociales */}
            <Reveal>
              <p className="text-sm font-bold text-foreground/50 mb-3">Síguenos en redes</p>
              <div className="flex gap-3">
                {[
                  { icon: Instagram, label: "@petspa.bo", color: "#C3B1E1" },
                  { icon: Facebook,  label: "Pet Spa Bolivia", color: "#A8D5BA" },
                ].map(({ icon: Icon, label, color }) => (
                  <div key={label} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-3 border-foreground shadow-cartoon-sm bg-white hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer">
                    <div className="w-7 h-7 rounded-lg border-2 border-foreground flex items-center justify-center" style={{ background: color }}>
                      <Icon className="h-3.5 w-3.5 text-foreground" strokeWidth={2.5} />
                    </div>
                    <p className="text-xs font-bold">{label}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Formulario */}
          <Reveal delay={0.15}>
            <div className="rounded-3xl border-3 border-foreground shadow-cartoon bg-white p-8">
              <h3 className="text-2xl font-extrabold mb-6">Envíanos un mensaje</h3>
              {sent ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary border-3 border-foreground flex items-center justify-center shadow-cartoon">
                    <CheckCircle className="h-8 w-8 text-foreground" strokeWidth={2.5} />
                  </div>
                  <p className="font-extrabold text-xl">¡Mensaje enviado!</p>
                  <p className="text-sm text-foreground/60 font-semibold">Te responderemos en las próximas horas.</p>
                </div>
              ) : (
                <form onSubmit={handleContact} className="space-y-4">
                  <div>
                    <label className="text-xs font-extrabold text-foreground/50 uppercase tracking-wider block mb-1.5">Tu nombre</label>
                    <input
                      type="text" required
                      value={contactForm.nombre}
                      onChange={e => setContactForm(f => ({ ...f, nombre: e.target.value }))}
                      className="w-full h-12 rounded-xl border-3 border-foreground px-4 font-semibold focus:outline-none focus:ring-4 focus:ring-primary/40 transition-all"
                      placeholder="María García"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-extrabold text-foreground/50 uppercase tracking-wider block mb-1.5">Tu correo</label>
                    <input
                      type="email" required
                      value={contactForm.email}
                      onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full h-12 rounded-xl border-3 border-foreground px-4 font-semibold focus:outline-none focus:ring-4 focus:ring-primary/40 transition-all"
                      placeholder="hola@correo.com"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-extrabold text-foreground/50 uppercase tracking-wider block mb-1.5">Mensaje</label>
                    <textarea
                      required rows={4}
                      value={contactForm.mensaje}
                      onChange={e => setContactForm(f => ({ ...f, mensaje: e.target.value }))}
                      className="w-full rounded-xl border-3 border-foreground px-4 py-3 font-semibold focus:outline-none focus:ring-4 focus:ring-primary/40 transition-all resize-none"
                      placeholder="¿En qué podemos ayudarte?"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-4 rounded-2xl border-3 border-foreground font-extrabold bg-primary shadow-cartoon hover:shadow-cartoon-sm hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-2"
                  >
                    <Mail className="h-5 w-5" strokeWidth={2.5} />
                    Enviar mensaje
                  </button>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════ */}
      <footer className="border-t-3 border-foreground bg-foreground text-background">
        <div className="max-w-6xl mx-auto px-5 py-12 grid sm:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-primary border-2 border-background/20 flex items-center justify-center">
                <Scissors className="h-4 w-4 text-foreground" strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-extrabold leading-none">Pet Spa</p>
                <p className="text-[10px] font-semibold text-background/40">Grooming & Wellness</p>
              </div>
            </div>
            <p className="text-sm text-background/50 font-semibold leading-relaxed">
              Cuidado profesional y amoroso para tu mascota. Porque ellos se lo merecen todo.
            </p>
          </div>

          <div>
            <p className="font-extrabold mb-4 text-background/70 uppercase text-xs tracking-widest">Servicios</p>
            <ul className="space-y-2 text-sm font-semibold text-background/50">
              {SERVICES.slice(0, 4).map(s => (
                <li key={s.title} className="hover:text-background transition-colors cursor-pointer">{s.title}</li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-extrabold mb-4 text-background/70 uppercase text-xs tracking-widest">Acceso</p>
            <ul className="space-y-2 text-sm font-semibold text-background/50">
              <li><Link href="/login"    className="hover:text-background transition-colors">Iniciar sesión</Link></li>
              <li><Link href="/register" className="hover:text-background transition-colors">Registrarse</Link></li>
              <li><a href="#contacto"    className="hover:text-background transition-colors">Contacto</a></li>
              <li><a href="#servicios"   className="hover:text-background transition-colors">Nuestros servicios</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 py-5">
          <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-background/30 font-semibold">© 2026 Pet Spa · Todos los derechos reservados</p>
            <div className="flex items-center gap-1.5 text-xs text-background/30 font-semibold">
              <Heart className="h-3 w-3 fill-rose/60 text-rose/60" strokeWidth={2} />
              Hecho con amor para los animales
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}