import { Router, Request, Response } from 'express';
import { AppDataSource } from '../../data/data-source';
import { Registro } from './registro.entity';
import { Aluno } from '../aluno/aluno.entity';
import { Aula } from '../aula/aula.entity';
import { RegistroService } from './registro.service';
import { validarRequisicao } from '../../common/middlewares/validation.middleware';
import { createRegistroSchema, updateRegistroSchema } from './registro.schema';
import { catchAsync } from '../../common/utils/catch-async';
import { autenticar } from '../../common/middlewares/auth.middleware';

const registroRouter = Router();
const repositorio = AppDataSource.getRepository(Registro);
const alunoRepositorio = AppDataSource.getRepository(Aluno);
const aulaRepositorio = AppDataSource.getRepository(Aula);
const registroService = new RegistroService(repositorio, alunoRepositorio, aulaRepositorio);

registroRouter.use(autenticar);

registroRouter.post(
  '/',
  validarRequisicao(createRegistroSchema),
  catchAsync(async (req: Request, res: Response) => {
    const registro = await registroService.criar(req.body, req.usuario!.sub);
    res.status(201).json(registro);
  })
);

registroRouter.get(
  '/',
  catchAsync(async (req: Request, res: Response) => {
    const registros = await registroService.listarTodos(req.usuario!.sub);
    res.json(registros);
  })
);

registroRouter.get(
  '/aluno/:aluno_id',
  catchAsync(async (req: Request, res: Response) => {
    const { aluno_id } = req.params;
    const registros = await registroService.buscarPorAluno(Number(aluno_id), req.usuario!.sub);
    res.json(registros);
  })
);

registroRouter.get(
  '/aula/:aula_id',
  catchAsync(async (req: Request, res: Response) => {
    const { aula_id } = req.params;
    const registros = await registroService.buscarPorAula(Number(aula_id), req.usuario!.sub);
    res.json(registros);
  })
);

registroRouter.get(
  '/:id',
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const registro = await registroService.buscarPorId(Number(id), req.usuario!.sub);
    res.json(registro);
  })
);

registroRouter.put(
  '/:id',
  validarRequisicao(updateRegistroSchema),
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const registro = await registroService.atualizar(Number(id), req.body, req.usuario!.sub);
    res.json(registro);
  })
);

registroRouter.delete(
  '/:id',
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await registroService.remover(Number(id), req.usuario!.sub);
    res.status(204).send();
  })
);

export { registroRouter };