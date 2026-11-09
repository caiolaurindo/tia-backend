import { Router, Request, Response } from 'express';
import { AppDataSource } from '../../data/data-source';
import { Aluno } from './aluno.entity';
import { Turma } from '../turma/turma.entity';
import { AlunoService } from './aluno.service';
import { TurmaService } from '../turma/turma.service';
import { autenticar } from '../../common/middlewares/auth.middleware';
import { validarRequisicao } from '../../common/middlewares/validation.middleware';
import { criarAlunoSchema, atualizarAlunoSchema } from './aluno.schema';
import { catchAsync } from '../../common/utils/catch-async';
import { AppError } from '../../common/utils/app-error';

const alunoRouter = Router();
const turmaService = new TurmaService(AppDataSource.getRepository(Turma));
const alunoService = new AlunoService(AppDataSource.getRepository(Aluno), turmaService);

alunoRouter.use(autenticar);

alunoRouter.get(
  '/',
  catchAsync(async (req: Request, res: Response) => {
    const turmaId = req.query.turmaId ? Number(req.query.turmaId) : undefined;
    if (turmaId !== undefined && Number.isNaN(turmaId)) {
      throw new AppError('turmaId inválido.', 400);
    }
    res.json(await alunoService.listarPorProfessor(req.usuario!.sub, turmaId));
  })
);

alunoRouter.get(
  '/:id',
  catchAsync(async (req: Request, res: Response) => {
    res.json(await alunoService.buscarPorIdEProfessor(Number(req.params.id), req.usuario!.sub));
  })
);

alunoRouter.post(
  '/',
  validarRequisicao(criarAlunoSchema),
  catchAsync(async (req: Request, res: Response) => {
    res.status(201).json(await alunoService.criarParaProfessor(req.body, req.usuario!.sub));
  })
);

alunoRouter.put(
  '/:id',
  validarRequisicao(atualizarAlunoSchema),
  catchAsync(async (req: Request, res: Response) => {
    res.json(await alunoService.atualizarParaProfessor(Number(req.params.id), req.body, req.usuario!.sub));
  })
);

alunoRouter.delete(
  '/:id',
  catchAsync(async (req: Request, res: Response) => {
    await alunoService.removerParaProfessor(Number(req.params.id), req.usuario!.sub);
    res.status(204).send();
  })
);

export { alunoRouter };