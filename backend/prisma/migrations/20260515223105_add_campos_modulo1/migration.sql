-- CreateEnum
CREATE TYPE "EstadoSolicitudCita" AS ENUM ('Solicitada', 'EnRevision', 'Aprobada', 'Rechazada');

-- AlterTable
ALTER TABLE "citas" ADD COLUMN     "estado_solicitud" "EstadoSolicitudCita";

-- AlterTable
ALTER TABLE "consumo_insumos" ADD COLUMN     "cantidad_devuelta" DECIMAL(65,30),
ADD COLUMN     "devuelto" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "merma" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "mascotas" ADD COLUMN     "tamanio" TEXT;
