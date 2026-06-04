-- CreateTable
CREATE TABLE "insumos_servicio" (
    "id" SERIAL NOT NULL,
    "servicio_id" INTEGER NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "variante_id" INTEGER,
    "cantidad_sugerida" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "orden" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insumos_servicio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "insumos_servicio_servicio_id_producto_id_variante_id_key" ON "insumos_servicio"("servicio_id", "producto_id", "variante_id");

-- AddForeignKey
ALTER TABLE "insumos_servicio" ADD CONSTRAINT "insumos_servicio_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insumos_servicio" ADD CONSTRAINT "insumos_servicio_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insumos_servicio" ADD CONSTRAINT "insumos_servicio_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variantes_producto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
