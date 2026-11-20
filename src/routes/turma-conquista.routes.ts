import { Router } from 'express';
import { AppDataSource } from '../data/data-source';
import { TurmaConquista } from '../models/turma-conquista.entity';
import { Turma } from '../models/turma.entity';
import { Conquista } from '../models/conquista.entity';
import { TurmaConquistaService } from '../services/turma-conquista.service';
import { TurmaConquistaController } from '../controllers/turma-conquista.controller';
import { autenticar } from '../middlewares/auth.middleware';
import { validarRequisicao } from '../middlewares/validation.middleware';
import { vincularConquistaSchema } from '../models/turma-conquista.schema';
import { turmaIdParamSchema, turmaConquistaParamsSchema } from '../models/common.schema';
import { catchAsync } from '../utils/catch-async';

const turmaConquistaRouter = Router({ mergeParams: true });

const turmaConquistaService = new TurmaConquistaService(
  AppDataSource.getRepository(TurmaConquista),
  AppDataSource.getRepository(Turma),
  AppDataSource.getRepository(Conquista),
);
const turmaConquistaController = new TurmaConquistaController(turmaConquistaService);

turmaConquistaRouter.use(autenticar);

turmaConquistaRouter.get('/', validarRequisicao({ params: turmaIdParamSchema }), catchAsync(turmaConquistaController.listar));
turmaConquistaRouter.post('/', validarRequisicao({ params: turmaIdParamSchema, body: vincularConquistaSchema }), catchAsync(turmaConquistaController.vincular));
turmaConquistaRouter.delete('/:conquistaId', validarRequisicao({ params: turmaConquistaParamsSchema }), catchAsync(turmaConquistaController.desvincular));

export { turmaConquistaRouter };
