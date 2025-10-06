/**
 * Setup global para tests
 * Este archivo se ejecuta antes de todos los tests
 */

// Mock de variables de entorno para testing
Object.defineProperty(process.env, 'NODE_ENV', { value: 'test', writable: true })
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || "postgresql://test:test@localhost:5432/test"
process.env.REDIS_URL = process.env.TEST_REDIS_URL || "redis://localhost:6379"
process.env.NEXTAUTH_SECRET = "test-secret-key-for-testing-only-min-32-chars"
process.env.NEXTAUTH_URL = "http://localhost:3000"

// Mock de console para tests más limpios (opcional)
global.console = {
  ...console,
  // Silenciar logs en tests (descomentar si quieres logs limpios)
  // log: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
}

export {}
