-- CreateTable
CREATE TABLE "insumos_asignados" (
    "id" SERIAL NOT NULL,
    "cita_id" INTEGER NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "variante_id" INTEGER,
    "cantidad_asignada" DECIMAL(65,30) NOT NULL,
    "cantidad_usada" DECIMAL(65,30),
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "asignado_por" INTEGER NOT NULL,
    "confirmado_por" INTEGER,
    "fecha_asignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_confirmacion" TIMESTAMP(3),
    "fecha_uso" TIMESTAMP(3),
    "observacion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insumos_asignados_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "insumos_asignados" ADD CONSTRAINT "insumos_asignados_cita_id_fkey" FOREIGN KEY ("cita_id") REFERENCES "citas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insumos_asignados" ADD CONSTRAINT "insumos_asignados_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insumos_asignados" ADD CONSTRAINT "insumos_asignados_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variantes_producto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insumos_asignados" ADD CONSTRAINT "insumos_asignados_asignado_por_fkey" FOREIGN KEY ("asignado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insumos_asignados" ADD CONSTRAINT "insumos_asignados_confirmado_por_fkey" FOREIGN KEY ("confirmado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
