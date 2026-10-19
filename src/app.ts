import express, { Application } from 'express';
import { professorRouter } from './modules/professor/professor.controller';
import { manipuladorDeErros } from './common/middlewares/error.middleware';
import { turmaRouter } from './modules/turma/turma.controller';
import { conquistaRouter } from './modules/conquista/conquista.controller';
import { turmaConquistaRouter } from './modules/turma-conquista/turma-conquista.controller';
import { alunoRouter } from './modules/aluno/aluno.controller';

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
  }

  private configurarRotas(): void {
    this.app.use('/auth', professorRouter);
    this.app.use('/turmas', turmaRouter);
    this.app.use('/conquistas', conquistaRouter);
    this.app.use('/turmas/:turmaId/conquistas', turmaConquistaRouter);
    this.app.use('/alunos', alunoRouter);
  }

  private configurarTratamentoDeErros(): void {
    this.app.use(manipuladorDeErros);
  }
}

export default new App().app;