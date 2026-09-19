/**
 * @description Middleware utilitário de validação de esquemas usando Zod.
 * Intercepta o corpo, parâmetros ou querystring da requisição antes do controller.
 * 
 * @usage Adicione como middleware em uma rota.
 * Exemplo: `router.post('/', validarRequisicao(schema), controller);`
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/app-error';

/**
 * @author moisesaraujo
 */

export const validarRequisicao = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const mensagens = error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join('; ');
        return next(new AppError(`Dados inválidos: ${mensagens}`, 400));
      }
      next(error);
    }
  };
};