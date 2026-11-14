import { Request, Response, NextFunction } from 'express';
import { manipuladorDeErros } from '../../src/middlewares/error.middleware';
import { AppError } from '../../src/utils/app-error';

describe('manipuladorDeErros (error.middleware)', () => {
  const req = {} as Request;
  let res: Response;
  let next: jest.MockedFunction<NextFunction>;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;
    next = jest.fn();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('AppError (erro operacional)', () => {
    it.each([
      [400, 'Dados inválidos'],
      [401, 'Não autorizado'],
      [404, 'Aluno não encontrado'],
      [409, 'Registro duplicado'],
    ])('deve responder com o status customizado %i e a mensagem do erro', (status, mensagem) => {
      manipuladorDeErros(new AppError(mensagem, status), req, res, next);

      expect(res.status).toHaveBeenCalledWith(status);
      expect(res.json).toHaveBeenCalledWith({ status: 'erro', mensagem });
    });

    it('deve usar o status padrão 400 quando AppError é criado sem statusCode', () => {
      manipuladorDeErros(new AppError('Requisição inválida'), req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'erro',
        mensagem: 'Requisição inválida',
      });
    });

    it('não deve logar no console nem chamar next', () => {
      manipuladorDeErros(new AppError('Não encontrado', 404), req, res, next);

      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('erro inesperado', () => {
    it('deve responder 500 com mensagem genérica', () => {
      manipuladorDeErros(new Error('falha no banco'), req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'erro',
        mensagem: 'Erro interno do servidor',
      });
    });

    it('não deve vazar a mensagem original do erro para o cliente', () => {
      manipuladorDeErros(new Error('senha do banco: 123456'), req, res, next);

      const corpo = (res.json as jest.Mock).mock.calls[0][0];
      expect(JSON.stringify(corpo)).not.toContain('senha do banco');
    });

    it('deve registrar o erro original com console.error', () => {
      const erro = new Error('falha no banco');

      manipuladorDeErros(erro, req, res, next);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(erro);
    });

    it('deve tratar TypeError e outras subclasses de Error como 500', () => {
      manipuladorDeErros(new TypeError('x is undefined'), req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
