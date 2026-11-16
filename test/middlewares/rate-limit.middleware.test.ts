import express, { Application, RequestHandler } from 'express';
import request from 'supertest';
import {
  criarLimitador,
  criarLimitadorGeral,
  criarLimitadorLogin,
  criarLimitadorCadastro,
  LIMITES,
} from '../../src/middlewares/rate-limit.middleware';
import { manipuladorDeErros } from '../../src/middlewares/error.middleware';

/**
 * Mini-app com a rota POST /rota protegida pelo limitador. A rota responde 200 quando
 * `body.ok` é verdadeiro e 401 caso contrário (simula login correto/incorreto).
 */
function criarApp(limitador: RequestHandler): Application {
  const app = express();
  app.use(express.json());
  app.post('/rota', limitador, (req, res) => {
    res.status(req.body?.ok ? 200 : 401).json({ ok: Boolean(req.body?.ok) });
  });
  app.use(manipuladorDeErros);
  return app;
}

async function disparar(app: Application, quantidade: number, ok: boolean): Promise<number[]> {
  const status: number[] = [];
  for (let i = 0; i < quantidade; i++) {
    const resposta = await request(app).post('/rota').send({ ok });
    status.push(resposta.status);
  }
  return status;
}

const esperar = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

describe('rate-limit.middleware', () => {
  describe('criarLimitador', () => {
    it('deve permitir requisições até o limite configurado', async () => {
      const app = criarApp(criarLimitador({ windowMs: 60_000, limit: 3, mensagem: 'Limite excedido' }));

      const status = await disparar(app, 3, true);

      expect(status).toEqual([200, 200, 200]);
    });

    it('deve responder 429 no formato padrão da API ao exceder o limite', async () => {
      const app = criarApp(criarLimitador({ windowMs: 60_000, limit: 2, mensagem: 'Limite excedido' }));
      await disparar(app, 2, true);

      const resposta = await request(app).post('/rota').send({ ok: true });

      expect(resposta.status).toBe(429);
      expect(resposta.body).toEqual({ status: 'erro', mensagem: 'Limite excedido' });
    });

    it('deve enviar headers padrão (draft-7) e Retry-After, sem os headers legados X-RateLimit-*', async () => {
      const app = criarApp(criarLimitador({ windowMs: 60_000, limit: 1, mensagem: 'Limite excedido' }));

      const permitida = await request(app).post('/rota').send({ ok: true });
      const bloqueada = await request(app).post('/rota').send({ ok: true });

      expect(permitida.headers).toHaveProperty('ratelimit');
      expect(permitida.headers).toHaveProperty('ratelimit-policy');
      expect(permitida.headers).not.toHaveProperty('x-ratelimit-limit');
      expect(bloqueada.status).toBe(429);
      expect(bloqueada.headers).toHaveProperty('retry-after');
    });

    it('deve voltar a permitir requisições depois que a janela expira', async () => {
      const app = criarApp(criarLimitador({ windowMs: 100, limit: 1, mensagem: 'Limite excedido' }));

      const antes = await disparar(app, 2, true);
      await esperar(250);
      const depois = await disparar(app, 1, true);

      expect(antes).toEqual([200, 429]);
      expect(depois).toEqual([200]);
    });
  });

  describe('criarLimitadorGeral', () => {
    it('deve declarar a política de 100 requisições por 15 minutos', async () => {
      const app = criarApp(criarLimitadorGeral());

      const resposta = await request(app).post('/rota').send({ ok: true });

      expect(LIMITES.geral.limit).toBe(100);
      expect(resposta.headers['ratelimit-policy']).toBe('100;w=900');
    });

    it('deve bloquear a requisição seguinte ao atingir o limite', async () => {
      const app = criarApp(criarLimitadorGeral());

      const status = await disparar(app, LIMITES.geral.limit + 1, true);

      expect(status.slice(0, LIMITES.geral.limit).every((s) => s === 200)).toBe(true);
      expect(status[LIMITES.geral.limit]).toBe(429);
    });
  });

  describe('criarLimitadorLogin', () => {
    it('não deve contar logins bem-sucedidos', async () => {
      const app = criarApp(criarLimitadorLogin());

      const status = await disparar(app, LIMITES.login.limit + 5, true);

      expect(status.every((s) => s === 200)).toBe(true);
    });

    it('deve bloquear após o limite de tentativas que falharam', async () => {
      const app = criarApp(criarLimitadorLogin());

      const falhas = await disparar(app, LIMITES.login.limit, false);
      const bloqueada = await request(app).post('/rota').send({ ok: false });

      expect(falhas.every((s) => s === 401)).toBe(true);
      expect(bloqueada.status).toBe(429);
      expect(bloqueada.body).toEqual({ status: 'erro', mensagem: LIMITES.login.mensagem });
    });
  });

  describe('criarLimitadorCadastro', () => {
    it('deve contar todas as requisições e bloquear após o limite', async () => {
      const app = criarApp(criarLimitadorCadastro());

      const permitidas = await disparar(app, LIMITES.cadastro.limit, true);
      const bloqueada = await request(app).post('/rota').send({ ok: true });

      expect(permitidas.every((s) => s === 200)).toBe(true);
      expect(bloqueada.status).toBe(429);
      expect(bloqueada.body).toEqual({ status: 'erro', mensagem: LIMITES.cadastro.mensagem });
    });
  });

  describe('independência entre limitadores', () => {
    it('esgotar o limite de cadastro não deve bloquear o login', async () => {
      const app = express();
      app.use(express.json());
      app.post('/auth/cadastro', criarLimitadorCadastro(), (_req, res) => res.json({ ok: true }));
      app.post('/auth/login', criarLimitadorLogin(), (_req, res) => res.json({ ok: true }));
      app.use(manipuladorDeErros);

      for (let i = 0; i < LIMITES.cadastro.limit; i++) {
        await request(app).post('/auth/cadastro').send({});
      }
      const cadastroBloqueado = await request(app).post('/auth/cadastro').send({});
      const login = await request(app).post('/auth/login').send({});

      expect(cadastroBloqueado.status).toBe(429);
      expect(login.status).toBe(200);
    });
  });
});
