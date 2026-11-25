import { ConquistaController } from '../../src/controllers/conquista.controller';
import { ConquistaService } from '../../src/services/conquista.service';

describe('ConquistaController', () => {
  let controller: ConquistaController;
  let service: jest.Mocked<ConquistaService>;

  const professorId = 7;
  const usuario = { sub: professorId };

  const mockResponse = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  });

  beforeEach(() => {
    service = {
      listarPorProfessor: jest.fn(),
      progressoPorTurma: jest.fn(),
      buscarPorIdEProfessor: jest.fn(),
      criarConquista: jest.fn(),
      atualizarConquista: jest.fn(),
      removerParaProfessor: jest.fn(),
    } as unknown as jest.Mocked<ConquistaService>;

    controller = new ConquistaController(service);
  });

  describe('listar', () => {
    it('deve listar as conquistas do professor autenticado', async () => {
      const conquistas = [
        { id: 1, nome: 'Primeira conquista' },
        { id: 2, nome: 'Segunda conquista' },
      ];
      const req = { usuario } as any;
      const res = mockResponse();

      service.listarPorProfessor.mockResolvedValue(conquistas as any);

      await controller.listar(req, res as any);

      expect(service.listarPorProfessor).toHaveBeenCalledWith(professorId);
      expect(res.json).toHaveBeenCalledWith(conquistas);
    });
  });

  describe('progresso', () => {
    it('deve retornar o progresso por turma do professor autenticado', async () => {
      const progresso = [
        { conquistaId: 1, turmaId: 2, conquistado: 3, emDesenvolvimento: 1, naoTrabalhado: 2 },
      ];
      const req = { usuario } as any;
      const res = mockResponse();

      service.progressoPorTurma.mockResolvedValue(progresso);

      await controller.progresso(req, res as any);

      expect(service.progressoPorTurma).toHaveBeenCalledWith(professorId);
      expect(res.json).toHaveBeenCalledWith(progresso);
    });
  });

  describe('buscarPorId', () => {
    it('deve buscar uma conquista pelo ID e pelo professor', async () => {
      const conquista = { id: 3, nome: 'Conquista teste' };
      const req = {
        params: { id: '3' },
        usuario,
      } as any;
      const res = mockResponse();

      service.buscarPorIdEProfessor.mockResolvedValue(conquista as any);

      await controller.buscarPorId(req, res as any);

      expect(service.buscarPorIdEProfessor).toHaveBeenCalledWith(3, professorId);
      expect(res.json).toHaveBeenCalledWith(conquista);
    });
  });

  describe('criar', () => {
    it('deve criar uma conquista para o professor e retornar status 201', async () => {
      const body = { nome: 'Nova conquista', categoria: 'speaking' };
      const conquista = { id: 1, ...body };
      const req = { body, usuario } as any;
      const res = mockResponse();

      service.criarConquista.mockResolvedValue(conquista as any);

      await controller.criar(req, res as any);

      expect(service.criarConquista).toHaveBeenCalledWith(body, professorId);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(conquista);
    });
  });

  describe('atualizar', () => {
    it('deve atualizar uma conquista existente do professor', async () => {
      const body = { nome: 'Conquista atualizada' };
      const conquista = { id: 3, ...body };
      const req = {
        params: { id: '3' },
        body,
        usuario,
      } as any;
      const res = mockResponse();

      service.atualizarConquista.mockResolvedValue(conquista as any);

      await controller.atualizar(req, res as any);

      expect(service.atualizarConquista).toHaveBeenCalledWith(3, body, professorId);
      expect(res.json).toHaveBeenCalledWith(conquista);
    });

    it('deve arquivar uma conquista enviando apenas ativa = false', async () => {
      const body = { ativa: false };
      const conquista = { id: 3, nome: 'Conquista teste', ativa: false };
      const req = {
        params: { id: '3' },
        body,
        usuario,
      } as any;
      const res = mockResponse();

      service.atualizarConquista.mockResolvedValue(conquista as any);

      await controller.atualizar(req, res as any);

      expect(service.atualizarConquista).toHaveBeenCalledWith(3, body, professorId);
      expect(res.json).toHaveBeenCalledWith(conquista);
    });
  });

  describe('remover', () => {
    it('deve remover uma conquista do professor e retornar status 204', async () => {
      const req = {
        params: { id: '3' },
        usuario,
      } as any;
      const res = mockResponse();

      service.removerParaProfessor.mockResolvedValue(undefined);

      await controller.remover(req, res as any);

      expect(service.removerParaProfessor).toHaveBeenCalledWith(3, professorId);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });
});
