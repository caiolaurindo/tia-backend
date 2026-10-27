import { Router, Request, Response } from 'express';
import { AppDataSource } from '../../data/data-source';
import { AulaConquista } from './aula-conquista.entity';
import { Aula } from '../aula/aula.entity';
import { Conquista } from '../conquista/conquista.entity';
import { AulaConquistaService } from './aula-conquista.service';
import { autenticar } from '../../common/middlewares/auth.middleware';
import { validarRequisicao } from '../../common/middlewares/validation.middleware';
import {
  criarAulaConquistaSchema,
  atualizarAulaConquistaSchema,
} from './aula-conquista.schema';
import { catchAsync } from '../../common/utils/catch-async';
import { AppError } from '../../common/utils/app-error';

/**
 * Controller responsável pelas rotas de definição e gestão de conquistas por aula.
 * 
 * @author caiolaurindo
 */
const aulaConquistaRouter = Router();

const aulaConquistaRepositorio = AppDataSource.getRepository(AulaConquista);
const aulaRepositorio = AppDataSource.getRepository(Aula);
const conquistaRepositorio = AppDataSource.getRepository(Conquista);

const aulaConquistaService = new AulaConquistaService(
  aulaConquistaRepositorio,
  aulaRepositorio,
  conquistaRepositorio
);

aulaConquistaRouter.use(autenticar);

aulaConquistaRouter.get(
  '/',
  catchAsync(async (req: Request, res: Response) => {
    const professorId = req.usuario!.sub;
    const aulaId = req.query.aulaId ? Number(req.query.aulaId) : undefined;

    if (!aulaId || isNaN(aulaId)) {
      throw new AppError('O parâmetro de consulta aulaId é obrigatório e deve ser um número válido.', 400);
    }

    const conquistas = await aulaConquistaService.listarPorAula(aulaId, professorId);
    res.json(conquistas);
  })
);

aulaConquistaRouter.get(
  '/:id',
  catchAsync(async (req: Request, res: Response) => {
    const conquistaAula = await aulaConquistaService.buscarPorIdEProfessor(
      Number(req.params.id),
      req.usuario!.sub
    );
    res.json(conquistaAula);
  })
);

aulaConquistaRouter.post(
  '/',
  validarRequisicao(criarAulaConquistaSchema),
  catchAsync(async (req: Request, res: Response) => {
    const novaAulaConquista = await aulaConquistaService.vincularConquistaAAula(
      req.body,
      req.usuario!.sub
    );
    res.status(201).json(novaAulaConquista);
  })
);

aulaConquistaRouter.put(
  '/:id',
  validarRequisicao(atualizarAulaConquistaSchema),
  catchAsync(async (req: Request, res: Response) => {
    const aulaConquistaAtualizada = await aulaConquistaService.atualizarMeta(
      Number(req.params.id),
      req.body,
      req.usuario!.sub
    );
    res.json(aulaConquistaAtualizada);
  })
);

aulaConquistaRouter.delete(
  '/:id',
  catchAsync(async (req: Request, res: Response) => {
    await aulaConquistaService.removerDaAula(Number(req.params.id), req.usuario!.sub);
    res.status(204).send();
  })
);

export { aulaConquistaRouter };

