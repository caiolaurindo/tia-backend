import express, { Application } from 'express';
import { professorRouter } from './modules/professor/professor.controller';
import { manipuladorDeErros } from './common/middlewares/error.middleware';
import { turmaRouter } from './modules/turma/turma.controller';
import { registroRouter } from './modules/registro/registro.controller';
import { alunoRouter } from './modules/aluno/aluno.controller';
import { alunoConquistaRouter } from './modules/aluno-conquista/aluno-conquista.controller';
import { conquistaRouter } from './modules/conquista/conquista.controller';
import { turmaConquistaRouter } from './modules/turma-conquista/turma-conquista.controller';
import { aulaRouter } from './modules/aula/aula.controller';
import { aulaConquistaRouter } from './modules/aula-conquista/aula-conquista.controller';

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
    this.app.use('/turmas/:turmaId/conquistas', turmaConquistaRouter);
    this.app.use('/conquistas', conquistaRouter);
    this.app.use('/aulas', aulaRouter);
    this.app.use('/aula-conquistas', aulaConquistaRouter);
    this.app.use('/registros', registroRouter);
    this.app.use('/alunos', alunoRouter);
    this.app.use('/aluno-conquistas', alunoConquistaRouter);
  }

  private configurarTratamentoDeErros(): void {
    this.app.use(manipuladorDeErros);
  }
}

export default new App().app;
