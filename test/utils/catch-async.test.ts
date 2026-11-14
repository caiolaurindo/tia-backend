import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../../src/utils/catch-async';

const aguardarPromises = () => new Promise<void>((resolve) => setImmediate(resolve));

describe('catchAsync', () => {
  const req = {} as Request;
  const res = {} as Response;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    next = jest.fn();
  });

  it('deve retornar um middleware (função com 3 parâmetros)', () => {
    const handler = catchAsync(async () => {});

    expect(typeof handler).toBe('function');
    expect(handler).toHaveLength(3);
  });

  it('deve repassar req, res e next para a função original', async () => {
    const fn = jest.fn().mockResolvedValue(undefined);

    catchAsync(fn)(req, res, next);
    await aguardarPromises();

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(req, res, next);
  });

  it('não deve chamar next quando a função assíncrona resolve com sucesso', async () => {
    catchAsync(async () => 'ok')(req, res, next);
    await aguardarPromises();

    expect(next).not.toHaveBeenCalled();
  });

  it('deve chamar next(err) quando a função assíncrona rejeita', async () => {
    const erro = new Error('falha assíncrona');

    catchAsync(async () => {
      throw erro;
    })(req, res, next);
    await aguardarPromises();

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(erro);
  });

  it('deve chamar next(err) quando a função retorna uma Promise rejeitada', async () => {
    const erro = new Error('promise rejeitada');

    catchAsync(() => Promise.reject(erro))(req, res, next);
    await aguardarPromises();

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(erro);
  });

  it('deve funcionar com funções síncronas que retornam normalmente', async () => {
    const fn = jest.fn().mockReturnValue('valor');

    catchAsync(fn)(req, res, next);
    await aguardarPromises();

    expect(fn).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
  });

  it('não captura exceções síncronas (elas propagam; o Express 5 as trata no router)', () => {
    const erro = new Error('falha síncrona');
    const handler = catchAsync(() => {
      throw erro;
    });

    expect(() => handler(req, res, next)).toThrow(erro);
    expect(next).not.toHaveBeenCalled();
  });
});
