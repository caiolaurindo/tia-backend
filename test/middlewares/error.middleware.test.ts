import { Request, Response, NextFunction } from 'express';
import { QueryFailedError } from 'typeorm';
import { manipuladorDeErros } from '../../src/middlewares/error.middleware';
import { AppError } from '../../src/utils/app-error';

function criarMulterError(code: string, message = 'Multer error', field?: string): Error {
  const err = new Error(message) as Error & { code: string; field?: string };
  err.name = 'MulterError';
  err.code = code;
  if (field) {
    err.field = field;
  }
  return err;
}

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
      [403, 'Acesso negado'],
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

  describe('QueryFailedError (MySQL / TypeORM)', () => {
    it.each([
      ['ER_DUP_ENTRY', 1062, 409, 'Registro duplicado: já existe um registro com os dados informados.'],
      ['ER_NO_REFERENCED_ROW_2', 1452, 400, 'Referência inválida: o registro relacionado não existe.'],
      ['ER_NO_REFERENCED_ROW', 1216, 400, 'Referência inválida: o registro relacionado não existe.'],
      [
        'ER_ROW_IS_REFERENCED_2',
        1451,
        409,
        'Não é possível concluir a operação pois este registro está vinculado a outros dados.',
      ],
      [
        'ER_ROW_IS_REFERENCED',
        1217,
        409,
        'Não é possível concluir a operação pois este registro está vinculado a outros dados.',
      ],
      ['ER_DATA_TOO_LONG', 1406, 400, 'Um ou mais campos excedem o tamanho máximo permitido.'],
      ['ER_BAD_NULL_ERROR', 1048, 400, 'Campo obrigatório não informado.'],
      ['ER_TRUNCATED_WRONG_VALUE', 1292, 400, 'Valor inválido para um ou mais campos informados.'],
      [
        'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD',
        1366,
        400,
        'Valor inválido para um ou mais campos informados.',
      ],
      ['WARN_DATA_TRUNCATED', 1265, 400, 'Valor inválido para um ou mais campos informados.'],
      ['ER_WARN_DATA_OUT_OF_RANGE', 1264, 400, 'Valor inválido para um ou mais campos informados.'],
    ])('deve mapear %s (errno %i) para status %i sem vazar SQL', (code, errno, statusEsperado, mensagemEsperada) => {
      const driverError = Object.assign(new Error('SQL interno detalhado'), {
        code,
        errno,
        sqlMessage: 'SQL interno detalhado',
      });
      const erro = new QueryFailedError(
        'INSERT INTO professor (email) VALUES (?)',
        ['secreto@teste.com'],
        driverError
      );

      manipuladorDeErros(erro, req, res, next);

      expect(res.status).toHaveBeenCalledWith(statusEsperado);
      expect(res.json).toHaveBeenCalledWith({
        status: 'erro',
        mensagem: mensagemEsperada,
      });
      expect(JSON.stringify((res.json as jest.Mock).mock.calls[0][0])).not.toContain('INSERT INTO');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('deve tratar QueryFailedError não mapeado como 500 e logar no console', () => {
      const driverError = Object.assign(new Error('Table does not exist'), {
        code: 'ER_NO_SUCH_TABLE',
        errno: 1146,
      });
      const erro = new QueryFailedError('SELECT * FROM tabela_inexistente', [], driverError);

      manipuladorDeErros(erro, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'erro',
        mensagem: 'Erro interno do servidor',
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(erro);
    });
  });

  describe('MulterError (upload de arquivos)', () => {
    it('deve retornar 413 para LIMIT_FILE_SIZE', () => {
      const erro = criarMulterError('LIMIT_FILE_SIZE', 'File too large', 'arquivo');

      manipuladorDeErros(erro, req, res, next);

      expect(res.status).toHaveBeenCalledWith(413);
      expect(res.json).toHaveBeenCalledWith({
        status: 'erro',
        mensagem: 'O arquivo enviado excede o tamanho máximo permitido.',
      });
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it.each([
      ['LIMIT_FILE_COUNT', 'A quantidade de arquivos enviados excede o limite permitido.'],
      ['LIMIT_UNEXPECTED_FILE', 'Campo de upload de arquivo não esperado.'],
      ['LIMIT_PART_COUNT', 'A quantidade de partes do formulário excede o limite permitido.'],
      ['LIMIT_FIELD_KEY', 'O nome de um campo do formulário excede o tamanho máximo permitido.'],
      ['LIMIT_FIELD_VALUE', 'O valor de um campo do formulário excede o tamanho máximo permitido.'],
      ['LIMIT_FIELD_COUNT', 'A quantidade de campos do formulário excede o limite permitido.'],
      ['MISSING_FIELD_NAME', 'Nome do campo de upload não informado.'],
      ['CODIGO_DESCONHECIDO', 'Erro no upload do arquivo.'],
    ])('deve retornar 400 para MulterError com código %s', (code, mensagemEsperada) => {
      const erro = criarMulterError(code);

      manipuladorDeErros(erro, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'erro',
        mensagem: mensagemEsperada,
      });
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('payload maior que o limite JSON (413)', () => {
    it('deve responder 413 quando err.status === 413', () => {
      const erro = Object.assign(new Error('request entity too large'), { status: 413 });

      manipuladorDeErros(erro, req, res, next);

      expect(res.status).toHaveBeenCalledWith(413);
      expect(res.json).toHaveBeenCalledWith({
        status: 'erro',
        mensagem: 'O corpo da requisição excede o limite permitido',
      });
      expect(consoleErrorSpy).not.toHaveBeenCalled();
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
