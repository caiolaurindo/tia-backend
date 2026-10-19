import { Router, Request, Response } from 'express';
import { AppDataSource } from '../../data/data-source';
import { Aluno } from './aluno.entity';
import { Turma } from '../turma/turma.entity';
import { AlunoService } from './aluno.service';
import { autenticar } from '../../common/middlewares/auth.middleware';
import { validarRequisicao } from '../../common/middlewares/validation.middleware';
import { criarAlunoSchema, atualizarAlunoSchema } from './aluno.schema';
import { catchAsync } from '../../common/utils/catch-async';

/**
 * @author moisesaraujo
 */

const alunoRouter = Router();
const alunoRepositorio = AppDataSource.getRepository(Aluno);
const turmaRepositorio = AppDataSource.getRepository(Turma);
const alunoService = new AlunoService(alunoRepositorio, turmaRepositorio);

alunoRouter.use(autenticar);

alunoRouter.get(
  '/',
  catchAsync(async (req: Request, res: Response) => {
    const professorId = req.usuario!.sub;
    const { turmaId } = req.query;

    if (turmaId !== undefined) {
      const alunos = await alunoService.listarPorTurma(Number(turmaId), professorId);
      res.json(alunos);
      return;
    }

    const alunos = await alunoService.listarPorProfessor(professorId);
    res.json(alunos);
  })
);

alunoRouter.get(
  '/turma/:turmaId',
  catchAsync(async (req: Request, res: Response) => {
    const alunos = await alunoService.listarPorTurma(
      Number(req.params.turmaId),
      req.usuario!.sub
    );
    res.json(alunos);
  })
);

alunoRouter.get(
  '/:id',
  catchAsync(async (req: Request, res: Response) => {
    const aluno = await alunoService.buscarPorIdEProfessor(
      Number(req.params.id),
      req.usuario!.sub
    );
    res.json(aluno);
  })
);

alunoRouter.post(
  '/',
  validarRequisicao(criarAlunoSchema),
  catchAsync(async (req: Request, res: Response) => {
    const aluno = await alunoService.criarParaProfessor(req.body, req.usuario!.sub);
    res.status(201).json(aluno);
  })
);

alunoRouter.put(
  '/:id',
  validarRequisicao(atualizarAlunoSchema),
  catchAsync(async (req: Request, res: Response) => {
    const aluno = await alunoService.atualizarParaProfessor(
      Number(req.params.id),
      req.body,
      req.usuario!.sub
    );
    res.json(aluno);
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
