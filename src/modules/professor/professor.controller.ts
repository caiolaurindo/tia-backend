import { Router, Request, Response } from 'express';
import { AppDataSource } from '../../data/data-source';
import { Professor } from './professor.entity';
import { ProfessorService } from './professor.service';
import { validarRequisicao } from '../../common/middlewares/validation.middleware';
import { criarProfessorSchema, loginProfessorSchema } from './professor.schema';
import { catchAsync } from '../../common/utils/catch-async';
import { autenticar } from '../../common/middlewares/auth.middleware';
import { autorizar } from '../../common/middlewares/rbac.middleware';
import { Role } from '../../common/enums/role.enum';

const professorRouter = Router();
const repositorio = AppDataSource.getRepository(Professor);
const professorService = new ProfessorService(repositorio);

professorRouter.post(
  '/cadastro',
  validarRequisicao(criarProfessorSchema),
  catchAsync(async (req: Request, res: Response) => {
    const resultado = await professorService.cadastrar(req.body);
    res.status(201).json(resultado);
  })
);

professorRouter.post(
  '/login',
  validarRequisicao(loginProfessorSchema),
  catchAsync(async (req: Request, res: Response) => {
    const resultado = await professorService.login(req.body);
    res.json(resultado);
  })
);

professorRouter.get(
 '/gerenciamento/painel',
  autenticar,
  autorizar([Role.COORDENADOR, Role.ADMIN]),
  catchAsync(async (req: Request, res: Response) => {
    res.json({ message: 'Bem-vindo ao painel de gestão!' });
  })
);

export { professorRouter };