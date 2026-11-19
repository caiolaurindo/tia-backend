import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/app-error';

type OrigemValidacao = 'body' | 'query';

export const validarRequisicao = (
  schema: ZodSchema,
  origem: OrigemValidacao = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const dados = origem === 'body' ? req.body : req.query;
      const dadosValidados = schema.parse(dados);

      if (origem === 'body') {
        req.body = dadosValidados;
      } else {
        res.locals.validatedQuery = dadosValidados;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const mensagens = error.issues
          .map(err => `${err.path.join('.')}: ${err.message}`)
          .join('; ');

        return next(new AppError(`Dados inválidos: ${mensagens}`, 400));
      }

      next(error);
    }
  };
};
