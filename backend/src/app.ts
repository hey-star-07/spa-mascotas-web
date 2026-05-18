import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimiter } from './shared/middleware/rateLimiter';
import { errorHandler } from './shared/errors/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes'; // 👈 Nueva importación
import auditLogsRoutes from './modules/audit-logs/audit-logs.routes';
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
app.use('/api/users', usersRoutes); // 👈 Nueva ruta
app.use('/api/audit-logs', auditLogsRoutes);
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