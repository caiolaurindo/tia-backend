import jwt from 'jsonwebtoken';
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

describe('JwtUtil', () => {
  const ENV_ORIGINAL = { ...process.env };
  const SEGREDO = 'segredo-de-teste';
  const payload: PayloadToken = { sub: 1, email: 'professor@teste.com' };

  beforeEach(() => {
    process.env.JWT_SECRET = SEGREDO;
    delete process.env.JWT_EXPIRATION;
  });

  afterEach(() => {
    process.env = { ...ENV_ORIGINAL };
  });

  describe('gerarToken', () => {
    it('deve gerar um JWT (3 partes) contendo o payload informado', () => {
      const token = JwtUtil.gerarToken(payload);

      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);

      const decodificado = jwt.verify(token, SEGREDO) as jwt.JwtPayload;
      expect(decodificado.sub).toBe(payload.sub);
      expect(decodificado.email).toBe(payload.email);
    });

    it('deve usar expiração de 1 dia quando JWT_EXPIRATION não está definida', () => {
      const token = JwtUtil.gerarToken(payload);
      const { iat, exp } = jwt.decode(token) as jwt.JwtPayload;

      expect(exp! - iat!).toBe(60 * 60 * 24);
    });

    it('deve respeitar a expiração definida em JWT_EXPIRATION', () => {
      process.env.JWT_EXPIRATION = '2h';

      const token = JwtUtil.gerarToken(payload);
      const { iat, exp } = jwt.decode(token) as jwt.JwtPayload;

      expect(exp! - iat!).toBe(60 * 60 * 2);
    });

    it('deve lançar erro quando JWT_SECRET não está configurada', () => {
      delete process.env.JWT_SECRET;

      expect(() => JwtUtil.gerarToken(payload)).toThrow(
        'Variável de ambiente JWT_SECRET não configurada.'
      );
    });

    it('deve lançar erro quando JWT_SECRET contém apenas espaços', () => {
      process.env.JWT_SECRET = '   ';

      expect(() => JwtUtil.gerarToken(payload)).toThrow(
        'Variável de ambiente JWT_SECRET não configurada.'
      );
    });
  });

  describe('verificarToken', () => {
    it('deve retornar o payload de um token válido', () => {
      const token = JwtUtil.gerarToken(payload);

      const resultado = JwtUtil.verificarToken(token);

      expect(resultado).toMatchObject(payload);
    });

    it('deve lançar AppError 401 para token assinado com outro segredo', () => {
      const tokenFalso = jwt.sign(payload, 'outro-segredo');

      const erro = capturarErro(() => JwtUtil.verificarToken(tokenFalso));

      expect(erro).toBeInstanceOf(AppError);
      expect(erro).toMatchObject({
        statusCode: 401,
        message: 'Token inválido ou expirado.',
      });
    });

    it('deve lançar AppError 401 para token expirado', () => {
      const tokenExpirado = jwt.sign(payload, SEGREDO, { expiresIn: -10 });

      const erro = capturarErro(() => JwtUtil.verificarToken(tokenExpirado));

      expect(erro).toBeInstanceOf(AppError);
      expect(erro).toMatchObject({ statusCode: 401 });
    });

    it('deve lançar AppError 401 para token malformado', () => {
      const erro = capturarErro(() => JwtUtil.verificarToken('isso-nao-e-um-jwt'));

      expect(erro).toBeInstanceOf(AppError);
      expect(erro).toMatchObject({ statusCode: 401 });
    });

    it('deve lançar erro de configuração (não AppError) quando JWT_SECRET não está definida', () => {
      const token = JwtUtil.gerarToken(payload);
      delete process.env.JWT_SECRET;

      const erro = capturarErro(() => JwtUtil.verificarToken(token));

      expect(erro).toBeInstanceOf(Error);
      expect(erro).not.toBeInstanceOf(AppError);
      expect((erro as Error).message).toBe('Variável de ambiente JWT_SECRET não configurada.');
    });
  });
});
