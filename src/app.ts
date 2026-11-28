
import express, { Application } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { corsMiddleware } from './middlewares/cors.middleware';
import { manipuladorDeErros } from './middlewares/error.middleware';
import {
  criarLimitadorGeral,
  criarLimitadorLogin,
  criarLimitadorCadastro,
} from './middlewares/rate-limit.middleware';

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
    this.app.set('etag', false);
    this.configurarProxy();
    this.configurarMiddlewares();
    this.configurarRotas();
    this.configurarRotaNaoEncontrada();
    this.configurarTratamentoDeErros();
  }

  /**
   * Define `trust proxy` apenas quando `TRUST_PROXY` estiver configurada.
   * Valor numérico = quantidade de proxies na frente da API (ex: `1`); outro texto é repassado
   * ao Express (ex: `loopback`). Sem a variável, o IP do cliente é o da conexão direta.
   * Necessário atrás de proxy reverso/load balancer; sem isso o rate limit enxerga o IP do proxy.
   */
  private configurarProxy(): void {
    // Na Vercel a API sempre fica atrás de 1 proxy, que preenche o X-Forwarded-For com o IP real.
    const proxy = process.env.TRUST_PROXY?.trim() || (process.env.VERCEL ? '1' : '');
    if (!proxy) return;

    this.app.set('trust proxy', /^\d+$/.test(proxy) ? Number(proxy) : proxy);
  }

  private configurarMiddlewares(): void {
    this.app.use(morgan('dev'));
    this.app.use(helmet());
    this.app.use(corsMiddleware);
    // Depois de helmet/cors para que as respostas 429 também levem os headers de segurança e CORS,
    // e antes do parser de JSON para barrar o excesso sem processar o body.
    this.app.use(criarLimitadorGeral());
    this.app.use(express.json({ limit: '100kb' }));
  }

  private configurarRotas(): void {
    this.app.post('/auth/login', criarLimitadorLogin());
    this.app.post('/auth/cadastro', criarLimitadorCadastro());
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
