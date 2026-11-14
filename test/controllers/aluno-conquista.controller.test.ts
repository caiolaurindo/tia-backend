import { AlunoConquistaController } from '../../src/controllers/aluno-conquista.controller';
import { AlunoConquistaService } from '../../src/services/aluno-conquista.service';
import { AppError } from '../../src/utils/app-error';

describe('AlunoConquistaController', () => {
  let controller: AlunoConquistaController;
  let service: jest.Mocked<AlunoConquistaService>;

  const professorId = 10;

  const mockResponse = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  });

  beforeEach(() => {
    service = {
      listarPorAluno: jest.fn(),
      atribuirParaProfessor: jest.fn(),
      atualizarParaProfessor: jest.fn(),
      removerParaProfessor: jest.fn(),
    } as unknown as jest.Mocked<AlunoConquistaService>;

    controller = new AlunoConquistaController(service);
  });

  describe('listar', () => {
    it('deve listar as conquistas de um aluno', async () => {
      const conquistas = [{ id: 1, nome: 'Primeira conquista' }];
      const req = {
        query: { alunoId: '5' },
        usuario: { sub: professorId },
      } as any;
      const res = mockResponse();

      service.listarPorAluno.mockResolvedValue(conquistas as any);

      await controller.listar(req, res as any);

      expect(service.listarPorAluno).toHaveBeenCalledWith(5, professorId);
      expect(res.json).toHaveBeenCalledWith(conquistas);
    });

    it('deve lançar AppError quando alunoId estiver ausente', async () => {
      const req = {
        query: {},
        usuario: { sub: professorId },
      } as any;
      const res = mockResponse();

      await expect(controller.listar(req, res as any)).rejects.toThrow(
        AppError
      );
    });

    it('deve lançar AppError quando alunoId não for numérico', async () => {
      const req = {
        query: { alunoId: 'abc' },
        usuario: { sub: professorId },
      } as any;
      const res = mockResponse();

      await expect(controller.listar(req, res as any)).rejects.toThrow(
        AppError
      );

      expect(service.listarPorAluno).not.toHaveBeenCalled();
    });
    it('deve lançar AppError quando alunoId for zero', async () => {
      const req = {
        query: { alunoId: '0' },
        usuario: { sub: professorId },
      } as any;
      const res = mockResponse();

      await expect(controller.listar(req, res as any)).rejects.toThrow(AppError);

      expect(service.listarPorAluno).not.toHaveBeenCalled();
    });

    it('deve lançar AppError quando alunoId for negativo', async () => {
      const req = {
        query: { alunoId: '-5' },
        usuario: { sub: professorId },
      } as any;
      const res = mockResponse();

      await expect(controller.listar(req, res as any)).rejects.toThrow(AppError);

      expect(service.listarPorAluno).not.toHaveBeenCalled();
    });

    it('deve lançar AppError quando alunoId for decimal', async () => {
      const req = {
        query: { alunoId: '2.5' },
        usuario: { sub: professorId },
      } as any;
      const res = mockResponse();

      await expect(controller.listar(req, res as any)).rejects.toThrow(AppError);

      expect(service.listarPorAluno).not.toHaveBeenCalled();
    });
  });

  describe('atribuir', () => {
    it('deve atribuir uma conquista e retornar status 201', async () => {
      const body = { alunoId: 5, conquistaId: 2 };
      const resultado = { id: 1, ...body };
      const req = {
        body,
        usuario: { sub: professorId },
      } as any;
      const res = mockResponse();

      service.atribuirParaProfessor.mockResolvedValue(resultado as any);

      await controller.atribuir(req, res as any);

      expect(service.atribuirParaProfessor).toHaveBeenCalledWith(
        body,
        professorId
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(resultado);
    });
  });

  describe('atualizar', () => {
    it('deve atualizar uma conquista vinculada', async () => {
      const body = { observacao: 'Conquista atualizada' };
      const resultado = { id: 3, ...body };
      const req = {
        params: { id: '3' },
        body,
        usuario: { sub: professorId },
      } as any;
      const res = mockResponse();

      service.atualizarParaProfessor.mockResolvedValue(resultado as any);

      await controller.atualizar(req, res as any);

      expect(service.atualizarParaProfessor).toHaveBeenCalledWith(
        3,
        body,
        professorId
      );
      expect(res.json).toHaveBeenCalledWith(resultado);
    });
  });

  describe('remover', () => {
    it('deve remover uma conquista vinculada e retornar status 204', async () => {
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
