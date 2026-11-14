import { AulaController } from '../../src/controllers/aula.controller';
import { AulaService } from '../../src/services/aula.service';

describe('AulaController', () => {
  let controller: AulaController;
  let service: jest.Mocked<AulaService>;

  const professorId = 10;

  const mockResponse = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  });

  beforeEach(() => {
    service = {
      listarPorTurmaEProfessor: jest.fn(),
      listarPorProfessor: jest.fn(),
      buscarPorIdEProfessor: jest.fn(),
      criarParaProfessor: jest.fn(),
      atualizarParaProfessor: jest.fn(),
      removerParaProfessor: jest.fn(),
    } as unknown as jest.Mocked<AulaService>;

    controller = new AulaController(service);
  });

  describe('listar', () => {
    it('deve listar aulas por professor quando não informar turmaId', async () => {
      const aulas = [{ id: 1, titulo: 'Aula 1' }];
      const req = {
        query: {},
        usuario: { sub: professorId },
      } as any;
      const res = mockResponse();

      service.listarPorProfessor.mockResolvedValue(aulas as any);

      await controller.listar(req, res as any);

      expect(service.listarPorProfessor).toHaveBeenCalledWith(professorId);
      expect(service.listarPorTurmaEProfessor).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(aulas);
    });

    it('deve listar aulas por turma e professor quando informar turmaId', async () => {
      const aulas = [{ id: 2, titulo: 'Aula 2' }];
      const req = {
        query: { turmaId: '5' },
        usuario: { sub: professorId },
      } as any;
      const res = mockResponse();

      service.listarPorTurmaEProfessor.mockResolvedValue(aulas as any);

      await controller.listar(req, res as any);

      expect(service.listarPorTurmaEProfessor).toHaveBeenCalledWith(
        5,
        professorId
      );
      expect(service.listarPorProfessor).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(aulas);
    });

it('deve rejeitar turmaId não numérico', async () => {
  const req = {
    query: { turmaId: 'abc' },
    usuario: { sub: professorId },
  } as any;

  const res = mockResponse();

  await expect(controller.listar(req, res as any)).rejects.toThrow(
    'turmaId inválido.'
  );

  expect(service.listarPorTurmaEProfessor).not.toHaveBeenCalled();
  expect(service.listarPorProfessor).not.toHaveBeenCalled();
});

it('deve rejeitar turmaId menor ou igual a zero', async () => {
    const req = {
        query: { turmaId: '0' },
        usuario: { sub: professorId },
    } as any;

    const res = mockResponse();

    await expect(controller.listar(req, res as any)).rejects.toThrow(
        'turmaId inválido.'
    );

    expect(service.listarPorTurmaEProfessor).not.toHaveBeenCalled();
    expect(service.listarPorProfessor).not.toHaveBeenCalled();
    });
});

  describe('buscarPorId', () => {
    it('deve buscar uma aula pelo ID e professor', async () => {
      const aula = { id: 3, titulo: 'Aula 3' };
      const req = {
        params: { id: '3' },
        usuario: { sub: professorId },
      } as any;
      const res = mockResponse();

      service.buscarPorIdEProfessor.mockResolvedValue(aula as any);

      await controller.buscarPorId(req, res as any);

      expect(service.buscarPorIdEProfessor).toHaveBeenCalledWith(
        3,
        professorId
      );
      expect(res.json).toHaveBeenCalledWith(aula);
    });
  });

  describe('criar', () => {
    it('deve criar uma aula e retornar status 201', async () => {
      const body = { titulo: 'Nova aula' };
      const aula = { id: 1, ...body };
      const req = {
        body,
        usuario: { sub: professorId },
      } as any;
      const res = mockResponse();

      service.criarParaProfessor.mockResolvedValue(aula as any);

      await controller.criar(req, res as any);

      expect(service.criarParaProfessor).toHaveBeenCalledWith(
        body,
        professorId
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(aula);
    });
  });

  describe('atualizar', () => {
    it('deve atualizar uma aula existente', async () => {
      const body = { titulo: 'Aula atualizada' };
      const aula = { id: 3, ...body };
      const req = {
        params: { id: '3' },
        body,
        usuario: { sub: professorId },
      } as any;
      const res = mockResponse();

      service.atualizarParaProfessor.mockResolvedValue(aula as any);

      await controller.atualizar(req, res as any);

      expect(service.atualizarParaProfessor).toHaveBeenCalledWith(
        3,
        body,
        professorId
      );
      expect(res.json).toHaveBeenCalledWith(aula);
    });
  });

  describe('remover', () => {
    it('deve remover uma aula e retornar status 204', async () => {
      const req = {
        params: { id: '3' },
        usuario: { sub: professorId },
      } as any;
      const res = mockResponse();

      service.removerParaProfessor.mockResolvedValue(undefined);

      await controller.remover(req, res as any);

      expect(service.removerParaProfessor).toHaveBeenCalledWith(
        3,
        professorId
      );
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });
});
