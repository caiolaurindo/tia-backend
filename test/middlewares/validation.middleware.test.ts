import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { validarRequisicao } from '../../src/middlewares/validation.middleware';
import { AppError } from '../../src/utils/app-error';

describe('validarRequisicao (validation.middleware)', () => {
  const res = {} as Response;
  let next: jest.MockedFunction<NextFunction>;

  const schema = z.object({
    nome: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
    idade: z.number().positive('Idade deve ser positiva'),
  });

  const criarReq = (body: unknown) => ({ body } as unknown as Request);

  beforeEach(() => {
    next = jest.fn();
  });

  describe('payload válido', () => {
    it('deve chamar next() sem argumentos', () => {
      const req = criarReq({ nome: 'Maria', idade: 30 });

      validarRequisicao(schema)(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('deve substituir req.body pelo resultado do parse (removendo chaves desconhecidas)', () => {
      const req = criarReq({ nome: 'Maria', idade: 30, admin: true });

      validarRequisicao(schema)(req, res, next);

      expect(req.body).toEqual({ nome: 'Maria', idade: 30 });
      expect(req.body).not.toHaveProperty('admin');
    });

    it('deve aplicar transformações do schema em req.body', () => {
      const schemaComTransform = z.object({
        email: z.string().trim().toLowerCase(),
      });
      const req = criarReq({ email: '  PROF@Teste.COM ' });

      validarRequisicao(schemaComTransform)(req, res, next);

      expect(req.body).toEqual({ email: 'prof@teste.com' });
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('payload inválido', () => {
    it('deve chamar next com AppError 400 contendo as mensagens do Zod', () => {
      const req = criarReq({ nome: 'ab', idade: -1 });

      validarRequisicao(schema)(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const erro = next.mock.calls[0][0];
      expect(erro).toBeInstanceOf(AppError);
      expect(erro).toMatchObject({
        statusCode: 400,
        message:
          'Dados inválidos: nome: Nome deve ter ao menos 3 caracteres; idade: Idade deve ser positiva',
      });
    });

    it('deve incluir o caminho completo (path) de campos aninhados', () => {
      const schemaAninhado = z.object({
        endereco: z.object({
          cep: z.string().length(8, 'CEP deve ter 8 dígitos'),
        }),
      });
      const req = criarReq({ endereco: { cep: '123' } });

      validarRequisicao(schemaAninhado)(req, res, next);

      const erro = next.mock.calls[0][0];
      expect(erro).toBeInstanceOf(AppError);
      expect((erro as AppError).message).toBe(
        'Dados inválidos: endereco.cep: CEP deve ter 8 dígitos'
      );
    });

    it('deve reportar campos ausentes', () => {
      const req = criarReq({});

      validarRequisicao(schema)(req, res, next);

      const erro = next.mock.calls[0][0] as AppError;
      expect(erro).toBeInstanceOf(AppError);
      expect(erro.statusCode).toBe(400);
      expect(erro.message).toContain('nome');
      expect(erro.message).toContain('idade');
    });

    it('não deve alterar req.body quando a validação falha', () => {
      const bodyOriginal = { nome: 'ab', idade: -1 };
      const req = criarReq(bodyOriginal);

      validarRequisicao(schema)(req, res, next);

      expect(req.body).toBe(bodyOriginal);
    });
  });

  describe('erro que não é ZodError', () => {
    it('deve repassar o erro original para next', () => {
      const erroInesperado = new Error('falha inesperada no schema');
      const schemaQuebrado = {
        parse: jest.fn(() => {
          throw erroInesperado;
        }),
      } as unknown as ZodSchema;
      const req = criarReq({});

      validarRequisicao(schemaQuebrado)(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(erroInesperado);
      expect(next.mock.calls[0][0]).not.toBeInstanceOf(AppError);
    });
  });
});
