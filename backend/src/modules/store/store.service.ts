import prisma from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { ErrorCodes } from '../../shared/errors/errorCodes';
import { CreatePedidoDTO } from './store.types';

export class StoreService {
  // Obtener catálogo (productos activos con stock > 0)
  static async getCatalogo(params?: { categoriaId?: number; search?: string }) {
    const where: any = { activo: true };
    if (params?.categoriaId) where.categoriaId = params.categoriaId;
    if (params?.search) {
      where.OR = [
        { nombre: { contains: params.search, mode: 'insensitive' } },
        { sku: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const productos = await prisma.producto.findMany({
      where,
      include: {
        categoria: { select: { id: true, nombre: true } },
        variantes: { where: { stockAdicional: { gt: 0 } } },
      },
      orderBy: { nombre: 'asc' },
    });

    // Filtrar solo productos con stock disponible
    return productos.filter(p => p.variantes.some(v => v.stockAdicional > 0));
  }

  // Agregar al carrito
  static async addToCart(usuarioId: number, data: { productoId: number; varianteId?: number; cantidad: number }) {
    // Buscar o crear carrito activo
    let carrito = await prisma.carrito.findFirst({
      where: { usuarioId, expiresAt: { gt: new Date() } },
    });

    if (!carrito) {
      carrito = await prisma.carrito.create({
        data: {
          usuarioId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // Verificar stock
    if (data.varianteId) {
      const variante = await prisma.varianteProducto.findUnique({ where: { id: data.varianteId } });
      if (!variante || variante.stockAdicional < data.cantidad) {
        throw new AppError(ErrorCodes.VALIDATION_ERROR, 422, 'Stock insuficiente');
      }
    }

    const producto = await prisma.producto.findUnique({ where: { id: data.productoId } });
    if (!producto) throw new AppError(ErrorCodes.USER_NOT_FOUND, 404, 'Producto no encontrado');

    // Verificar si ya existe en el carrito
    const existing = await prisma.detalleCarrito.findFirst({
      where: { carritoId: carrito.id, productoId: data.productoId, varianteId: data.varianteId || null },
    });

    if (existing) {
      return prisma.detalleCarrito.update({
        where: { id: existing.id },
        data: { cantidad: existing.cantidad + data.cantidad },
      });
    }

    return prisma.detalleCarrito.create({
      data: {
        carritoId: carrito.id,
        productoId: data.productoId,
        varianteId: data.varianteId || null,
        cantidad: data.cantidad,
        precioUnitario: producto.precioBase,
      },
    });
  }

  // Obtener carrito del usuario
  static async getCart(usuarioId: number) {
    const carrito = await prisma.carrito.findFirst({
      where: { usuarioId, expiresAt: { gt: new Date() } },
      include: {
        detalles: {
          include: {
            producto: { select: { id: true, nombre: true, imagenUrl: true, sku: true } },
            variante: { select: { id: true, atributo: true, valor: true } },
          },
        },
      },
    });

    if (!carrito) return { detalles: [], subtotal: 0, total: 0 };

    const subtotal = carrito.detalles.reduce((sum, d) => sum + Number(d.precioUnitario) * d.cantidad, 0);

    return {
      id: carrito.id,
      detalles: carrito.detalles,
      subtotal,
      total: subtotal,
    };
  }

  // Eliminar item del carrito
  static async removeFromCart(detalleId: number) {
    return prisma.detalleCarrito.delete({ where: { id: detalleId } });
  }

  // Generar pedido y mensaje para WhatsApp/Telegram
  static async generarPedido(usuarioId: number, data: CreatePedidoDTO) {
    const carrito = await this.getCart(usuarioId);
    if (!carrito.detalles || carrito.detalles.length === 0) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 422, '🛒 El carrito está vacío');
    }

    // Buscar el cliente con su información completa
    const cliente = await prisma.cliente.findUnique({
      where: { usuarioId },
      include: { usuario: true } // Incluir datos del usuario para obtener el nombre
    });
    
    if (!cliente) throw new AppError(ErrorCodes.USER_NOT_FOUND, 404, '❌ Cliente no encontrado');

    // Obtener el nombre del cliente (priorizar nombre de usuario o cliente)
    const nombreCliente = cliente.usuario?.nombre || `Cliente #${cliente.id}`;

    // Crear pedido
    const pedido = await prisma.pedido.create({
      data: {
        clienteId: cliente.id,
        subtotal: carrito.subtotal,
        total: carrito.total,
        metodoContacto: data.metodoContacto,
        contactoDestino: data.contactoDestino,
      },
    });

    // Generar mensaje con emojis y nombre del cliente
    let mensaje = `🐾 *NUEVO PEDIDO - PET SPA* 🐾\n`;
    mensaje += `╭──────────────────╮\n`;
    mensaje += `✨ ¡Hola *${nombreCliente}*! ✨\n`;
    mensaje += `╰──────────────────╯\n\n`;
    mensaje += `📋 *Detalle de tu compra:*\n`;
    mensaje += `┌─────────────────┐\n`;
    
    for (const d of carrito.detalles) {
      const variante = d.variante ? ` (${d.variante.valor})` : '';
      const subtotalItem = Number(d.precioUnitario) * d.cantidad;
      mensaje += `│ • ${d.producto.nombre}${variante}\n`;
      mensaje += `│   🧮 ${d.cantidad} x Bs. ${Number(d.precioUnitario).toFixed(2)}\n`;
      mensaje += `│   💰 → Bs. ${subtotalItem.toFixed(2)}\n`;
    }
    
    mensaje += `└─────────────────┘\n\n`;
    mensaje += `💵 *Subtotal:* Bs. ${carrito.subtotal.toFixed(2)}\n`;
    mensaje += `🎯 *Total a pagar:* Bs. ${carrito.total.toFixed(2)}\n\n`;
    mensaje += `📞 *Contacto:* ${data.contactoDestino}\n`;
    mensaje += `🐶 *¡Gracias por preferir Pet Spa!* 🐱\n`;
    mensaje += `✨ *Pronto nos comunicaremos contigo* ✨`;

    // Limpiar carrito
    await prisma.detalleCarrito.deleteMany({ where: { carritoId: carrito.id } });

    // Generar link de WhatsApp (formato internacional)
    const numeroLimpio = data.contactoDestino.replace(/\D/g, '');
    const mensajeEncoded = encodeURIComponent(mensaje);
    const whatsappLink = `https://wa.me/591${numeroLimpio}?text=${mensajeEncoded}`;

    console.log('📱 WhatsApp link generado para:', nombreCliente);
    console.log('🔗 Enlace:', whatsappLink);

    return {
      pedido,
      mensaje,
      whatsappLink,
      nombreCliente, // También devolvemos el nombre por si se necesita
    };
  }
}