import { Router } from 'express';
import { AppDataSource } from '../data/data-source';
import { AlunoConquista } from '../models/aluno-conquista.entity';
import { Aluno } from '../models/aluno.entity';
import { Turma } from '../models/turma.entity';
import { TurmaConquista } from '../models/turma-conquista.entity';
import { AlunoConquistaService } from '../services/aluno-conquista.service';
import { AlunoService } from '../services/aluno.service';
import { TurmaService } from '../services/turma.service';
import { AlunoConquistaController } from '../controllers/aluno-conquista.controller';
import { autenticar } from '../middlewares/auth.middleware';
import { validarRequisicao } from '../middlewares/validation.middleware';
import { atribuirConquistaSchema, atualizarAlunoConquistaSchema } from '../models/aluno-conquista.schema';
import { catchAsync } from '../utils/catch-async';

const alunoConquistaRouter = Router();

const turmaService = new TurmaService(AppDataSource.getRepository(Turma));
const alunoService = new AlunoService(AppDataSource.getRepository(Aluno), turmaService);
const alunoConquistaService = new AlunoConquistaService(
  AppDataSource.getRepository(AlunoConquista),
  alunoService,
  AppDataSource.getRepository(TurmaConquista)
);
const alunoConquistaController = new AlunoConquistaController(alunoConquistaService);

alunoConquistaRouter.use(autenticar);

alunoConquistaRouter.get('/', catchAsync(alunoConquistaController.listar));
alunoConquistaRouter.post('/', validarRequisicao(atribuirConquistaSchema), catchAsync(alunoConquistaController.atribuir));
alunoConquistaRouter.put('/:id', validarRequisicao(atualizarAlunoConquistaSchema), catchAsync(alunoConquistaController.atualizar));
alunoConquistaRouter.delete('/:id', catchAsync(alunoConquistaController.remover));

export { alunoConquistaRouter };
