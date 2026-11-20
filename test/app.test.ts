import request from 'supertest';
import app from '../src/app';
import { LIMITES } from '../src/middlewares/rate-limit.middleware';

describe('Configurações HTTP da aplicação', () => {
  it('deve adicionar cabeçalhos de segurança com Helmet', async () => {
    const response = await request(app).get('/rota-inexistente');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBeDefined();
    expect(response.headers['etag']).toBeUndefined();
  });

  it('deve retornar 404 para uma rota inexistente', async () => {
    const response = await request(app).get('/rota-inexistente');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      status: 'erro',
      mensagem: 'Rota GET /rota-inexistente não encontrada',
    });
  });

  it('deve rejeitar um JSON maior que 100 KB', async () => {
    const payload = {
      conteudo: 'a'.repeat(110 * 1024),
    };

    const response = await request(app)
      .post('/rota-inexistente')
      .send(payload);

    expect(response.status).toBe(413);
  });
});

describe('Rate limiting', () => {
  it('deve bloquear POST /auth/login após exceder as tentativas com falha', async () => {
    for (let i = 0; i < LIMITES.login.limit; i++) {
      const resposta = await request(app).post('/auth/login').send({});
      expect(resposta.status).not.toBe(429);
    }

    const bloqueada = await request(app).post('/auth/login').send({});

    expect(bloqueada.status).toBe(429);
    expect(bloqueada.body).toEqual({ status: 'erro', mensagem: LIMITES.login.mensagem });
    expect(bloqueada.headers).toHaveProperty('retry-after');
  });

  it('deve bloquear POST /auth/cadastro após exceder o limite', async () => {
    for (let i = 0; i < LIMITES.cadastro.limit; i++) {
      await request(app).post('/auth/cadastro').send({});
    }

    const bloqueada = await request(app).post('/auth/cadastro').send({});

    expect(bloqueada.status).toBe(429);
  });
});
