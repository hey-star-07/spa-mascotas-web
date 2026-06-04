import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { rateLimiter } from './shared/middleware/rateLimiter';
import { errorHandler } from './shared/errors/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes'; 
import servicesRoutes from './modules/services/services.routes';
import availabilityRoutes from './modules/availability/availability.routes';
import petsRoutes from './modules/pets/pets.routes';
import groomingRoutes from './modules/grooming/grooming.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';
import billingRoutes from './modules/billing/billing.routes';
import uploadRoutes from './modules/upload/upload.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import auditLogsRoutes from './modules/audit-logs/audit-logs.routes';
import appointmentsRoutes from './modules/appointments/appointments.routes';
import storeRoutes from './modules/store/store.routes';
import promotionsRoutes from './modules/promotions/promotions.routes';
import reportsRoutes from './modules/reports/reports.routes';
import { logger } from './config/logger';


const app: Application = express();

// ============================================
// MIDDLEWARES GLOBALES
// ============================================

// Seguridad HTTP headers
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://tudominio.com' 
    : '*',
  credentials: true,
}));

// Rate Limiting
app.use('/api/', rateLimiter);

// Logging HTTP
app.use(morgan('combined', { 
  stream: { write: (message) => logger.http(message.trim()) }
}));

// Parse JSON body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
// ============================================
// RUTAS
// ============================================

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Pet Spa API funcionando correctamente',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Módulo de Autenticación
app.use('/api/auth', authRoutes);

// Módulo de Usuarios
app.use('/api/users', usersRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/audit-logs', auditLogsRoutes);
app.use('/api/pets', petsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/grooming', groomingRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationsRoutes);

app.use('/api/store', storeRoutes);
app.use('/api/promotions', promotionsRoutes);

app.use('/api/reports', reportsRoutes);
// ============================================
// MANEJO DE ERRORES
// ============================================

// 404 - Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Ruta no encontrada: ${req.originalUrl}`,
  });
});

// Error handler global
app.use(errorHandler);

export default app;