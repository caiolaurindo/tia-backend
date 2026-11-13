import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { AlunoService } from '../aluno.service';
import { Aluno } from '../../models/aluno.entity';
import { AppError } from '../../utils/app-error';

describe('AlunoService (Testes Unitários)', () => {
  let alunoService: AlunoService;
  let repositorioMock: any;
  let turmaServiceMock: any;

  const professorIdMock = 1;
  const turmaIdMock = 10;

  const alunoMock: Aluno = {
    id: 1,
    nome: 'Lucas Pereira',
    dataNascimento: new Date('2018-05-10'),
    observacoes: 'Participativo',
    turma: { id: turmaIdMock } as any,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
  };

  beforeEach(() => {
    repositorioMock = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    turmaServiceMock = {
      buscarPorIdEProfessor: jest.fn(),
    };

    alunoService = new AlunoService(repositorioMock, turmaServiceMock);
  });

  describe('Criação de Alunos', () => {
    it('deve criar um aluno validando a posse da turma pela professora', async () => {
      const dto = {
        nome: 'Lucas Pereira',
        dataNascimento: new Date('2018-05-10'),
        observacoes: 'Participativo',
        turmaId: turmaIdMock,
      };

      turmaServiceMock.buscarPorIdEProfessor.mockResolvedValue({ id: turmaIdMock });
      repositorioMock.create.mockReturnValue(alunoMock);
      repositorioMock.save.mockResolvedValue(alunoMock);

      const resultado = await alunoService.criarParaProfessor(dto, professorIdMock);

      expect(turmaServiceMock.buscarPorIdEProfessor).toHaveBeenCalledWith(turmaIdMock, professorIdMock);
      expect(repositorioMock.create).toHaveBeenCalledWith({
        nome: dto.nome,
        dataNascimento: dto.dataNascimento,
        observacoes: dto.observacoes,
        turma: { id: turmaIdMock },
      });
      expect(repositorioMock.save).toHaveBeenCalledWith(alunoMock);
      expect(resultado).toEqual(alunoMock);
    });

    it('deve lançar AppError 404 se a turma não pertencer à professora', async () => {
      turmaServiceMock.buscarPorIdEProfessor.mockRejectedValue(
        new AppError('Turma não encontrada ou acesso não autorizado.', 404)
      );

      await expect(
        alunoService.criarParaProfessor(
          { nome: 'Lucas', dataNascimento: new Date(), turmaId: 999 },
          professorIdMock
        )
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Turma não encontrada ou acesso não autorizado.',
      });

      expect(repositorioMock.save).not.toHaveBeenCalled();
    });
  });

  describe('Listagem e Busca com Isolamento por Professora', () => {
    it('deve listar todos os alunos da professora sem filtro de turmaId', async () => {
      repositorioMock.find.mockResolvedValue([alunoMock]);

      const resultado = await alunoService.listarPorProfessor(professorIdMock);

      expect(repositorioMock.find).toHaveBeenCalledWith({
        where: {
          turma: {
            professor: { id: professorIdMock },
          },
        },
        relations: { turma: true },
        order: { nome: 'ASC' },
      });
      expect(resultado).toEqual([alunoMock]);
    });

    it('deve listar os alunos filtrando por turmaId', async () => {
      repositorioMock.find.mockResolvedValue([alunoMock]);

      const resultado = await alunoService.listarPorProfessor(professorIdMock, turmaIdMock);

      expect(repositorioMock.find).toHaveBeenCalledWith({
        where: {
          turma: {
            professor: { id: professorIdMock },
            id: turmaIdMock,
          },
        },
        relations: { turma: true },
        order: { nome: 'ASC' },
      });
      expect(resultado).toEqual([alunoMock]);
    });

    it('deve buscar um aluno por ID caso pertença à professora', async () => {
      repositorioMock.findOne.mockResolvedValue(alunoMock);

      const resultado = await alunoService.buscarPorIdEProfessor(1, professorIdMock);

      expect(repositorioMock.findOne).toHaveBeenCalledWith({
        where: { id: 1, turma: { professor: { id: professorIdMock } } },
        relations: { turma: true },
      });
      expect(resultado).toEqual(alunoMock);
    });

    it('deve lançar AppError 404 caso o aluno seja inexistente ou de outra professora', async () => {
      repositorioMock.findOne.mockResolvedValue(null);

      await expect(alunoService.buscarPorIdEProfessor(1, 999)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Aluno não encontrado ou acesso não autorizado.',
      });
    });
  });

  describe('Atualização de Alunos', () => {
    it('deve atualizar os dados do aluno sem trocar de turma', async () => {
      const alunoAtualizado = { ...alunoMock, nome: 'Lucas Silva' };

      repositorioMock.findOne
        .mockResolvedValueOnce(alunoMock)
        .mockResolvedValueOnce(alunoAtualizado);
      repositorioMock.update.mockResolvedValue({ affected: 1 });

      const resultado = await alunoService.atualizarParaProfessor(
        1,
        { nome: 'Lucas Silva' },
        professorIdMock
      );

      expect(turmaServiceMock.buscarPorIdEProfessor).not.toHaveBeenCalled();
      expect(repositorioMock.update).toHaveBeenCalledWith(1, { nome: 'Lucas Silva' });
      expect(resultado.nome).toBe('Lucas Silva');
    });

    it('deve validar a posse da nova turma ao atualizar aluno com troca de turma', async () => {
      const novaTurmaId = 20;
      const alunoAtualizado = { ...alunoMock, turma: { id: novaTurmaId } as any };

      repositorioMock.findOne
        .mockResolvedValueOnce(alunoMock)
        .mockResolvedValueOnce(alunoAtualizado);
      turmaServiceMock.buscarPorIdEProfessor.mockResolvedValue({ id: novaTurmaId });
      repositorioMock.update.mockResolvedValue({ affected: 1 });

      const resultado = await alunoService.atualizarParaProfessor(
        1,
        { turmaId: novaTurmaId },
        professorIdMock
      );

      expect(turmaServiceMock.buscarPorIdEProfessor).toHaveBeenCalledWith(novaTurmaId, professorIdMock);
      expect(repositorioMock.update).toHaveBeenCalledWith(1, { turma: { id: novaTurmaId } });
      expect(resultado.turma.id).toBe(novaTurmaId);
    });

    it('deve bloquear atualização quando a nova turma pertencer a outra professora', async () => {
      repositorioMock.findOne.mockResolvedValueOnce(alunoMock);
      turmaServiceMock.buscarPorIdEProfessor.mockRejectedValue(
        new AppError('Turma não encontrada ou acesso não autorizado.', 404)
      );

      await expect(
        alunoService.atualizarParaProfessor(1, { turmaId: 999 }, professorIdMock)
      ).rejects.toMatchObject({ statusCode: 404 });

      expect(repositorioMock.update).not.toHaveBeenCalled();
    });
  });

  describe('Remoção de Alunos', () => {
    it('deve remover o aluno quando pertencer à professora', async () => {
      repositorioMock.findOne.mockResolvedValue(alunoMock);
      repositorioMock.delete.mockResolvedValue({ affected: 1 });

      await alunoService.removerParaProfessor(1, professorIdMock);

      expect(repositorioMock.delete).toHaveBeenCalledWith(1);
    });

    it('deve bloquear remoção quando o aluno pertencer a outra professora', async () => {
      repositorioMock.findOne.mockResolvedValue(null);

      await expect(alunoService.removerParaProfessor(1, 999)).rejects.toMatchObject({
        statusCode: 404,
      });

      expect(repositorioMock.delete).not.toHaveBeenCalled();
    });
  });
});
