import { Router } from 'express';
import { AppDataSource } from '../data/data-source';
import { Turma } from '../models/turma.entity';
import { TurmaService } from '../services/turma.service';
import { TurmaController } from '../controllers/turma.controller';
import { autenticar } from '../middlewares/auth.middleware';
import { validarRequisicao } from '../middlewares/validation.middleware';
import { criarTurmaSchema, atualizarTurmaSchema } from '../models/turma.schema';
import { catchAsync } from '../utils/catch-async';
import { listarTurmaQuerySchema } from '../models/turma-listagem.schema';
import { idParamSchema } from '../models/common.schema';

const turmaRouter = Router();
const repositorio = AppDataSource.getRepository(Turma);
const turmaService = new TurmaService(repositorio);
const turmaController = new TurmaController(turmaService);

turmaRouter.use(autenticar);

turmaRouter.get(
  '/',
  validarRequisicao(listarTurmaQuerySchema, 'query'),
  catchAsync(turmaController.listar)
);
turmaRouter.get('/:id', validarRequisicao({ params: idParamSchema }), catchAsync(turmaController.buscarPorId));
turmaRouter.post('/', validarRequisicao(criarTurmaSchema), catchAsync(turmaController.criar));
turmaRouter.put('/:id', validarRequisicao({ params: idParamSchema, body: atualizarTurmaSchema }), catchAsync(turmaController.atualizar));
turmaRouter.delete('/:id', validarRequisicao({ params: idParamSchema }), catchAsync(turmaController.remover));

export { turmaRouter };
