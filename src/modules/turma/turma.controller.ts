import { Router, Request, Response } from 'express';
import { AppDataSource } from '../../data/data-source';
import { Turma } from './turma.entity';
import { TurmaService } from './turma.service';
import { autenticar } from '../../common/middlewares/auth.middleware';
import { validarRequisicao } from '../../common/middlewares/validation.middleware';
import { criarTurmaSchema, atualizarTurmaSchema } from './turma.schema';
import { catchAsync } from '../../common/utils/catch-async';

const turmaRouter = Router();
const repositorio = AppDataSource.getRepository(Turma);
const turmaService = new TurmaService(repositorio);

turmaRouter.use(autenticar);

turmaRouter.get(
  '/',
  catchAsync(async (req: Request, res: Response) => {
    const turmas = await turmaService.listarPorProfessor(req.usuario!.sub);
    res.json(turmas);
  })
);

turmaRouter.get(
  '/:id',
  catchAsync(async (req: Request, res: Response) => {
    const turma = await turmaService.buscarPorIdEProfessor(Number(req.params.id), req.usuario!.sub);
    res.json(turma);
  })
);

turmaRouter.post(
  '/',
  validarRequisicao(criarTurmaSchema),
  catchAsync(async (req: Request, res: Response) => {
    const turma = await turmaService.criarParaProfessor(req.body, req.usuario!.sub);
    res.status(201).json(turma);
  })
);

turmaRouter.put(
  '/:id',
  validarRequisicao(atualizarTurmaSchema),
  catchAsync(async (req: Request, res: Response) => {
    const turma = await turmaService.atualizarParaProfessor(Number(req.params.id), req.body, req.usuario!.sub);
    res.json(turma);
  })
);

turmaRouter.delete(
  '/:id',
  catchAsync(async (req: Request, res: Response) => {
    await turmaService.removerParaProfessor(Number(req.params.id), req.usuario!.sub);
    res.status(204).send();
  })
);

export { turmaRouter };