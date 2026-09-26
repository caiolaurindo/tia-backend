import { Router, Request, Response } from 'express';
import { AppDataSource } from '../../data/data-source';
import { Conquista } from './conquista.entity';
import { ConquistaService } from './conquista.service';
import { autenticar } from '../../common/middlewares/auth.middleware';
import { validarRequisicao } from '../../common/middlewares/validation.middleware';
import { criarConquistaSchema, atualizarConquistaSchema } from './conquista.schema';
import { catchAsync } from '../../common/utils/catch-async';

const conquistaRouter = Router();
const conquistaService = new ConquistaService(AppDataSource.getRepository(Conquista));

conquistaRouter.use(autenticar);

conquistaRouter.get('/', catchAsync(async (_req: Request, res: Response) => {
  res.json(await conquistaService.listarTodos());
}));

conquistaRouter.get('/:id', catchAsync(async (req: Request, res: Response) => {
  res.json(await conquistaService.buscarPorId(Number(req.params.id)));
}));

conquistaRouter.post('/', validarRequisicao(criarConquistaSchema),
  catchAsync(async (req: Request, res: Response) => {
    res.status(201).json(await conquistaService.criarConquista(req.body));
  })
);

conquistaRouter.put('/:id', validarRequisicao(atualizarConquistaSchema),
  catchAsync(async (req: Request, res: Response) => {
    res.json(await conquistaService.atualizarConquista(Number(req.params.id), req.body));
  })
);

conquistaRouter.delete('/:id', catchAsync(async (req: Request, res: Response) => {
  await conquistaService.remover(Number(req.params.id));
  res.status(204).send();
}));

export { conquistaRouter };