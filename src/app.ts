import express, { Application } from 'express';
import { professorRouter } from './modules/professor/professor.controller';
import { manipuladorDeErros } from './common/middlewares/error.middleware';
import { turmaRouter } from './modules/turma/turma.controller';
import { registroRouter } from './modules/registro/registro.controller';

/**
 * @author moisesaraujo
 * @author caiolaurindo (inclusão das rotas de Aula e AulaConquista)
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
