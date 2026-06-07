-- AlterTable
ALTER TABLE "productos" ADD COLUMN     "en_promocion" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "precio_promocional" DECIMAL(65,30);
