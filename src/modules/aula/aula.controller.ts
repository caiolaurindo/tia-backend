import { Router, Request, Response } from 'express';
import { AppDataSource } from '../../data/data-source';
import { Aula } from './aula.entity';
import { Turma } from '../turma/turma.entity';
import { AulaService } from './aula.service';
import { autenticar } from '../../common/middlewares/auth.middleware';
import { validarRequisicao } from '../../common/middlewares/validation.middleware';
import { criarAulaSchema, atualizarAulaSchema } from './aula.schema';
import { catchAsync } from '../../common/utils/catch-async';

/**
 * Controller responsável pelas rotas e controle de requisições de Aulas.
 * 
 * @author caiolaurindo
 */
const aulaRouter = Router();

const aulaRepositorio = AppDataSource.getRepository(Aula);
const turmaRepositorio = AppDataSource.getRepository(Turma);
const aulaService = new AulaService(aulaRepositorio, turmaRepositorio);

aulaRouter.use(autenticar);

aulaRouter.get(
  '/',
  catchAsync(async (req: Request, res: Response) => {
    const professorId = req.usuario!.sub;
    const turmaId = req.query.turmaId ? Number(req.query.turmaId) : undefined;

    if (turmaId) {
      const aulas = await aulaService.listarPorTurmaEProfessor(turmaId, professorId);
      return res.json(aulas);
    }

    const aulas = await aulaService.listarPorProfessor(professorId);
    return res.json(aulas);
  })
);

aulaRouter.get(
  '/:id',
  catchAsync(async (req: Request, res: Response) => {
    const aula = await aulaService.buscarPorIdEProfessor(Number(req.params.id), req.usuario!.sub);
    res.json(aula);
  })
);

aulaRouter.post(
  '/',
  validarRequisicao(criarAulaSchema),
  catchAsync(async (req: Request, res: Response) => {
    const aula = await aulaService.criarParaProfessor(req.body, req.usuario!.sub);
    res.status(201).json(aula);
  })
);

aulaRouter.put(
  '/:id',
  validarRequisicao(atualizarAulaSchema),
  catchAsync(async (req: Request, res: Response) => {
    const aula = await aulaService.atualizarParaProfessor(Number(req.params.id), req.body, req.usuario!.sub);
    res.json(aula);
  })
);

aulaRouter.delete(
  '/:id',
  catchAsync(async (req: Request, res: Response) => {
    await aulaService.removerParaProfessor(Number(req.params.id), req.usuario!.sub);
    res.status(204).send();
  })
);

export { aulaRouter };

