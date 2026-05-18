-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('Admin', 'Recepcion', 'Groomer', 'Cliente');

-- CreateEnum
CREATE TYPE "EstadoCita" AS ENUM ('Agendada', 'Confirmada', 'EnProgreso', 'Completada', 'Cancelada', 'NoAsistio');

-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('Pendiente', 'Enviado', 'Confirmado', 'Pagado', 'Entregado');

-- CreateEnum
CREATE TYPE "EstadoFactura" AS ENUM ('Pendiente', 'Pagada', 'Cancelada');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('Completado', 'Pendiente', 'Fallido');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('Efectivo', 'QR', 'Transferencia');

-- CreateEnum
CREATE TYPE "CanalNotificacion" AS ENUM ('Email', 'WhatsApp', 'SMS');

-- CreateEnum
CREATE TYPE "TipoEventoNotificacion" AS ENUM ('CONFIRMACION', 'RECORDATORIO_24H', 'RECORDATORIO_2H', 'LISTO_RECOGER', 'ENCUESTA', 'PROMOCION');

-- CreateEnum
CREATE TYPE "TipoBloqueo" AS ENUM ('FERIADO', 'VACACIONES', 'MANTENIMIENTO', 'AUSENCIA');

-- CreateEnum
CREATE TYPE "TemperamentoMascota" AS ENUM ('Tranquilo', 'Jugueton', 'Agresivo', 'Timido', 'Indiferente');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT,
    "telefono" TEXT,
    "rol" "RolUsuario" NOT NULL DEFAULT 'Cliente',
    "two_factor_secret" TEXT,
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "ultimo_acceso" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "email_verificado" BOOLEAN NOT NULL DEFAULT false,
    "verification_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesiones_usuario" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "token_jwt" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "fecha_expiracion" TIMESTAMP(3) NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sesiones_usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "direccion_fisica" TEXT,
    "canal_notificacion_preferido" "CanalNotificacion" NOT NULL DEFAULT 'Email',
    "horario_preferido" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groomers" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "capacidad_simultanea" INTEGER NOT NULL DEFAULT 1,
    "especialidad" TEXT,
    "horario_trabajo" JSONB NOT NULL DEFAULT '{}',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groomers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "padre_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" SERIAL NOT NULL,
    "sku" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoria_id" INTEGER,
    "precio_base" DECIMAL(65,30) NOT NULL,
    "imagen_url" TEXT,
    "stock_minimo" INTEGER NOT NULL DEFAULT 5,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variantes_producto" (
    "id" SERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "atributo" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "sku_variante" TEXT NOT NULL,
    "precio_extra" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "stock_adicional" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "variantes_producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicios" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "duracion_base_minutos" INTEGER NOT NULL,
    "precio_base" DECIMAL(65,30) NOT NULL,
    "permite_doble_booking" BOOLEAN NOT NULL DEFAULT false,
    "factor_tamano_raza" DECIMAL(65,30) NOT NULL DEFAULT 0.15,
    "requiere_bloque_consecutivo" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mascotas" (
    "id" SERIAL NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "especie" TEXT NOT NULL DEFAULT 'Canino',
    "raza" TEXT,
    "fecha_nacimiento" TIMESTAMP(3),
    "peso_kg" DECIMAL(65,30),
    "temperamento" "TemperamentoMascota",
    "alergias_conocidas" TEXT,
    "restricciones_medicas_comportamiento" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mascotas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vacunas" (
    "id" SERIAL NOT NULL,
    "mascota_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "fecha_aplicacion" TIMESTAMP(3) NOT NULL,
    "fecha_vencimiento" TIMESTAMP(3),
    "lote" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vacunas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citas" (
    "id" SERIAL NOT NULL,
    "mascota_id" INTEGER NOT NULL,
    "groomer_id" INTEGER NOT NULL,
    "servicio_id" INTEGER NOT NULL,
    "fecha_hora_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_hora_fin" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoCita" NOT NULL DEFAULT 'Agendada',
    "creado_por" INTEGER,
    "reprogramado_por" INTEGER,
    "fecha_reprogramacion" TIMESTAMP(3),
    "duracion_estimada_minutos" INTEGER NOT NULL,
    "duracion_real_minutos" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "citas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fichas_grooming" (
    "id" SERIAL NOT NULL,
    "cita_id" INTEGER NOT NULL,
    "raza_tamano_momento" TEXT,
    "temperatura_animal" DECIMAL(65,30),
    "notas_internas" TEXT,
    "consumido_inventario" BOOLEAN NOT NULL DEFAULT false,
    "fecha_cierre" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fichas_grooming_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fotos" (
    "id" SERIAL NOT NULL,
    "ficha_grooming_id" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "url_foto" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fotos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plantillas_checklist" (
    "id" SERIAL NOT NULL,
    "servicio_id" INTEGER NOT NULL,
    "item" TEXT NOT NULL,
    "descripcion" TEXT,
    "requiere_observacion" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "plantillas_checklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_ficha" (
    "id" SERIAL NOT NULL,
    "ficha_grooming_id" INTEGER NOT NULL,
    "plantilla_checklist_id" INTEGER NOT NULL,
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "observacion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checklist_ficha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consumo_insumos" (
    "id" SERIAL NOT NULL,
    "ficha_grooming_id" INTEGER NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "variante_id" INTEGER,
    "cantidad" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consumo_insumos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carritos" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER,
    "session_token" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carritos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalles_carrito" (
    "id" SERIAL NOT NULL,
    "carrito_id" INTEGER NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "variante_id" INTEGER,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "detalles_carrito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" SERIAL NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "carrito_id" INTEGER,
    "fecha_pedido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "descuento" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total" DECIMAL(65,30) NOT NULL,
    "estado" "EstadoPedido" NOT NULL DEFAULT 'Pendiente',
    "metodo_contacto" TEXT NOT NULL,
    "contacto_destino" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facturas" (
    "id" SERIAL NOT NULL,
    "cita_id" INTEGER,
    "pedido_id" INTEGER,
    "numero_factura" TEXT NOT NULL,
    "fecha_emision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cliente_id" INTEGER NOT NULL,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "impuesto" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total" DECIMAL(65,30) NOT NULL,
    "estado" "EstadoFactura" NOT NULL DEFAULT 'Pendiente',
    "metodo_pago" "MetodoPago",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalles_factura" (
    "id" SERIAL NOT NULL,
    "factura_id" INTEGER NOT NULL,
    "concepto" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(65,30) NOT NULL,
    "total" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "detalles_factura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" SERIAL NOT NULL,
    "factura_id" INTEGER NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "metodo_pago" "MetodoPago" NOT NULL,
    "referencia_transaccion" TEXT,
    "estado" "EstadoPago" NOT NULL DEFAULT 'Completado',
    "fecha_pago" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disponibilidad" (
    "id" SERIAL NOT NULL,
    "groomer_id" INTEGER NOT NULL,
    "dia_semana" INTEGER NOT NULL,
    "hora_inicio" TEXT NOT NULL,
    "hora_fin" TEXT NOT NULL,
    "intervalo_descanso" JSONB,

    CONSTRAINT "disponibilidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloqueos_calendario" (
    "id" SERIAL NOT NULL,
    "groomer_id" INTEGER,
    "tipo" "TipoBloqueo" NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "descripcion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bloqueos_calendario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "tipo_evento" "TipoEventoNotificacion" NOT NULL,
    "canal" "CanalNotificacion" NOT NULL,
    "destino" TEXT NOT NULL,
    "contenido" TEXT,
    "fecha_programacion" TIMESTAMP(3) NOT NULL,
    "fecha_envio" TIMESTAMP(3),
    "estado_envio" TEXT NOT NULL DEFAULT 'pendiente',
    "reintentos" INTEGER NOT NULL DEFAULT 0,
    "log_entregas" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "tabla_afectada" TEXT NOT NULL,
    "registro_id" INTEGER,
    "accion" TEXT NOT NULL,
    "usuario_id" INTEGER,
    "datos_antiguos" JSONB,
    "datos_nuevos" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "fecha_accion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_usuario_id_key" ON "clientes"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "groomers_usuario_id_key" ON "groomers"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "productos_sku_key" ON "productos"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "variantes_producto_sku_variante_key" ON "variantes_producto"("sku_variante");

-- CreateIndex
CREATE UNIQUE INDEX "variantes_producto_producto_id_atributo_valor_key" ON "variantes_producto"("producto_id", "atributo", "valor");

-- CreateIndex
CREATE UNIQUE INDEX "fichas_grooming_cita_id_key" ON "fichas_grooming"("cita_id");

-- CreateIndex
CREATE UNIQUE INDEX "plantillas_checklist_servicio_id_item_key" ON "plantillas_checklist"("servicio_id", "item");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_ficha_ficha_grooming_id_plantilla_checklist_id_key" ON "checklist_ficha"("ficha_grooming_id", "plantilla_checklist_id");

-- CreateIndex
CREATE UNIQUE INDEX "carritos_session_token_key" ON "carritos"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_carrito_id_key" ON "pedidos"("carrito_id");

-- CreateIndex
CREATE UNIQUE INDEX "facturas_cita_id_key" ON "facturas"("cita_id");

-- CreateIndex
CREATE UNIQUE INDEX "facturas_pedido_id_key" ON "facturas"("pedido_id");

-- CreateIndex
CREATE UNIQUE INDEX "facturas_numero_factura_key" ON "facturas"("numero_factura");

-- AddForeignKey
ALTER TABLE "sesiones_usuario" ADD CONSTRAINT "sesiones_usuario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groomers" ADD CONSTRAINT "groomers_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_padre_id_fkey" FOREIGN KEY ("padre_id") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variantes_producto" ADD CONSTRAINT "variantes_producto_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mascotas" ADD CONSTRAINT "mascotas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacunas" ADD CONSTRAINT "vacunas_mascota_id_fkey" FOREIGN KEY ("mascota_id") REFERENCES "mascotas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_mascota_id_fkey" FOREIGN KEY ("mascota_id") REFERENCES "mascotas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_groomer_id_fkey" FOREIGN KEY ("groomer_id") REFERENCES "groomers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_reprogramado_por_fkey" FOREIGN KEY ("reprogramado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fichas_grooming" ADD CONSTRAINT "fichas_grooming_cita_id_fkey" FOREIGN KEY ("cita_id") REFERENCES "citas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotos" ADD CONSTRAINT "fotos_ficha_grooming_id_fkey" FOREIGN KEY ("ficha_grooming_id") REFERENCES "fichas_grooming"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plantillas_checklist" ADD CONSTRAINT "plantillas_checklist_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_ficha" ADD CONSTRAINT "checklist_ficha_ficha_grooming_id_fkey" FOREIGN KEY ("ficha_grooming_id") REFERENCES "fichas_grooming"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_ficha" ADD CONSTRAINT "checklist_ficha_plantilla_checklist_id_fkey" FOREIGN KEY ("plantilla_checklist_id") REFERENCES "plantillas_checklist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumo_insumos" ADD CONSTRAINT "consumo_insumos_ficha_grooming_id_fkey" FOREIGN KEY ("ficha_grooming_id") REFERENCES "fichas_grooming"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumo_insumos" ADD CONSTRAINT "consumo_insumos_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumo_insumos" ADD CONSTRAINT "consumo_insumos_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variantes_producto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carritos" ADD CONSTRAINT "carritos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_carrito" ADD CONSTRAINT "detalles_carrito_carrito_id_fkey" FOREIGN KEY ("carrito_id") REFERENCES "carritos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_carrito" ADD CONSTRAINT "detalles_carrito_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_carrito" ADD CONSTRAINT "detalles_carrito_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variantes_producto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_carrito_id_fkey" FOREIGN KEY ("carrito_id") REFERENCES "carritos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_cita_id_fkey" FOREIGN KEY ("cita_id") REFERENCES "citas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_factura" ADD CONSTRAINT "detalles_factura_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disponibilidad" ADD CONSTRAINT "disponibilidad_groomer_id_fkey" FOREIGN KEY ("groomer_id") REFERENCES "groomers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloqueos_calendario" ADD CONSTRAINT "bloqueos_calendario_groomer_id_fkey" FOREIGN KEY ("groomer_id") REFERENCES "groomers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
