/**
 * @description Função geradora (Factory) que cria um Router do Express com as 5 rotas de CRUD configuradas.
 * Ideal para módulos de cadastro simples (ex: Conquista) que não possuem regras de negócio complexas.
 * 
 * @usage Importe e passe a instância do seu Service genérico como parâmetro.
 * Exemplo: `export const conquistaRouter = criarRouterGenerico(conquistaService);`
 */

import { Router, Request, Response } from 'express';
import { ServiceGenerico } from './base.service';
import { catchAsync } from '../utils/catch-async';

/**
 * @author moisesaraujo
 */

export function criarRouterGenerico<T extends { id: number }>(
  servico: ServiceGenerico<T>
): Router {
  const router = Router();

  router.get('/', catchAsync(async (req: Request, res: Response) => {
    const registros = await servico.listarTodos();
    res.json(registros);
  }));

  router.get('/:id', catchAsync(async (req: Request, res: Response) => {
    const registro = await servico.buscarPorId(Number(req.params.id));
    res.json(registro);
  }));

  router.post('/', catchAsync(async (req: Request, res: Response) => {
    const novoRegistro = await servico.criar(req.body);
    res.status(201).json(novoRegistro);
  }));

  router.put('/:id', catchAsync(async (req: Request, res: Response) => {
    const registroAtualizado = await servico.atualizar(Number(req.params.id), req.body);
    res.json(registroAtualizado);
  }));

  router.delete('/:id', catchAsync(async (req: Request, res: Response) => {
    await servico.remover(Number(req.params.id));
    res.status(204).send(); // 204 = No Content (sucesso sem corpo na resposta)
  }));

  return router;
}