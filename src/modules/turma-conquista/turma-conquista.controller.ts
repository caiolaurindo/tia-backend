import { Router, Request, Response } from 'express';
import { AppDataSource } from '../../data/data-source';
import { TurmaConquista } from './turma-conquista.entity';
import { Turma } from '../turma/turma.entity';
import { Conquista } from '../conquista/conquista.entity';
import { TurmaConquistaService } from './turma-conquista.service';
import { autenticar } from '../../common/middlewares/auth.middleware';
import { validarRequisicao } from '../../common/middlewares/validation.middleware';
import { vincularConquistaSchema } from './turma-conquista.schema';
import { catchAsync } from '../../common/utils/catch-async';

const turmaConquistaRouter = Router({ mergeParams: true });

const turmaConquistaService = new TurmaConquistaService(
  AppDataSource.getRepository(TurmaConquista),
  AppDataSource.getRepository(Turma),
  AppDataSource.getRepository(Conquista),
);

turmaConquistaRouter.use(autenticar);

turmaConquistaRouter.get('/', catchAsync(async (req: Request, res: Response) => {
  const turmaId = Number(req.params.turmaId);
  const professorId = req.usuario.id;
  res.json(await turmaConquistaService.listarConquistasDaTurma(turmaId, professorId));
}));

turmaConquistaRouter.post('/', validarRequisicao(vincularConquistaSchema), catchAsync(async (req: Request, res: Response) => {
  const turmaId = Number(req.params.turmaId);
  const { conquistaId } = req.body;
  const professorId = req.usuario.id;
  res.status(201).json(await turmaConquistaService.vincularConquista(turmaId, conquistaId, professorId));
}));

turmaConquistaRouter.delete('/:conquistaId', catchAsync(async (req: Request, res: Response) => {
  const turmaId = Number(req.params.turmaId);
  const conquistaId = Number(req.params.conquistaId);
  const professorId = req.usuario.id;
  await turmaConquistaService.desvincularConquista(turmaId, conquistaId, professorId);
  res.status(204).send();
}));

export { turmaConquistaRouter };