
import { ConquistaController } from '../../src/controllers/conquista.controller';
import { ConquistaService } from '../../src/services/conquista.service';

describe('ConquistaController', () => {
  let controller: ConquistaController;
  let service: jest.Mocked<ConquistaService>;

  const mockResponse = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  });

  beforeEach(() => {
    service = {
      listarTodos: jest.fn(),
      buscarPorId: jest.fn(),
      criarConquista: jest.fn(),
      atualizarConquista: jest.fn(),
      remover: jest.fn(),
    } as unknown as jest.Mocked<ConquistaService>;

    controller = new ConquistaController(service);
  });

  describe('listar', () => {
    it('deve listar todas as conquistas', async () => {
      const conquistas = [
        { id: 1, nome: 'Primeira conquista' },
        { id: 2, nome: 'Segunda conquista' },
      ];
      const req = {} as any;
      const res = mockResponse();

      service.listarTodos.mockResolvedValue(conquistas as any);

      await controller.listar(req, res as any);

      expect(service.listarTodos).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(conquistas);
    });
  });

  describe('buscarPorId', () => {
    it('deve buscar uma conquista pelo ID', async () => {
      const conquista = { id: 3, nome: 'Conquista teste' };
      const req = {
        params: { id: '3' },
      } as any;
      const res = mockResponse();

      service.buscarPorId.mockResolvedValue(conquista as any);

      await controller.buscarPorId(req, res as any);

      expect(service.buscarPorId).toHaveBeenCalledWith(3);
      expect(res.json).toHaveBeenCalledWith(conquista);
    });
  });

  describe('criar', () => {
    it('deve criar uma conquista e retornar status 201', async () => {
      const body = { nome: 'Nova conquista' };
      const conquista = { id: 1, ...body };
      const req = { body } as any;
      const res = mockResponse();

      service.criarConquista.mockResolvedValue(conquista as any);

      await controller.criar(req, res as any);

      expect(service.criarConquista).toHaveBeenCalledWith(body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(conquista);
    });
  });

  describe('atualizar', () => {
    it('deve atualizar uma conquista existente', async () => {
      const body = { nome: 'Conquista atualizada' };
      const conquista = { id: 3, ...body };
      const req = {
        params: { id: '3' },
        body,
      } as any;
      const res = mockResponse();

      service.atualizarConquista.mockResolvedValue(conquista as any);

      await controller.atualizar(req, res as any);

      expect(service.atualizarConquista).toHaveBeenCalledWith(3, body);
      expect(res.json).toHaveBeenCalledWith(conquista);
    });
  });

  describe('remover', () => {
    it('deve remover uma conquista e retornar status 204', async () => {
      const req = {
        params: { id: '3' },
      } as any;
      const res = mockResponse();

      service.remover.mockResolvedValue(undefined);

      await controller.remover(req, res as any);

      expect(service.remover).toHaveBeenCalledWith(3);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });
});
