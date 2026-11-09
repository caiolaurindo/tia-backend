import { Router } from 'express';
import { AppDataSource } from '../data/data-source';
import { Registro } from '../models/registro.entity';
import { Aluno } from '../models/aluno.entity';
import { Aula } from '../models/aula.entity';
import { RegistroService } from '../services/registro.service';
import { RegistroController } from '../controllers/registro.controller';
import { validarRequisicao } from '../middlewares/validation.middleware';
import { createRegistroSchema, updateRegistroSchema } from '../models/registro.schema';
import { catchAsync } from '../utils/catch-async';
import { autenticar } from '../middlewares/auth.middleware';

const registroRouter = Router();
const repositorio = AppDataSource.getRepository(Registro);
const alunoRepositorio = AppDataSource.getRepository(Aluno);
const aulaRepositorio = AppDataSource.getRepository(Aula);
const registroService = new RegistroService(repositorio, alunoRepositorio, aulaRepositorio);
const registroController = new RegistroController(registroService);

registroRouter.use(autenticar);

registroRouter.post('/', validarRequisicao(createRegistroSchema), catchAsync(registroController.criar));
registroRouter.get('/', catchAsync(registroController.listar));
registroRouter.get('/aluno/:aluno_id', catchAsync(registroController.buscarPorAluno));
registroRouter.get('/aula/:aula_id', catchAsync(registroController.buscarPorAula));
registroRouter.get('/:id', catchAsync(registroController.buscarPorId));
registroRouter.put('/:id', validarRequisicao(updateRegistroSchema), catchAsync(registroController.atualizar));
registroRouter.delete('/:id', catchAsync(registroController.remover));

export { registroRouter };
