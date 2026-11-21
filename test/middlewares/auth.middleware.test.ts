import { Request, Response, NextFunction } from 'express';
import { autenticar, autorizar } from '../../src/middlewares/auth.middleware';
import { JwtUtil, PayloadToken } from '../../src/utils/jwt.util';
import { AppError } from '../../src/utils/app-error';
import { RoleUsuario } from '../../src/models/professor.entity';

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

describe('autenticar e autorizar (auth.middleware)', () => {
  const res = {} as Response;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    next = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('autenticar', () => {
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

    describe('token inválido, expirado ou com claims RBAC inválidas', () => {
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

      it('deve lançar AppError 403 quando o usuário no token estiver inativo', () => {
        jest.spyOn(JwtUtil, 'verificarToken').mockReturnValue({
          sub: 7,
          email: 'professor@teste.com',
          role: RoleUsuario.PROFESSOR,
          ativo: false,
        });
        const req = criarReq('Bearer token-inativo');

        const erro = capturarErro(() => autenticar(req, res, next));

        expect(erro).toBeInstanceOf(AppError);
        expect(erro).toMatchObject({
          statusCode: 403,
          message: 'Usuário inativo. Acesso negado.',
        });
        expect(req.usuario).toBeUndefined();
        expect(next).not.toHaveBeenCalled();
      });

      it.each([
        ['sem role', { sub: 7, email: 'a@b.com', ativo: true }],
        ['role desconhecida', { sub: 7, email: 'a@b.com', role: 'COORDENADOR', ativo: true }],
        ['sem ativo', { sub: 7, email: 'a@b.com', role: RoleUsuario.PROFESSOR }],
      ])('deve rejeitar com 401 token legado/malformado (%s)', (_descricao, payloadInvalido) => {
        jest
          .spyOn(JwtUtil, 'verificarToken')
          .mockReturnValue(payloadInvalido as unknown as PayloadToken);
        const req = criarReq('Bearer token-incompleto');

        const erro = capturarErro(() => autenticar(req, res, next));

        expect(erro).toBeInstanceOf(AppError);
        expect(erro).toMatchObject({
          statusCode: 401,
          message: 'Token inválido ou expirado.',
        });
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('token válido', () => {
      const payload: PayloadToken = {
        sub: 7,
        email: 'professor@teste.com',
        role: RoleUsuario.PROFESSOR,
        ativo: true,
      };

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

  describe('autorizar (RBAC)', () => {
    const criarReqComUsuario = (usuario?: PayloadToken): Request =>
      ({ usuario } as unknown as Request);

    it('deve permitir acesso quando a role do usuário está na lista permitida', () => {
      const req = criarReqComUsuario({
        sub: 1,
        email: 'admin@teste.com',
        role: RoleUsuario.ADMIN,
        ativo: true,
      });

      autorizar(RoleUsuario.ADMIN)(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('deve permitir acesso quando múltiplas roles são aceitas', () => {
      const req = criarReqComUsuario({
        sub: 2,
        email: 'prof@teste.com',
        role: RoleUsuario.PROFESSOR,
        ativo: true,
      });

      autorizar(RoleUsuario.PROFESSOR, RoleUsuario.ADMIN)(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('deve lançar AppError 403 quando a role do usuário não tiver permissão', () => {
      const req = criarReqComUsuario({
        sub: 2,
        email: 'prof@teste.com',
        role: RoleUsuario.PROFESSOR,
        ativo: true,
      });

      const erro = capturarErro(() => autorizar(RoleUsuario.ADMIN)(req, res, next));

      expect(erro).toBeInstanceOf(AppError);
      expect(erro).toMatchObject({
        statusCode: 403,
        message: 'Acesso negado: permissão insuficiente.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('deve lançar AppError 401 quando req.usuario não estiver preenchido', () => {
      const req = criarReqComUsuario(undefined);

      const erro = capturarErro(() => autorizar(RoleUsuario.ADMIN)(req, res, next));

      expect(erro).toBeInstanceOf(AppError);
      expect(erro).toMatchObject({
        statusCode: 401,
        message: 'Usuário não autenticado.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('deve lançar AppError 403 quando o usuário estiver inativo', () => {
      const req = criarReqComUsuario({
        sub: 1,
        email: 'admin@teste.com',
        role: RoleUsuario.ADMIN,
        ativo: false,
      });

      const erro = capturarErro(() => autorizar(RoleUsuario.ADMIN)(req, res, next));

      expect(erro).toBeInstanceOf(AppError);
      expect(erro).toMatchObject({
        statusCode: 403,
        message: 'Usuário inativo. Acesso negado.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('deve negar acesso (fail-closed) quando nenhuma role for informada', () => {
      const req = criarReqComUsuario({
        sub: 1,
        email: 'admin@teste.com',
        role: RoleUsuario.ADMIN,
        ativo: true,
      });

      const erro = capturarErro(() => autorizar()(req, res, next));

      expect(erro).toBeInstanceOf(AppError);
      expect(erro).toMatchObject({
        statusCode: 403,
        message: 'Acesso negado: permissão insuficiente.',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
