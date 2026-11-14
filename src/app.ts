import express, { Application } from 'express';
import { corsMiddleware } from './middlewares/cors.middleware';
import { manipuladorDeErros } from './middlewares/error.middleware';
import { professorRouter } from './routes/professor.routes';
import { turmaRouter } from './routes/turma.routes';
import { registroRouter } from './routes/registro.routes';
import { alunoRouter } from './routes/aluno.routes';
import { alunoConquistaRouter } from './routes/aluno-conquista.routes';
import { conquistaRouter } from './routes/conquista.routes';
import { turmaConquistaRouter } from './routes/turma-conquista.routes';
import { aulaRouter } from './routes/aula.routes';
import { aulaConquistaRouter } from './routes/aula-conquista.routes';

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
    this.app.use(corsMiddleware);
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
