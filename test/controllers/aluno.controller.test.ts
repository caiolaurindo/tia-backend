import { Request, Response } from 'express';
import { AlunoController } from '../../src/controllers/aluno.controller';
import { AlunoService } from '../../src/services/aluno.service';

// Simulação dos métodos utilizados pelo controller
const criarAlunoServiceMock = () => ({
  listarPorProfessor: jest.fn(),
  buscarPorIdEProfessor: jest.fn(),
  criarParaProfessor: jest.fn(),
  atualizarParaProfessor: jest.fn(),
  removerParaProfessor: jest.fn(),
});

// Simulação da resposta do Express
const criarResponseMock = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
});

describe('AlunoController', () => {
  let alunoService: ReturnType<typeof criarAlunoServiceMock>;
  let controller: AlunoController;

  const professorId = 'professor-123';

  beforeEach(() => {
    alunoService = criarAlunoServiceMock();

    controller = new AlunoController(
      alunoService as unknown as AlunoService
    );
  });

  describe('listar', () => {
    it('deve listar alunos sem filtro de turma', async () => {
      const req = {
        query: {},
        usuario: { sub: professorId },
      } as unknown as Request;

      const res = criarResponseMock() as unknown as Response;

      const alunos = [{ id: 1, nome: 'João' }];

      alunoService.listarPorProfessor.mockResolvedValue(alunos);

      await controller.listar(req, res);

      expect(alunoService.listarPorProfessor)
        .toHaveBeenCalledWith(professorId, undefined);

      expect(res.json).toHaveBeenCalledWith(alunos);
    });

    it('deve listar alunos filtrando por turmaId', async () => {
      const req = {
        query: { turmaId: '10' },
        usuario: { sub: professorId },
      } as unknown as Request;

      const res = criarResponseMock() as unknown as Response;

      const alunos = [{ id: 1, nome: 'Maria' }];

      alunoService.listarPorProfessor.mockResolvedValue(alunos);

      await controller.listar(req, res);

      expect(alunoService.listarPorProfessor)
        .toHaveBeenCalledWith(professorId, 10);

      expect(res.json).toHaveBeenCalledWith(alunos);
    });

    it('deve lançar erro 400 quando turmaId for inválido', async () => {
      const req = {
        query: { turmaId: 'abc' },
        usuario: { sub: professorId },
      } as unknown as Request;

      const res = criarResponseMock() as unknown as Response;

      await expect(controller.listar(req, res))
        .rejects.toMatchObject({
          message: 'turmaId inválido.',
          statusCode: 400,
        });

      expect(alunoService.listarPorProfessor).not.toHaveBeenCalled();
    });

    it('deve lançar erro 400 quando turmaId for zero', async () => {
      const req = {
        query: { turmaId: '0' },
        usuario: { sub: professorId },
      } as unknown as Request;

      const res = criarResponseMock() as unknown as Response;

      await expect(controller.listar(req, res))
        .rejects.toMatchObject({
          message: 'turmaId inválido.',
          statusCode: 400,
        });

      expect(alunoService.listarPorProfessor).not.toHaveBeenCalled();
    });

    it('deve lançar erro 400 quando turmaId for negativo', async () => {
      const req = {
        query: { turmaId: '-5' },
        usuario: { sub: professorId },
      } as unknown as Request;

      const res = criarResponseMock() as unknown as Response;

      await expect(controller.listar(req, res))
        .rejects.toMatchObject({
          message: 'turmaId inválido.',
          statusCode: 400,
        });

      expect(alunoService.listarPorProfessor).not.toHaveBeenCalled();
    });
  });

  describe('buscarPorId', () => {
    it('deve buscar aluno pelo ID e professor', async () => {
      const req = {
        params: { id: '5' },
        usuario: { sub: professorId },
      } as unknown as Request;

      const res = criarResponseMock() as unknown as Response;

      const aluno = { id: 5, nome: 'Pedro' };

      alunoService.buscarPorIdEProfessor.mockResolvedValue(aluno);

      await controller.buscarPorId(req, res);

      expect(alunoService.buscarPorIdEProfessor)
        .toHaveBeenCalledWith(5, professorId);

      expect(res.json).toHaveBeenCalledWith(aluno);
    });
  });

  describe('criar', () => {
    it('deve criar aluno e retornar status 201', async () => {
      const dadosAluno = {
        nome: 'Ana',
        turmaId: 10,
      };

      const req = {
        body: dadosAluno,
        usuario: { sub: professorId },
      } as unknown as Request;

      const res = criarResponseMock() as unknown as Response;

      const alunoCriado = { id: 1, ...dadosAluno };

      alunoService.criarParaProfessor.mockResolvedValue(alunoCriado);

      await controller.criar(req, res);

      expect(alunoService.criarParaProfessor)
        .toHaveBeenCalledWith(dadosAluno, professorId);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(alunoCriado);
    });
  });

  describe('atualizar', () => {
    it('deve atualizar aluno e retornar os dados atualizados', async () => {
      const dadosAtualizados = {
        nome: 'Ana Atualizada',
      };

      const req = {
        params: { id: '5' },
        body: dadosAtualizados,
        usuario: { sub: professorId },
      } as unknown as Request;

      const res = criarResponseMock() as unknown as Response;

      const alunoAtualizado = {
        id: 5,
        ...dadosAtualizados,
      };

      alunoService.atualizarParaProfessor
        .mockResolvedValue(alunoAtualizado);

      await controller.atualizar(req, res);

      expect(alunoService.atualizarParaProfessor)
        .toHaveBeenCalledWith(5, dadosAtualizados, professorId);

      expect(res.json).toHaveBeenCalledWith(alunoAtualizado);
    });
  });

  describe('remover', () => {
    it('deve remover aluno e retornar status 204', async () => {
      const req = {
        params: { id: '5' },
        usuario: { sub: professorId },
      } as unknown as Request;

      const res = criarResponseMock() as unknown as Response;

      alunoService.removerParaProfessor.mockResolvedValue(undefined);

      await controller.remover(req, res);

      expect(alunoService.removerParaProfessor)
        .toHaveBeenCalledWith(5, professorId);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });
});
