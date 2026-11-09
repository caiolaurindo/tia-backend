import { Router } from 'express';
import { AppDataSource } from '../data/data-source';
import { Aula } from '../models/aula.entity';
import { Turma } from '../models/turma.entity';
import { AulaService } from '../services/aula.service';
import { AulaController } from '../controllers/aula.controller';
import { autenticar } from '../middlewares/auth.middleware';
import { validarRequisicao } from '../middlewares/validation.middleware';
import { criarAulaSchema, atualizarAulaSchema } from '../models/aula.schema';
import { catchAsync } from '../utils/catch-async';

const aulaRouter = Router();

const aulaRepositorio = AppDataSource.getRepository(Aula);
const turmaRepositorio = AppDataSource.getRepository(Turma);
const aulaService = new AulaService(aulaRepositorio, turmaRepositorio);
const aulaController = new AulaController(aulaService);

aulaRouter.use(autenticar);

aulaRouter.get('/', catchAsync(aulaController.listar));
aulaRouter.get('/:id', catchAsync(aulaController.buscarPorId));
aulaRouter.post('/', validarRequisicao(criarAulaSchema), catchAsync(aulaController.criar));
aulaRouter.put('/:id', validarRequisicao(atualizarAulaSchema), catchAsync(aulaController.atualizar));
aulaRouter.delete('/:id', catchAsync(aulaController.remover));

export { aulaRouter };
