import { Router } from 'express';
import { AppDataSource } from '../data/data-source';
import { Conquista } from '../models/conquista.entity';
import { ConquistaService } from '../services/conquista.service';
import { ConquistaController } from '../controllers/conquista.controller';
import { autenticar } from '../middlewares/auth.middleware';
import { validarRequisicao } from '../middlewares/validation.middleware';
import { criarConquistaSchema, atualizarConquistaSchema } from '../models/conquista.schema';
import { catchAsync } from '../utils/catch-async';

const conquistaRouter = Router();
const conquistaService = new ConquistaService(AppDataSource.getRepository(Conquista));
const conquistaController = new ConquistaController(conquistaService);

conquistaRouter.use(autenticar);

conquistaRouter.get('/', catchAsync(conquistaController.listar));
conquistaRouter.get('/:id', catchAsync(conquistaController.buscarPorId));
conquistaRouter.post('/', validarRequisicao(criarConquistaSchema), catchAsync(conquistaController.criar));
conquistaRouter.put('/:id', validarRequisicao(atualizarConquistaSchema), catchAsync(conquistaController.atualizar));
conquistaRouter.delete('/:id', catchAsync(conquistaController.remover));

export { conquistaRouter };
