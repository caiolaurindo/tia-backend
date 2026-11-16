import { Request, Response, NextFunction } from 'express';
import { corsMiddleware } from '../../src/middlewares/cors.middleware';
import { AppError } from '../../src/utils/app-error';

describe('corsMiddleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;

  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };

    res = {
      setHeader: jest.fn(),
      getHeader: jest.fn(),
      statusCode: 200,
    };

    next = jest.fn();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Requisições sem Header Origin', () => {
    it('deve permitir requisições sem origin', (done) => {
      req = {
        headers: {},
        method: 'GET',
        url: '/api/v1/alunos',
      };

      const customNext: NextFunction = (err?: any) => {
        expect(err).toBeUndefined();
        done();
      };

      corsMiddleware(req as Request, res as Response, customNext);
    });
  });

  describe('Requisições com Origens Padrão (defaultOrigins)', () => {
    it.each([
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8081',
      'http://127.0.0.1:8081',
    ])('deve permitir a origem padrão autorizada: %s', (origem, done) => {
      delete process.env.ALLOWED_ORIGINS;

      req = {
        headers: { origin: origem },
        method: 'GET',
        url: '/api/v1/turmas',
      };

      const customNext: NextFunction = (err?: any) => {
        expect(err).toBeUndefined();
        done();
      };

      corsMiddleware(req as Request, res as Response, customNext);
    });
  });

  describe('Requisições com Origens Personalizadas via ALLOWED_ORIGINS', () => {
    it('deve permitir origem configurada via variável de ambiente ALLOWED_ORIGINS', (done) => {
      process.env.ALLOWED_ORIGINS = 'https://tia.unicap.br, https://tia-app.com';

      req = {
        headers: { origin: 'https://tia.unicap.br' },
        method: 'POST',
        url: '/api/v1/professores/login',
      };

      const customNext: NextFunction = (err?: any) => {
        expect(err).toBeUndefined();
        done();
      };

      corsMiddleware(req as Request, res as Response, customNext);
    });
  });

  describe('Bloqueio de Origens Não Autorizadas', () => {
    it('deve bloquear origem não autorizada e repassar AppError 403 para o next', (done) => {
      req = {
        headers: { origin: 'https://site-malicioso.com' },
        method: 'DELETE',
        originalUrl: '/api/v1/alunos/10',
        ip: '192.168.1.100',
      };

      const customNext: NextFunction = (err?: any) => {
        expect(err).toBeInstanceOf(AppError);
        expect(err.statusCode).toBe(403);
        expect(err.message).toContain("Bloqueio de CORS: Origem 'https://site-malicioso.com' não autorizada");
        expect(err.message).toContain('192.168.1.100');
        expect(err.message).toContain('DELETE /api/v1/alunos/10');
        done();
      };

      corsMiddleware(req as Request, res as Response, customNext);
    });

    it('deve usar fallback de IP (socket.remoteAddress) e url caso ip e originalUrl não existam', (done) => {
      req = {
        headers: { origin: 'https://site-nao-autorizado.com' },
        method: 'GET',
        url: '/api/v1/aulas',
        socket: { remoteAddress: '10.0.0.5' } as any,
      };

      const customNext: NextFunction = (err?: any) => {
        expect(err).toBeInstanceOf(AppError);
        expect(err.statusCode).toBe(403);
        expect(err.message).toContain('10.0.0.5');
        expect(err.message).toContain('GET /api/v1/aulas');
        done();
      };

      corsMiddleware(req as Request, res as Response, customNext);
    });

    it('deve usar IP "desconhecido" caso req.ip e req.socket.remoteAddress não estejam definidos', (done) => {
      req = {
        headers: { origin: 'https://site-desconhecido.com' },
        method: 'GET',
        url: '/api/v1/status',
        socket: {} as any,
      };

      const customNext: NextFunction = (err?: any) => {
        expect(err).toBeInstanceOf(AppError);
        expect(err.statusCode).toBe(403);
        expect(err.message).toContain('desconhecido');
        done();
      };

      corsMiddleware(req as Request, res as Response, customNext);
    });
  });
});
