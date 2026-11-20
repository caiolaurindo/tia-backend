import { Request, Response, NextFunction } from 'express';
import { z, ZodType } from 'zod';
import { validarRequisicao } from '../../src/middlewares/validation.middleware';
import { AppError } from '../../src/utils/app-error';

describe('validarRequisicao (validation.middleware)', () => {
  let res: Response;
  let next: jest.MockedFunction<NextFunction>;

  const schema = z.object({
    nome: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
    idade: z.number().positive('Idade deve ser positiva'),
  });

  const criarReq = (
    body: unknown = {},
    params: Record<string, unknown> = {},
    query: Record<string, unknown> = {}
  ) => ({ body, params, query } as unknown as Request);

  beforeEach(() => {
    res = { locals: {} } as unknown as Response;
    next = jest.fn();
  });

  describe('validação de body (com strict automático)', () => {
    it('deve chamar next() sem argumentos para payload válido', () => {
      const req = criarReq({ nome: 'Maria', idade: 30 });

      validarRequisicao(schema)(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('deve rejeitar chaves desconhecidas no body com AppError 400 (body.strict())', () => {
      const bodyOriginal = { nome: 'Maria', idade: 30, admin: true };
      const req = criarReq(bodyOriginal);

      validarRequisicao(schema)(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const erro = next.mock.calls[0][0] as unknown as AppError;
      expect(erro).toBeInstanceOf(AppError);
      expect(erro.statusCode).toBe(400);
      expect(erro.message).toBe('Dados inválidos: Campo(s) não permitido(s): admin');
      expect(req.body).toBe(bodyOriginal);
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

      const erro = next.mock.calls[0][0] as unknown as AppError;
      expect(erro).toBeInstanceOf(AppError);
      expect(erro.message).toBe(
        'Dados inválidos: endereco.cep: CEP deve ter 8 dígitos'
      );
    });

    it('deve reportar campos ausentes', () => {
      const req = criarReq({});

      validarRequisicao(schema)(req, res, next);

      const erro = next.mock.calls[0][0] as unknown as AppError;
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

  describe('validação de params', () => {
    const idSchema = z.object({
      id: z.coerce.number().int().positive('ID inválido'),
    });

    it('deve validar params via sobrecarga (schema, "params") e salvar em req.params e res.locals.validatedParams', () => {
      const req = criarReq({}, { id: '42' });

      validarRequisicao(idSchema, 'params')(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.params).toEqual({ id: 42 });
      expect(res.locals.validatedParams).toEqual({ id: 42 });
    });

    it('deve rejeitar params inválidos com AppError 400 sem alterar req.params', () => {
      const paramsOriginais = { id: 'abc' };
      const req = criarReq({}, paramsOriginais);

      validarRequisicao({ params: idSchema })(req, res, next);

      const erro = next.mock.calls[0][0] as unknown as AppError;
      expect(erro).toBeInstanceOf(AppError);
      expect(erro.statusCode).toBe(400);
      expect(erro.message).toContain('id');
      expect(req.params).toBe(paramsOriginais);
    });
  });

  describe('validação de query', () => {
    const querySchema = z.object({
      page: z.coerce.number().int().min(1).default(1),
      nome: z.string().trim().optional(),
    });

    it('deve validar query via sobrecarga (schema, "query") e armazenar em res.locals.validatedQuery sem reatribuir req.query', () => {
      const req = { body: {}, params: {} } as unknown as Request;
      Object.defineProperty(req, 'query', {
        get: () => ({ page: '2', nome: '  Turma A  ' }),
        configurable: true,
      });

      validarRequisicao(querySchema, 'query')(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.locals.validatedQuery).toEqual({ page: 2, nome: 'Turma A' });
    });

    it('deve inicializar res.locals se estiver ausente no mock de response', () => {
      const resSemLocals = {} as Response;
      const req = criarReq({}, {}, { page: '3' });

      validarRequisicao({ query: querySchema })(req, resSemLocals, next);

      expect(next).toHaveBeenCalledWith();
      expect(resSemLocals.locals.validatedQuery).toEqual({ page: 3 });
    });

    it('deve rejeitar query inválida com AppError 400', () => {
      const req = criarReq({}, {}, { page: '0' });

      validarRequisicao(querySchema, 'query')(req, res, next);

      const erro = next.mock.calls[0][0] as unknown as AppError;
      expect(erro).toBeInstanceOf(AppError);
      expect(erro.statusCode).toBe(400);
      expect(erro.message).toContain('page');
    });
  });

  describe('validação combinada ({ params, query, body })', () => {
    const paramsSchema = z.object({
      id: z.coerce.number().int().positive('ID deve ser positivo'),
    });
    const querySchema = z.object({
      ativo: z.enum(['true', 'false']).optional(),
    });

    it('deve validar params, query e body em uma única chamada', () => {
      const req = criarReq(
        { nome: 'Joana', idade: 25 },
        { id: '7' },
        { ativo: 'true' }
      );

      validarRequisicao({
        params: paramsSchema,
        query: querySchema,
        body: schema,
      })(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.params).toEqual({ id: 7 });
      expect(res.locals.validatedParams).toEqual({ id: 7 });
      expect(res.locals.validatedQuery).toEqual({ ativo: 'true' });
      expect(req.body).toEqual({ nome: 'Joana', idade: 25 });
    });

    it('deve agregar erros de múltiplas origens e não mutar req/res quando qualquer parte falhar', () => {
      const paramsOriginais = { id: '-1' };
      const bodyOriginal = { nome: 'Maria', idade: 30, extra: 'invalido' };
      const req = criarReq(bodyOriginal, paramsOriginais, { ativo: 'talvez' });

      validarRequisicao({
        params: paramsSchema,
        query: querySchema,
        body: schema,
      })(req, res, next);

      const erro = next.mock.calls[0][0] as unknown as AppError;
      expect(erro).toBeInstanceOf(AppError);
      expect(erro.statusCode).toBe(400);
      expect(erro.message).toContain('ID deve ser positivo');
      expect(erro.message).toContain('ativo');
      expect(erro.message).toContain('Campo(s) não permitido(s): extra');
      expect(req.params).toBe(paramsOriginais);
      expect(req.body).toBe(bodyOriginal);
      expect(res.locals.validatedParams).toBeUndefined();
      expect(res.locals.validatedQuery).toBeUndefined();
    });
  });

  describe('erro que não é ZodError', () => {
    it('deve repassar o erro original para next', () => {
      const erroInesperado = new Error('falha inesperada no schema');
      const schemaQuebrado = {
        parse: jest.fn(() => {
          throw erroInesperado;
        }),
      } as unknown as ZodType;
      const req = criarReq({});

      validarRequisicao(schemaQuebrado)(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(erroInesperado);
      expect(next.mock.calls[0][0]).not.toBeInstanceOf(AppError);
    });
  });
});
