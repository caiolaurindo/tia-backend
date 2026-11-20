/**
 * @description Middleware utilitário de validação de esquemas usando Zod.
 * Valida `params`, `query` e `body` (sempre em modo `strict()` para evitar campos extras / mass assignment).
 *
 * @usage
 * - Formato por origem única (compatível com chamadas existentes):
 *   `router.post('/', validarRequisicao(criarSchema), controller);`
 *   `router.get('/', validarRequisicao(querySchema, 'query'), controller);`
 *   `router.get('/:id', validarRequisicao(idParamSchema, 'params'), controller);`
 * - Formato combinado (múltiplas origens em um único middleware):
 *   `router.put('/:id', validarRequisicao({ params: idParamSchema, body: atualizarSchema }), controller);`
 *
 * @author moisesaraujo
 * @author caiolaurindo (expansão para params, query e body.strict())
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { z, ZodError, ZodType } from 'zod';
import { AppError } from '../utils/app-error';

export type OrigemValidacao = 'body' | 'query' | 'params';

export interface EsquemasValidacao {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

function ehSchemaZod(valor: ZodType | EsquemasValidacao): valor is ZodType {
  return typeof (valor as ZodType)?.parse === 'function';
}

function aplicarStrictNoBody(schema: ZodType): ZodType {
  if (schema instanceof z.ZodObject) {
    return schema.strict();
  }
  return schema;
}

function formatarErroZod(err: ZodError['issues'][number]): string {
  const caminho = err.path.length > 0 ? `${err.path.join('.')}: ` : '';

  if (err.code === 'unrecognized_keys' && 'keys' in err && Array.isArray(err.keys)) {
    return `${caminho}Campo(s) não permitido(s): ${err.keys.join(', ')}`;
  }

  return `${caminho}${err.message}`;
}

export function validarRequisicao(esquemas: EsquemasValidacao): RequestHandler;
export function validarRequisicao(
  schema: ZodType,
  origem?: OrigemValidacao
): RequestHandler;
export function validarRequisicao(
  schemaOuEsquemas: ZodType | EsquemasValidacao,
  origem: OrigemValidacao = 'body'
): RequestHandler {
  const esquemas: EsquemasValidacao = ehSchemaZod(schemaOuEsquemas)
    ? { [origem]: schemaOuEsquemas }
    : schemaOuEsquemas;

  const bodySchema = esquemas.body ? aplicarStrictNoBody(esquemas.body) : undefined;

  return (req: Request, res: Response, next: NextFunction) => {
    const erros: ZodError['issues'] = [];

    const executarParse = (schema: ZodType, dados: unknown) => {
      try {
        return schema.parse(dados);
      } catch (error) {
        if (error instanceof ZodError) {
          erros.push(...error.issues);
          return undefined;
        }
        throw error;
      }
    };

    try {
      const paramsValidados = esquemas.params
        ? executarParse(esquemas.params, req.params)
        : undefined;
      const queryValidada = esquemas.query
        ? executarParse(esquemas.query, req.query)
        : undefined;
      const bodyValidado = bodySchema
        ? executarParse(bodySchema, req.body)
        : undefined;

      if (erros.length > 0) {
        const mensagens = erros.map(formatarErroZod).join('; ');
        return next(new AppError(`Dados inválidos: ${mensagens}`, 400));
      }

      if (esquemas.params) {
        req.params = paramsValidados as Request['params'];
        res.locals = res.locals ?? {};
        res.locals.validatedParams = paramsValidados;
      }

      if (esquemas.query) {
        res.locals = res.locals ?? {};
        res.locals.validatedQuery = queryValidada;
      }

      if (bodySchema) {
        req.body = bodyValidado;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
