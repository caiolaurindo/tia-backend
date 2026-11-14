import { RegistroController } from '../../src/controllers/registro.controller';
import { RegistroService } from '../../src/services/registro.service';

describe('RegistroController', () => {
  let controller: RegistroController;
  let service: jest.Mocked<RegistroService>;

  const professorId = 10;

  const mockResponse = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  });

  beforeEach(() => {
    service = {
      criar: jest.fn(),
      listarTodos: jest.fn(),
      buscarPorAluno: jest.fn(),
      buscarPorAula: jest.fn(),
      buscarPorId: jest.fn(),
      atualizar: jest.fn(),
      remover: jest.fn(),
    } as unknown as jest.Mocked<RegistroService>;

    controller = new RegistroController(service);
  });

  describe('criar', () => {
    it('deve criar um registro e retornar status 201', async () => {
      const body = {
        aluno_id: 1,
        aula_id: 2,
      };

      const registro = { id: 5, ...body };

      const req = {
        body,
        usuario: { sub: professorId },
      } as any;

      const res = mockResponse();

      service.criar.mockResolvedValue(registro as any);

      await controller.criar(req, res as any);

      expect(service.criar).toHaveBeenCalledWith(body, professorId);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(registro);
    });
  });

  describe('listar', () => {
    it('deve listar os registros do professor autenticado', async () => {
      const registros = [{ id: 1 }, { id: 2 }];

      const req = {
        usuario: { sub: professorId },
      } as any;

      const res = mockResponse();

      service.listarTodos.mockResolvedValue(registros as any);

      await controller.listar(req, res as any);

      expect(service.listarTodos).toHaveBeenCalledWith(professorId);
      expect(res.json).toHaveBeenCalledWith(registros);
    });
  });

  describe('buscarPorAluno', () => {
    it('deve buscar registros pelo ID do aluno', async () => {
      const registros = [{ id: 1, aluno_id: 3 }];

      const req = {
        params: { aluno_id: '3' },
        usuario: { sub: professorId },
      } as any;

      const res = mockResponse();

      service.buscarPorAluno.mockResolvedValue(registros as any);

      await controller.buscarPorAluno(req, res as any);

      expect(service.buscarPorAluno).toHaveBeenCalledWith(3, professorId);
      expect(res.json).toHaveBeenCalledWith(registros);
    });
  });

  describe('buscarPorAula', () => {
    it('deve buscar registros pelo ID da aula', async () => {
      const registros = [{ id: 1, aula_id: 4 }];

      const req = {
        params: { aula_id: '4' },
        usuario: { sub: professorId },
      } as any;

      const res = mockResponse();

      service.buscarPorAula.mockResolvedValue(registros as any);

      await controller.buscarPorAula(req, res as any);

      expect(service.buscarPorAula).toHaveBeenCalledWith(4, professorId);
      expect(res.json).toHaveBeenCalledWith(registros);
    });
  });

  describe('buscarPorId', () => {
    it('deve buscar um registro pelo ID', async () => {
      const registro = { id: 7, aluno_id: 3, aula_id: 4 };

      const req = {
        params: { id: '7' },
        usuario: { sub: professorId },
      } as any;

      const res = mockResponse();

      service.buscarPorId.mockResolvedValue(registro as any);

      await controller.buscarPorId(req, res as any);

      expect(service.buscarPorId).toHaveBeenCalledWith(7, professorId);
      expect(res.json).toHaveBeenCalledWith(registro);
    });
  });

  describe('atualizar', () => {
    it('deve atualizar um registro pelo ID', async () => {
      const body = {
        aluno_id: 2,
        aula_id: 5,
      };

      const registro = { id: 7, ...body };

      const req = {
        params: { id: '7' },
        body,
        usuario: { sub: professorId },
      } as any;

      const res = mockResponse();

      service.atualizar.mockResolvedValue(registro as any);

      await controller.atualizar(req, res as any);

      expect(service.atualizar).toHaveBeenCalledWith(7, body, professorId);
      expect(res.json).toHaveBeenCalledWith(registro);
    });
  });

  describe('remover', () => {
    it('deve remover um registro e retornar status 204', async () => {
      const req = {
        params: { id: '7' },
        usuario: { sub: professorId },
      } as any;

      const res = mockResponse();

      service.remover.mockResolvedValue(undefined as any);

      await controller.remover(req, res as any);

      expect(service.remover).toHaveBeenCalledWith(7, professorId);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });
});
