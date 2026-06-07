-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "puntos_fidelidad" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_compras" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "total_servicios" INTEGER NOT NULL DEFAULT 0;
