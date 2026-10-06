import { Router, Request, Response } from 'express';
import { AppDataSource } from '../../data/data-source';
import { Registro } from './registro.entity';
import { RegistroService } from './registro.service';
import { validarRequisicao } from '../../common/middlewares/validation.middleware';
import { createRegistroSchema, updateRegistroSchema } from './registro.schema';
import { catchAsync } from '../../common/utils/catch-async';
import { autenticar } from '../../common/middlewares/auth.middleware';

const registroRouter = Router();
const repositorio = AppDataSource.getRepository(Registro);
const registroService = new RegistroService(repositorio);

registroRouter.use(autenticar);

registroRouter.post(
  '/',
  validarRequisicao(createRegistroSchema),
  catchAsync(async (req: Request, res: Response) => {
    const registro = await registroService.criar(req.body);
    res.status(201).json(registro);
  })
);

registroRouter.get(
  '/',
  catchAsync(async (req: Request, res: Response) => {
    const registros = await registroService.listarTodos();
    res.json(registros);
  })
);

registroRouter.get(
  '/:id',
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const registro = await registroService.buscarPorId(Number(id));
    res.json(registro);
  })
);

registroRouter.get(
  '/aluno/:aluno_id',
  catchAsync(async (req: Request, res: Response) => {
    const { aluno_id } = req.params;
    const registros = await registroService.buscarPorAluno(Number(aluno_id));
    res.json(registros);
  })
);

registroRouter.get(
  '/aula/:aula_id',
  catchAsync(async (req: Request, res: Response) => {
    const { aula_id } = req.params;
    const registros = await registroService.buscarPorAula(Number(aula_id));
    res.json(registros);
  })
);

registroRouter.put(
  '/:id',
  validarRequisicao(updateRegistroSchema),
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const registro = await registroService.atualizar(Number(id), req.body);
    res.json(registro);
  })
);

registroRouter.delete(
  '/:id',
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await registroService.remover(Number(id));
    res.status(204).send();
  })
);

export { registroRouter };