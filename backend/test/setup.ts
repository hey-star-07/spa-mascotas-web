import dotenv from 'dotenv';

// Cargar variables de entorno para tests
dotenv.config({ path: '.env.test' });

// Aumentar timeout para tests asíncronos
jest.setTimeout(30000);

// Limpiar mocks después de cada test
afterEach(() => {
  jest.clearAllMocks();
});