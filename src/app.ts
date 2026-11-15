
import express, { Application } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

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
    this.configurarRotaNaoEncontrada();
    this.configurarTratamentoDeErros();
  }

  private configurarMiddlewares(): void {
    this.app.use(morgan('dev'));
    this.app.use(helmet());
    this.app.use(corsMiddleware);
    this.app.use(express.json({ limit: '100kb' }));
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

  private configurarRotaNaoEncontrada(): void {
    this.app.use((req, res) => {
      res.status(404).json({
        status: 'erro',
        mensagem: `Rota ${req.method} ${req.originalUrl} não encontrada`,
      });
    });
  }

  private configurarTratamentoDeErros(): void {
    this.app.use(manipuladorDeErros);
  }
}

export default new App().app;
