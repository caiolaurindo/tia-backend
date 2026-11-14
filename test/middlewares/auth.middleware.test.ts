import { Request, Response, NextFunction } from 'express';
import { autenticar } from '../../src/middlewares/auth.middleware';
import { JwtUtil, PayloadToken } from '../../src/utils/jwt.util';
import { AppError } from '../../src/utils/app-error';

function capturarErro(fn: () => unknown): unknown {
  try {
    fn();
  } catch (erro) {
    return erro;
  }
  return undefined;
}

function criarReq(authorization?: string): Request {
  return {
    headers: authorization === undefined ? {} : { authorization },
  } as unknown as Request;
}

describe('autenticar (auth.middleware)', () => {
  const res = {} as Response;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    next = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('header Authorization ausente ou mal formatado', () => {
    it('deve lançar AppError 401 quando o header Authorization não é enviado', () => {
      const verificar = jest.spyOn(JwtUtil, 'verificarToken');

      const erro = capturarErro(() => autenticar(criarReq(), res, next));

      expect(erro).toBeInstanceOf(AppError);
      expect(erro).toMatchObject({
        statusCode: 401,
        message: 'Token de autenticação não fornecido.',
      });
      expect(verificar).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it.each([
      ['esquema diferente de Bearer', 'Basic abc123'],
      ['esquema em minúsculas', 'bearer abc123'],
      ['Bearer sem token', 'Bearer'],
      ['Bearer com espaço mas sem token', 'Bearer '],
      ['token sem esquema', 'abc123'],
    ])('deve lançar AppError 401 de formato inválido: %s', (_descricao, header) => {
      const verificar = jest.spyOn(JwtUtil, 'verificarToken');

      const erro = capturarErro(() => autenticar(criarReq(header), res, next));

      expect(erro).toBeInstanceOf(AppError);
      expect(erro).toMatchObject({
        statusCode: 401,
        message: 'Formato de token inválido.',
      });
      expect(verificar).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('token inválido ou expirado', () => {
    it('deve propagar o AppError 401 de JwtUtil e não chamar next', () => {
      jest.spyOn(JwtUtil, 'verificarToken').mockImplementation(() => {
        throw new AppError('Token inválido ou expirado.', 401);
      });
      const req = criarReq('Bearer token-ruim');

      const erro = capturarErro(() => autenticar(req, res, next));

      expect(erro).toBeInstanceOf(AppError);
      expect(erro).toMatchObject({
        statusCode: 401,
        message: 'Token inválido ou expirado.',
      });
      expect(req.usuario).toBeUndefined();
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('token válido', () => {
    const payload: PayloadToken = { sub: 7, email: 'professor@teste.com' };

    it('deve injetar o payload em req.usuario e chamar next() sem argumentos', () => {
      const verificar = jest.spyOn(JwtUtil, 'verificarToken').mockReturnValue(payload);
      const req = criarReq('Bearer token-valido');

      autenticar(req, res, next);

      expect(verificar).toHaveBeenCalledWith('token-valido');
      expect(req.usuario).toEqual(payload);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    describe('integração com JwtUtil real', () => {
      const ENV_ORIGINAL = { ...process.env };

      beforeEach(() => {
        process.env.JWT_SECRET = 'segredo-de-teste';
      });

      afterEach(() => {
        process.env = { ...ENV_ORIGINAL };
      });

      it('deve autenticar com um token gerado por JwtUtil.gerarToken', () => {
        const token = JwtUtil.gerarToken(payload);
        const req = criarReq(`Bearer ${token}`);

        autenticar(req, res, next);

        expect(req.usuario).toMatchObject(payload);
        expect(next).toHaveBeenCalledTimes(1);
      });
    });
  });
});
