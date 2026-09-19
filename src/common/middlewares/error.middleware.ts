/**
 * @description Middleware global de tratamento de erros do Express.
 * Captura todos os erros lançados na aplicação e formata a resposta JSON para o cliente não receber páginas HTML de erro.
 * 
 * @usage Deve ser o ÚLTIMO middleware registrado no `src/server.ts`, logo antes do `app.listen()`.
 * Exemplo: `app.use(manipuladorDeErros);`
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';

/**
 * @author moisesaraujo
 */

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

  console.error(err);
  return res.status(500).json({
    status: 'erro',
    mensagem: 'Erro interno do servidor',
  });
}