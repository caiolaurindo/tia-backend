import { TurmaController } from '../../src/controllers/turma.controller';
import { TurmaService } from '../../src/services/turma.service';

describe('TurmaController', () => {
  let controller: TurmaController;
  let service: jest.Mocked<TurmaService>;

  const professorId = 10;

  const mockResponse = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  });

  beforeEach(() => {
    service = {
      listarPorProfessor: jest.fn(),
      buscarPorIdEProfessor: jest.fn(),
      criarParaProfessor: jest.fn(),
      atualizarParaProfessor: jest.fn(),
      removerParaProfessor: jest.fn(),
    } as unknown as jest.Mocked<TurmaService>;

    controller = new TurmaController(service);
  });

  describe('listar', () => {
    it('deve listar as turmas do professor autenticado', async () => {
      const turmas = [
        { id: 1, nome: 'Turma A' },
        { id: 2, nome: 'Turma B' },
      ];

      const req = {
        usuario: { sub: professorId },
      } as any;

      const res = mockResponse();

      service.listarPorProfessor.mockResolvedValue(turmas as any);

      await controller.listar(req, res as any);

      expect(service.listarPorProfessor).toHaveBeenCalledWith(professorId);
      expect(res.json).toHaveBeenCalledWith(turmas);
    });
  });

  describe('buscarPorId', () => {
    it('deve buscar uma turma pelo ID e professor autenticado', async () => {
      const turma = {
        id: 5,
        nome: 'Turma teste',
      };

      const req = {
        params: { id: '5' },
        usuario: { sub: professorId },
      } as any;

      const res = mockResponse();

      service.buscarPorIdEProfessor.mockResolvedValue(turma as any);

      await controller.buscarPorId(req, res as any);

      expect(service.buscarPorIdEProfessor).toHaveBeenCalledWith(
        5,
        professorId
      );
      expect(res.json).toHaveBeenCalledWith(turma);
    });
  });

  describe('criar', () => {
    it('deve criar uma turma e retornar status 201', async () => {
      const body = {
        nome: 'Turma nova',
      };

      const turma = {
        id: 3,
        ...body,
      };

      const req = {
        body,
        usuario: { sub: professorId },
      } as any;

      const res = mockResponse();

      service.criarParaProfessor.mockResolvedValue(turma as any);

      await controller.criar(req, res as any);

      expect(service.criarParaProfessor).toHaveBeenCalledWith(
        body,
        professorId
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(turma);
    });
  });

  describe('atualizar', () => {
    it('deve atualizar uma turma pelo ID', async () => {
      const body = {
        nome: 'Turma atualizada',
      };

      const turma = {
        id: 5,
        ...body,
      };

      const req = {
        params: { id: '5' },
        body,
        usuario: { sub: professorId },
      } as any;

      const res = mockResponse();

      service.atualizarParaProfessor.mockResolvedValue(turma as any);

      await controller.atualizar(req, res as any);

      expect(service.atualizarParaProfessor).toHaveBeenCalledWith(
        5,
        body,
        professorId
      );
      expect(res.json).toHaveBeenCalledWith(turma);
    });
  });

  describe('remover', () => {
    it('deve remover uma turma e retornar status 204', async () => {
      const req = {
        params: { id: '5' },
        usuario: { sub: professorId },
      } as any;

      const res = mockResponse();

      service.removerParaProfessor.mockResolvedValue(undefined as any);

      await controller.remover(req, res as any);

      expect(service.removerParaProfessor).toHaveBeenCalledWith(
        5,
        professorId
      );
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });
});
