import express from 'express';
import request from 'supertest';
import { criarRouterGenerico } from '../../src/controllers/base.controller';
import { ServiceGenerico } from '../../src/services/base.service';

describe('criarRouterGenerico', () => {
  let service: jest.Mocked<ServiceGenerico<{ id: number }>>;
  let app: express.Express;

  beforeEach(() => {
    service = {
      listarTodos: jest.fn(),
      buscarPorId: jest.fn(),
      criar: jest.fn(),
      atualizar: jest.fn(),
      remover: jest.fn(),
    } as unknown as jest.Mocked<ServiceGenerico<{ id: number }>>;

    app = express();
    app.use(express.json());
    app.use(criarRouterGenerico(service));
  });

  describe('GET /', () => {
    it('deve listar todos os registros', async () => {
      const registros = [
        { id: 1, nome: 'Registro A' },
        { id: 2, nome: 'Registro B' },
      ];

      service.listarTodos.mockResolvedValue(registros as any);

      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(registros);
      expect(service.listarTodos).toHaveBeenCalled();
    });
  });

  describe('GET /:id', () => {
    it('deve buscar um registro pelo ID', async () => {
      const registro = { id: 5, nome: 'Registro teste' };

      service.buscarPorId.mockResolvedValue(registro as any);

      const response = await request(app).get('/5');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(registro);
      expect(service.buscarPorId).toHaveBeenCalledWith(5);
    });
  });

  describe('POST /', () => {
    it('deve criar um registro e retornar status 201', async () => {
      const body = { nome: 'Novo registro' };
      const novoRegistro = { id: 3, ...body };

      service.criar.mockResolvedValue(novoRegistro as any);

      const response = await request(app)
        .post('/')
        .send(body);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(novoRegistro);
      expect(service.criar).toHaveBeenCalledWith(body);
    });
  });

  describe('PUT /:id', () => {
    it('deve atualizar um registro pelo ID', async () => {
      const body = { nome: 'Registro atualizado' };
      const registroAtualizado = { id: 5, ...body };

      service.atualizar.mockResolvedValue(registroAtualizado as any);

      const response = await request(app)
        .put('/5')
        .send(body);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(registroAtualizado);
      expect(service.atualizar).toHaveBeenCalledWith(5, body);
    });
  });

  describe('DELETE /:id', () => {
    it('deve remover um registro e retornar status 204', async () => {
      service.remover.mockResolvedValue(undefined as any);

      const response = await request(app).delete('/5');

      expect(response.status).toBe(204);
      expect(service.remover).toHaveBeenCalledWith(5);
    });
  });
});
