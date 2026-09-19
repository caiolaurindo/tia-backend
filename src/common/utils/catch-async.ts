/**
 * @description Função utilitária (Wrapper) para interceptar exceções em funções assíncronas no Express.
 * Repassa qualquer erro interno para o Middleware Global, eliminando a necessidade de dezenas de try/catch nas rotas.
 * 
 * @usage Envolva as funções (callbacks) das suas rotas com ele.
 * Exemplo: `router.get('/', catchAsync(async (req, res) => { ... }));`
 */

import { Request, Response, NextFunction } from 'express';

/**
 * @author moisesaraujo
 */

export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};