import express, { Application } from 'express';
import { professorRouter } from './modules/professor/professor.controller';
import { manipuladorDeErros } from './common/middlewares/error.middleware';
import { turmaRouter } from './modules/turma/turma.controller';
import { registroRouter } from './modules/registro/registro.controller';
import { apiLimiter, authLimiter } from './common/middlewares/rateLimit.middleware';

/**
 * @author moisesaraujo
 */

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.configurarMiddlewares();
    this.configurarRotas();
    this.configurarTratamentoDeErros();
  }

  private configurarMiddlewares(): void {
    this.app.use(express.json());
    this.app.set('trust proxy', 1);
    this.app.use('/auth/login', authLimiter);
    this.app.use('/auth/cadastro', authLimiter);
    this.app.use('/api', apiLimiter);
  }

  private configurarRotas(): void {
    this.app.use('/auth', professorRouter);
    this.app.use('/turmas', turmaRouter);
    this.app.use('/registros', registroRouter);
  }

  private configurarTratamentoDeErros(): void {
    this.app.use(manipuladorDeErros);
  }
}

export default new App().app;