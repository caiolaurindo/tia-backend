/**
 * @description Middleware global de tratamento de erros do Express.
 * Captura todos os erros lançados na aplicação (AppError, QueryFailedError do TypeORM/MySQL,
 * MulterError de uploads e erros inesperados) e formata a resposta JSON padronizada.
 *
 * @usage Deve ser o ÚLTIMO middleware registrado no `src/app.ts`.
 * Exemplo: `app.use(manipuladorDeErros);`
 *
 * @author moisesaraujo
 * @author caiolaurindo (tratamento de QueryFailedError e MulterError)
 */

import { Request, Response, NextFunction } from 'express';
import { QueryFailedError } from 'typeorm';
import { AppError } from '../utils/app-error';

interface DriverErrorMySQL {
  code?: string;
  errno?: number;
}

interface MulterErrorLike extends Error {
  name: 'MulterError';
  code: string;
  field?: string;
}

interface RespostaErroMapeada {
  statusCode: number;
  mensagem: string;
}

function ehMulterError(err: Error): err is MulterErrorLike {
  return (
    err.name === 'MulterError' &&
    typeof (err as Partial<MulterErrorLike>).code === 'string'
  );
}

function mapearErroMySQL(err: QueryFailedError): RespostaErroMapeada | null {
  const driverError = (err.driverError ?? err) as DriverErrorMySQL;
  const code = driverError.code;
  const errno = driverError.errno;

  if (code === 'ER_DUP_ENTRY' || errno === 1062) {
    return {
      statusCode: 409,
      mensagem: 'Registro duplicado: já existe um registro com os dados informados.',
    };
  }

  if (
    code === 'ER_NO_REFERENCED_ROW_2' ||
    code === 'ER_NO_REFERENCED_ROW' ||
    errno === 1452 ||
    errno === 1216
  ) {
    return {
      statusCode: 400,
      mensagem: 'Referência inválida: o registro relacionado não existe.',
    };
  }

  if (
    code === 'ER_ROW_IS_REFERENCED_2' ||
    code === 'ER_ROW_IS_REFERENCED' ||
    errno === 1451 ||
    errno === 1217
  ) {
    return {
      statusCode: 409,
      mensagem: 'Não é possível concluir a operação pois este registro está vinculado a outros dados.',
    };
  }

  if (code === 'ER_DATA_TOO_LONG' || errno === 1406) {
    return {
      statusCode: 400,
      mensagem: 'Um ou mais campos excedem o tamanho máximo permitido.',
    };
  }

  if (code === 'ER_BAD_NULL_ERROR' || errno === 1048) {
    return {
      statusCode: 400,
      mensagem: 'Campo obrigatório não informado.',
    };
  }

  if (
    code === 'ER_TRUNCATED_WRONG_VALUE' ||
    code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD' ||
    code === 'WARN_DATA_TRUNCATED' ||
    code === 'ER_WARN_DATA_OUT_OF_RANGE' ||
    errno === 1292 ||
    errno === 1366 ||
    errno === 1265 ||
    errno === 1264
  ) {
    return {
      statusCode: 400,
      mensagem: 'Valor inválido para um ou mais campos informados.',
    };
  }

  return null;
}

function mapearErroMulter(err: MulterErrorLike): RespostaErroMapeada {
  switch (err.code) {
    case 'LIMIT_FILE_SIZE':
      return {
        statusCode: 413,
        mensagem: 'O arquivo enviado excede o tamanho máximo permitido.',
      };
    case 'LIMIT_FILE_COUNT':
      return {
        statusCode: 400,
        mensagem: 'A quantidade de arquivos enviados excede o limite permitido.',
      };
    case 'LIMIT_UNEXPECTED_FILE':
      return {
        statusCode: 400,
        mensagem: 'Campo de upload de arquivo não esperado.',
      };
    case 'LIMIT_PART_COUNT':
      return {
        statusCode: 400,
        mensagem: 'A quantidade de partes do formulário excede o limite permitido.',
      };
    case 'LIMIT_FIELD_KEY':
      return {
        statusCode: 400,
        mensagem: 'O nome de um campo do formulário excede o tamanho máximo permitido.',
      };
    case 'LIMIT_FIELD_VALUE':
      return {
        statusCode: 400,
        mensagem: 'O valor de um campo do formulário excede o tamanho máximo permitido.',
      };
    case 'LIMIT_FIELD_COUNT':
      return {
        statusCode: 400,
        mensagem: 'A quantidade de campos do formulário excede o limite permitido.',
      };
    case 'MISSING_FIELD_NAME':
      return {
        statusCode: 400,
        mensagem: 'Nome do campo de upload não informado.',
      };
    default:
      return {
        statusCode: 400,
        mensagem: 'Erro no upload do arquivo.',
      };
  }
}

export function manipuladorDeErros(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'erro',
      mensagem: err.message,
    });
  }

  if (err instanceof QueryFailedError) {
    const erroMapeado = mapearErroMySQL(err);
    if (erroMapeado) {
      return res.status(erroMapeado.statusCode).json({
        status: 'erro',
        mensagem: erroMapeado.mensagem,
      });
    }
  }

  if (ehMulterError(err)) {
    const erroMapeado = mapearErroMulter(err);
    return res.status(erroMapeado.statusCode).json({
      status: 'erro',
      mensagem: erroMapeado.mensagem,
    });
  }

  const erroComStatus = err as Error & {
    status?: number;
    statusCode?: number;
  };

  const statusCode = erroComStatus.statusCode ?? erroComStatus.status;

  if (statusCode === 413) {
    return res.status(413).json({
      status: 'erro',
      mensagem: 'O corpo da requisição excede o limite permitido',
    });
  }

  console.error(err);
  return res.status(500).json({
    status: 'erro',
    mensagem: 'Erro interno do servidor',
  });
}
