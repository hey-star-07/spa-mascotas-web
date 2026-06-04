-- AlterTable
ALTER TABLE "productos" ADD COLUMN     "es_insumo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "es_tienda" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "unidad_medida" TEXT NOT NULL DEFAULT 'unidad';
