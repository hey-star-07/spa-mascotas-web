import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/config/database';

describe('🧪 Auth Module - Integration Tests', () => {
  let adminToken: string;
  let clientToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    // Conectar a la BD si es necesario
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register/client', () => {
    it('✅ Debería registrar un nuevo cliente', async () => {
      const res = await request(app)
        .post('/api/auth/register/client')
        .send({
          email: 'test@ejemplo.com',
          password: 'TestPass123!',
          nombre: 'Test',
          apellido: 'User',
          telefono: '+59177777777',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toContain('Registro exitoso');
    });

    it('❌ Debería rechazar email duplicado', async () => {
      const res = await request(app)
        .post('/api/auth/register/client')
        .send({
          email: 'admin@petspa.com', // Email del admin del seed
          password: 'TestPass123!',
          nombre: 'Test',
        });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('❌ Debería rechazar contraseña débil', async () => {
      const res = await request(app)
        .post('/api/auth/register/client')
        .send({
          email: 'weak@ejemplo.com',
          password: '123', // Muy corta y simple
          nombre: 'Test',
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('PASSWORD_TOO_WEAK');
    });
  });

  describe('POST /api/auth/login', () => {
    it('✅ Debería iniciar sesión correctamente', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@petspa.com',
          password: 'Admin123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      
      adminToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    it('❌ Debería rechazar credenciales incorrectas', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@petspa.com',
          password: 'WrongPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('GET /api/auth/me', () => {
    it('✅ Debería obtener perfil con token válido', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('admin@petspa.com');
    });

    it('❌ Debería rechazar sin token', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/register/staff', () => {
    it('✅ Admin debería poder crear personal', async () => {
      const res = await request(app)
        .post('/api/auth/register/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'nuevo.groomer@petspa.com',
          password: 'GroomerPass123!',
          nombre: 'Nuevo',
          apellido: 'Groomer',
          rol: 'Groomer',
          especialidad: 'Corte creativo',
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toContain('Groomer');
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    it('✅ Debería renovar tokens', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });
  });
});