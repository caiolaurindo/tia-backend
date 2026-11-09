import { Router, Request, Response } from 'express';
import { AppDataSource } from '../../data/data-source';
import { AlunoConquista } from './aluno-conquista.entity';
import { Aluno } from '../aluno/aluno.entity';
import { Turma } from '../turma/turma.entity';
import { TurmaConquista } from '../turma-conquista/turma-conquista.entity';
import { AlunoConquistaService } from './aluno-conquista.service';
import { AlunoService } from '../aluno/aluno.service';
import { TurmaService } from '../turma/turma.service';
import { autenticar } from '../../common/middlewares/auth.middleware';
import { validarRequisicao } from '../../common/middlewares/validation.middleware';
import { atribuirConquistaSchema, atualizarAlunoConquistaSchema } from './aluno-conquista.schema';
import { catchAsync } from '../../common/utils/catch-async';
import { AppError } from '../../common/utils/app-error';

const alunoConquistaRouter = Router();

const turmaService = new TurmaService(AppDataSource.getRepository(Turma));
const alunoService = new AlunoService(AppDataSource.getRepository(Aluno), turmaService);
const alunoConquistaService = new AlunoConquistaService(
  AppDataSource.getRepository(AlunoConquista),
  alunoService,
  AppDataSource.getRepository(TurmaConquista)
);

alunoConquistaRouter.use(autenticar);

alunoConquistaRouter.get(
  '/',
  catchAsync(async (req: Request, res: Response) => {
    const alunoId = Number(req.query.alunoId);
    if (!req.query.alunoId || Number.isNaN(alunoId)) {
      throw new AppError('O parâmetro alunoId é obrigatório e deve ser numérico.', 400);
    }
    res.json(await alunoConquistaService.listarPorAluno(alunoId, req.usuario!.sub));
  })
);

alunoConquistaRouter.post(
  '/',
  validarRequisicao(atribuirConquistaSchema),
  catchAsync(async (req: Request, res: Response) => {
    res.status(201).json(await alunoConquistaService.atribuirParaProfessor(req.body, req.usuario!.sub));
  })
);

alunoConquistaRouter.put(
  '/:id',
  validarRequisicao(atualizarAlunoConquistaSchema),
  catchAsync(async (req: Request, res: Response) => {
    res.json(await alunoConquistaService.atualizarParaProfessor(Number(req.params.id), req.body, req.usuario!.sub));
  })
);

alunoConquistaRouter.delete(
  '/:id',
  catchAsync(async (req: Request, res: Response) => {
    await alunoConquistaService.removerParaProfessor(Number(req.params.id), req.usuario!.sub);
    res.status(204).send();
  })
);

export { alunoConquistaRouter };