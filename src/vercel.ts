import 'reflect-metadata';
import express, { NextFunction, Request, Response } from 'express';
import app from './app';
import { conectarBanco } from './data/conexao';
import { corsMiddleware } from './middlewares/cors.middleware';
import { manipuladorDeErros } from './middlewares/error.middleware';
import { AppError } from './utils/app-error';

/**
 * @description Ponto de entrada serverless para a Vercel (carregado por `api/index.js`).
 * Na Vercel não existe `app.listen`: cada requisição chega a esta função. A conexão com o
 * banco é aberta na primeira requisição e reaproveitada nas seguintes da mesma instância.
 *
 * O CORS e o tratador de erros também ficam aqui fora para que uma falha de conexão
 * devolva o JSON padrão (503) com os cabeçalhos de CORS, em vez de um erro opaco no navegador.
 */

const servidor = express();
servidor.disable('x-powered-by');

servidor.use(corsMiddleware);

servidor.use(async (_req: Request, _res: Response, next: NextFunction) => {
  try {
    await conectarBanco();
    next();
  } catch (erro) {
    console.error('Falha ao conectar ao banco de dados:', erro);
    next(new AppError('Serviço temporariamente indisponível. Tente novamente em instantes.', 503));
  }
});

servidor.use(app);
servidor.use(manipuladorDeErros);

export default servidor;
