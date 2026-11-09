import { Router } from 'express';
import { AppDataSource } from '../data/data-source';
import { Aluno } from '../models/aluno.entity';
import { Turma } from '../models/turma.entity';
import { AlunoService } from '../services/aluno.service';
import { TurmaService } from '../services/turma.service';
import { AlunoController } from '../controllers/aluno.controller';
import { autenticar } from '../middlewares/auth.middleware';
import { validarRequisicao } from '../middlewares/validation.middleware';
import { criarAlunoSchema, atualizarAlunoSchema } from '../models/aluno.schema';
import { catchAsync } from '../utils/catch-async';

const alunoRouter = Router();
const turmaService = new TurmaService(AppDataSource.getRepository(Turma));
const alunoService = new AlunoService(AppDataSource.getRepository(Aluno), turmaService);
const alunoController = new AlunoController(alunoService);

alunoRouter.use(autenticar);

alunoRouter.get('/', catchAsync(alunoController.listar));
alunoRouter.get('/:id', catchAsync(alunoController.buscarPorId));
alunoRouter.post('/', validarRequisicao(criarAlunoSchema), catchAsync(alunoController.criar));
alunoRouter.put('/:id', validarRequisicao(atualizarAlunoSchema), catchAsync(alunoController.atualizar));
alunoRouter.delete('/:id', catchAsync(alunoController.remover));

export { alunoRouter };
