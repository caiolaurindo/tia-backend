import request from 'supertest';
import app from '../src/app';

describe('Configurações HTTP da aplicação', () => {
  it('deve adicionar cabeçalhos de segurança com Helmet', async () => {
    const response = await request(app).get('/rota-inexistente');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBeDefined();
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
