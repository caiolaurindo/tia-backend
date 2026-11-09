import { Router } from 'express';
import { AppDataSource } from '../data/data-source';
import { Professor } from '../models/professor.entity';
import { ProfessorService } from '../services/professor.service';
import { ProfessorController } from '../controllers/professor.controller';
import { validarRequisicao } from '../middlewares/validation.middleware';
import { criarProfessorSchema, loginProfessorSchema } from '../models/professor.schema';
import { catchAsync } from '../utils/catch-async';
import { autenticar } from '../middlewares/auth.middleware';

const professorRouter = Router();
const repositorio = AppDataSource.getRepository(Professor);
const professorService = new ProfessorService(repositorio);
const professorController = new ProfessorController(professorService);

professorRouter.post(
  '/cadastro',
  validarRequisicao(criarProfessorSchema),
  catchAsync(professorController.cadastrar)
);

professorRouter.post(
  '/login',
  validarRequisicao(loginProfessorSchema),
  catchAsync(professorController.login)
);

professorRouter.get(
  '/me',
  autenticar,
  catchAsync(professorController.me)
);

export { professorRouter };
