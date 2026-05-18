import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Limpiar datos existentes (en orden inverso por dependencias)
  await prisma.auditLog.deleteMany();
  await prisma.notificacion.deleteMany();
  await prisma.pago.deleteMany();
  await prisma.detalleFactura.deleteMany();
  await prisma.factura.deleteMany();
  await prisma.detalleCarrito.deleteMany();
  await prisma.carrito.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.consumoInsumo.deleteMany();
  await prisma.checklistFicha.deleteMany();
  await prisma.plantillaChecklist.deleteMany();
  await prisma.foto.deleteMany();
  await prisma.fichaGrooming.deleteMany();
  await prisma.cita.deleteMany();
  await prisma.vacuna.deleteMany();
  await prisma.mascota.deleteMany();
  await prisma.disponibilidad.deleteMany();
  await prisma.bloqueoCalendario.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.groomer.deleteMany();
  await prisma.varianteProducto.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.categoria.deleteMany();
  await prisma.servicio.deleteMany();
  await prisma.sesionUsuario.deleteMany();
  await prisma.usuario.deleteMany();

  console.log('🗑️  Datos anteriores eliminados');

  // ============================================
  // USUARIOS Y PERFILES
  // ============================================
  
  const passwordHash = await bcrypt.hash('Admin123!', 12);

  // Admin
  const admin = await prisma.usuario.create({
    data: {
      email: 'carvajalesther514@gmail.com',
      passwordHash,
      nombre: 'Administrador',
      apellido: 'Principal',
      telefono: '73541291',
      rol: 'Admin',
      emailVerificado: true,
      twoFactorEnabled: false,
    },
  });
  console.log(`✅ Admin creado: ${admin.email}`);

  // Groomer
  const groomerUser = await prisma.usuario.create({
    data: {
      email: 'ana.garcia@petspa.com',
      passwordHash,
      nombre: 'Ana',
      apellido: 'García',
      telefono: '+59177777778',
      rol: 'Groomer',
      emailVerificado: true,
    },
  });

  const groomer = await prisma.groomer.create({
    data: {
      usuarioId: groomerUser.id,
      capacidadSimultanea: 2,
      especialidad: 'Corte fino y estilizado',
      horarioTrabajo: {
        Lunes: { inicio: '09:00', fin: '18:00' },
        Martes: { inicio: '09:00', fin: '18:00' },
        Miercoles: { inicio: '09:00', fin: '18:00' },
        Jueves: { inicio: '09:00', fin: '18:00' },
        Viernes: { inicio: '09:00', fin: '18:00' },
      },
    },
  });
  console.log(`✅ Groomer creado: ${groomerUser.email}`);

  // Recepcionista
  const recepcionUser = await prisma.usuario.create({
    data: {
      email: 'carlos.lopez@petspa.com',
      passwordHash,
      nombre: 'Carlos',
      apellido: 'López',
      telefono: '+59177777779',
      rol: 'Recepcion',
      emailVerificado: true,
    },
  });
  console.log(`✅ Recepcionista creado: ${recepcionUser.email}`);

  // Cliente
  const clienteUser = await prisma.usuario.create({
    data: {
      email: 'cliente@ejemplo.com',
      passwordHash,
      nombre: 'María',
      apellido: 'Rodríguez',
      telefono: '+59177777780',
      rol: 'Cliente',
      emailVerificado: true,
    },
  });

  const cliente = await prisma.cliente.create({
    data: {
      usuarioId: clienteUser.id,
      direccionFisica: 'Calle Los Pinos #123, La Paz',
      canalNotificacionPreferido: 'Email',
    },
  });
  console.log(`✅ Cliente creado: ${clienteUser.email}`);

  // ============================================
  // CATEGORÍAS DE PRODUCTOS
  // ============================================
  
  const categoriaAlimento = await prisma.categoria.create({
    data: { nombre: 'Alimento', descripcion: 'Alimentos para mascotas' },
  });

  const categoriaHigiene = await prisma.categoria.create({
    data: { nombre: 'Higiene', descripcion: 'Productos de higiene y cuidado' },
  });

  const categoriaJuguetes = await prisma.categoria.create({
    data: { nombre: 'Juguetes', descripcion: 'Juguetes y accesorios' },
  });
  console.log('✅ Categorías creadas');

  // ============================================
  // PRODUCTOS Y VARIANTES
  // ============================================
  
  const alimentoPremium = await prisma.producto.create({
    data: {
      sku: 'ALIM-PREMIUM',
      nombre: 'Alimento Premium Canino',
      descripcion: 'Alimento balanceado premium para perros adultos',
      categoriaId: categoriaAlimento.id,
      precioBase: 85.00,
      stockMinimo: 10,
    },
  });

  await prisma.varianteProducto.createMany({
    data: [
      {
        productoId: alimentoPremium.id,
        atributo: 'Tamaño',
        valor: '1kg',
        skuVariante: 'ALIM-PREMIUM-1KG',
        precioExtra: 0,
        stockAdicional: 100,
      },
      {
        productoId: alimentoPremium.id,
        atributo: 'Tamaño',
        valor: '3kg',
        skuVariante: 'ALIM-PREMIUM-3KG',
        precioExtra: 160,
        stockAdicional: 50,
      },
    ],
  });

  const shampoo = await prisma.producto.create({
    data: {
      sku: 'SHAMP-OAT',
      nombre: 'Shampoo de Avena',
      descripcion: 'Shampoo hipoalergénico con avena para piel sensible',
      categoriaId: categoriaHigiene.id,
      precioBase: 45.00,
      stockMinimo: 5,
    },
  });

  await prisma.varianteProducto.createMany({
    data: [
      {
        productoId: shampoo.id,
        atributo: 'Fragancia',
        valor: 'Lavanda',
        skuVariante: 'SHAMP-OAT-LAV',
        precioExtra: 0,
        stockAdicional: 30,
      },
      {
        productoId: shampoo.id,
        atributo: 'Fragancia',
        valor: 'Manzanilla',
        skuVariante: 'SHAMP-OAT-MAN',
        precioExtra: 0,
        stockAdicional: 30,
      },
    ],
  });
  console.log('✅ Productos y variantes creados');

  // ============================================
  // SERVICIOS
  // ============================================
  
  const servicioCompleto = await prisma.servicio.create({
    data: {
      nombre: 'Baño y Corte Completo',
      descripcion: 'Incluye baño, corte de pelo, limpieza de oídos y corte de uñas',
      duracionBaseMinutos: 60,
      precioBase: 120.00,
      permiteDobleBooking: false,
      factorTamanoRaza: 0.20,
      requiereBloqueConsecutivo: false,
    },
  });

  const servicioBasico = await prisma.servicio.create({
    data: {
      nombre: 'Baño Básico',
      descripcion: 'Baño con shampoo premium y secado',
      duracionBaseMinutos: 30,
      precioBase: 60.00,
      permiteDobleBooking: true,
      factorTamanoRaza: 0.15,
    },
  });

  const servicioSpa = await prisma.servicio.create({
    data: {
      nombre: 'Spa Completo',
      descripcion: 'Baño, corte, tratamiento de piel y masaje relajante',
      duracionBaseMinutos: 90,
      precioBase: 200.00,
      permiteDobleBooking: false,
      factorTamanoRaza: 0.25,
      requiereBloqueConsecutivo: true,
    },
  });
  console.log('✅ Servicios creados');

  // ============================================
  // PLANTILLAS DE CHECKLIST
  // ============================================
  
  const checklistItems = [
    { item: 'Baño con shampoo', orden: 1 },
    { item: 'Corte de pelo', orden: 2 },
    { item: 'Corte de uñas', orden: 3 },
    { item: 'Limpieza de oídos', orden: 4 },
    { item: 'Limpieza de glándulas', orden: 5 },
    { item: 'Aplicación de perfume', orden: 6 },
    { item: 'Secado', orden: 7 },
  ];

  for (const item of checklistItems) {
    await prisma.plantillaChecklist.create({
      data: {
        servicioId: servicioCompleto.id,
        item: item.item,
        orden: item.orden,
        requiereObservacion: ['Corte de uñas', 'Limpieza de glándulas'].includes(item.item),
      },
    });
  }
  console.log('✅ Plantillas de checklist creadas');

  // ============================================
  // DISPONIBILIDAD DEL GROOMER
  // ============================================
  
  const diasSemana = [
    { dia: 1, nombre: 'Lunes' },
    { dia: 2, nombre: 'Martes' },
    { dia: 3, nombre: 'Miércoles' },
    { dia: 4, nombre: 'Jueves' },
    { dia: 5, nombre: 'Viernes' },
  ];

  for (const dia of diasSemana) {
    await prisma.disponibilidad.create({
      data: {
        groomerId: groomer.id,
        diaSemana: dia.dia,
        horaInicio: '09:00',
        horaFin: '18:00',
        intervaloDescanso: {
          inicio: '13:00',
          fin: '14:00',
        },
      },
    });
  }
  console.log('✅ Disponibilidad del groomer creada');

  // ============================================
  // MASCOTA DE EJEMPLO
  // ============================================
  
  const mascota = await prisma.mascota.create({
    data: {
      clienteId: cliente.id,
      nombre: 'Luna',
      especie: 'Canino',
      raza: 'Golden Retriever',
      fechaNacimiento: new Date('2022-03-15'),
      pesoKg: 28.5,
      temperamento: 'Jugueton',
      alergiasConocidas: 'Ninguna',
      restriccionesMedicas: 'Evitar estrés excesivo',
    },
  });

  await prisma.vacuna.create({
    data: {
      mascotaId: mascota.id,
      nombre: 'Rabia',
      fechaAplicacion: new Date('2024-01-10'),
      fechaVencimiento: new Date('2025-01-10'),
      lote: 'RAB-2024-001',
    },
  });
  console.log('✅ Mascota de ejemplo creada');

  // ============================================
  // RESUMEN FINAL
  // ============================================
  
  console.log('\n========================================');
  console.log('🌱 SEED COMPLETADO EXITOSAMENTE');
  console.log('========================================');
  console.log('\n📧 USUARIOS DE PRUEBA:');
  console.log('------------------------------------------');
  console.log('👑 Admin:');
  console.log('   Email: admin@petspa.com');
  console.log('   Contraseña: Admin123!');
  console.log('   Rol: Admin');
  console.log('------------------------------------------');
  console.log('✂️  Groomer:');
  console.log('   Email: ana.garcia@petspa.com');
  console.log('   Contraseña: Admin123!');
  console.log('   Rol: Groomer');
  console.log('------------------------------------------');
  console.log('📋 Recepcionista:');
  console.log('   Email: carlos.lopez@petspa.com');
  console.log('   Contraseña: Admin123!');
  console.log('   Rol: Recepcion');
  console.log('------------------------------------------');
  console.log('🐕 Cliente:');
  console.log('   Email: cliente@ejemplo.com');
  console.log('   Contraseña: Admin123!');
  console.log('   Rol: Cliente');
  console.log('   Mascota: Luna (Golden Retriever)');
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });