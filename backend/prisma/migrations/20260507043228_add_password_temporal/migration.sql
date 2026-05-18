-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "fecha_expiracion_pass" TIMESTAMP(3),
ADD COLUMN     "password_temporal" BOOLEAN NOT NULL DEFAULT false;
