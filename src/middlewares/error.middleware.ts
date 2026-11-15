
/**
 * @description Middleware global de tratamento de erros do Express.
 * Captura todos os erros lançados na aplicação e formata a resposta JSON para o cliente não receber páginas HTML de erro.
 *
 * @usage Deve ser o ÚLTIMO middleware registrado no `src/app.ts`.
 * Exemplo: `app.use(manipuladorDeErros);`
 *
 * @author moisesaraujo
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';

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
