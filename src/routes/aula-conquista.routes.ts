import { Router } from 'express';
import { AppDataSource } from '../data/data-source';
import { AulaConquista } from '../models/aula-conquista.entity';
import { Aula } from '../models/aula.entity';
import { Conquista } from '../models/conquista.entity';
import { AulaConquistaService } from '../services/aula-conquista.service';
import { AulaConquistaController } from '../controllers/aula-conquista.controller';
import { autenticar } from '../middlewares/auth.middleware';
import { validarRequisicao } from '../middlewares/validation.middleware';
import {
  criarAulaConquistaSchema,
  atualizarAulaConquistaSchema,
} from '../models/aula-conquista.schema';
import { catchAsync } from '../utils/catch-async';

const aulaConquistaRouter = Router();

const aulaConquistaRepositorio = AppDataSource.getRepository(AulaConquista);
const aulaRepositorio = AppDataSource.getRepository(Aula);
const conquistaRepositorio = AppDataSource.getRepository(Conquista);

const aulaConquistaService = new AulaConquistaService(
  aulaConquistaRepositorio,
  aulaRepositorio,
  conquistaRepositorio
);
const aulaConquistaController = new AulaConquistaController(aulaConquistaService);

aulaConquistaRouter.use(autenticar);

aulaConquistaRouter.get('/', catchAsync(aulaConquistaController.listar));
aulaConquistaRouter.get('/:id', catchAsync(aulaConquistaController.buscarPorId));
aulaConquistaRouter.post('/', validarRequisicao(criarAulaConquistaSchema), catchAsync(aulaConquistaController.vincular));
aulaConquistaRouter.put('/:id', validarRequisicao(atualizarAulaConquistaSchema), catchAsync(aulaConquistaController.atualizar));
aulaConquistaRouter.delete('/:id', catchAsync(aulaConquistaController.remover));

export { aulaConquistaRouter };
