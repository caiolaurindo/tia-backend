import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import type { Repository } from 'typeorm';
import { AlunoService } from '../aluno.service';
import { Aluno } from '../aluno.entity';
import { Turma } from '../../turma/turma.entity';
import { AppError } from '../../../common/utils/app-error';

describe('AlunoService (Testes Unitários)', () => {
  let alunoService: AlunoService;
  let alunoRepositorioMock: {
    find: jest.Mock<any>;
    findOne: jest.Mock<any>;
    findOneBy: jest.Mock<any>;
    create: jest.Mock<any>;
    save: jest.Mock<any>;
    update: jest.Mock<any>;
    delete: jest.Mock<any>;
  };
  let turmaRepositorioMock: {
    findOne: jest.Mock<any>;
  };

  const professorIdMock = 1;
  const turmaIdMock = 10;

  const turmaMock: Turma = {
    id: turmaIdMock,
    nome: 'Inglês Kids A1',
    serie: '3º Ano',
    anoLetivo: 2026,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    professor: { id: professorIdMock } as any,
  };

  const alunoMock: Aluno = {
    id: 1,
    nome: 'Lucas Pereira',
    dataNascimento: '2017-04-15',
    observacoesGerais: 'Participativo e gosta de músicas em inglês',
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    turma: turmaMock,
  };

  beforeEach(() => {
    alunoRepositorioMock = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    turmaRepositorioMock = {
      findOne: jest.fn(),
    };

    alunoService = new AlunoService(
      alunoRepositorioMock as unknown as Repository<Aluno>,
      turmaRepositorioMock as unknown as Repository<Turma>
    );
  });

  describe('Criação de Alunos', () => {
    it('deve criar um aluno vinculado a uma turma do professor autenticado com sucesso', async () => {
      const dto = {
        nome: 'Lucas Pereira',
        dataNascimento: '2017-04-15',
        observacoesGerais: 'Participativo e gosta de músicas em inglês',
        turmaId: turmaIdMock,
      };

      turmaRepositorioMock.findOne.mockResolvedValue(turmaMock);
      alunoRepositorioMock.create.mockReturnValue(alunoMock);
      alunoRepositorioMock.save.mockResolvedValue(alunoMock);

      const resultado = await alunoService.criarParaProfessor(dto, professorIdMock);

      expect(turmaRepositorioMock.findOne).toHaveBeenCalledWith({
        where: { id: turmaIdMock, professor: { id: professorIdMock } },
      });
      expect(alunoRepositorioMock.create).toHaveBeenCalledWith({
        nome: dto.nome,
        dataNascimento: dto.dataNascimento,
        observacoesGerais: dto.observacoesGerais,
        turma: { id: turmaIdMock },
      });
      expect(alunoRepositorioMock.save).toHaveBeenCalledWith(alunoMock);
      expect(resultado).toEqual(alunoMock);
    });

    it('deve lançar AppError 404 ao tentar cadastrar aluno em turma inexistente ou de outro professor', async () => {
      const dto = {
        nome: 'Lucas Pereira',
        turmaId: 999,
      };

      turmaRepositorioMock.findOne.mockResolvedValue(null);

      await expect(
        alunoService.criarParaProfessor(dto, professorIdMock)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Turma não encontrada ou acesso não autorizado.',
      });

      expect(alunoRepositorioMock.create).not.toHaveBeenCalled();
      expect(alunoRepositorioMock.save).not.toHaveBeenCalled();
    });
  });

  describe('Listagem e Consulta com Isolamento por Professor', () => {
    it('deve listar todos os alunos pertencentes às turmas do professor informado', async () => {
      alunoRepositorioMock.find.mockResolvedValue([alunoMock]);

      const resultado = await alunoService.listarPorProfessor(professorIdMock);

      expect(alunoRepositorioMock.find).toHaveBeenCalledWith({
        where: { turma: { professor: { id: professorIdMock } } },
        relations: ['turma'],
        order: { nome: 'ASC' },
      });
      expect(resultado).toHaveLength(1);
      expect(resultado[0].nome).toBe('Lucas Pereira');
    });

    it('deve listar os alunos de uma turma específica pertencente ao professor', async () => {
      turmaRepositorioMock.findOne.mockResolvedValue(turmaMock);
      alunoRepositorioMock.find.mockResolvedValue([alunoMock]);

      const resultado = await alunoService.listarPorTurma(turmaIdMock, professorIdMock);

      expect(turmaRepositorioMock.findOne).toHaveBeenCalledWith({
        where: { id: turmaIdMock, professor: { id: professorIdMock } },
      });
      expect(alunoRepositorioMock.find).toHaveBeenCalledWith({
        where: { turma: { id: turmaIdMock, professor: { id: professorIdMock } } },
        order: { nome: 'ASC' },
      });
      expect(resultado).toHaveLength(1);
    });

    it('deve lançar AppError 404 ao tentar listar alunos de uma turma de outro professor', async () => {
      turmaRepositorioMock.findOne.mockResolvedValue(null);

      await expect(
        alunoService.listarPorTurma(turmaIdMock, 99)
      ).rejects.toThrow(AppError);

      expect(alunoRepositorioMock.find).not.toHaveBeenCalled();
    });

    it('deve buscar um aluno por ID caso pertença a uma turma do professor', async () => {
      alunoRepositorioMock.findOne.mockResolvedValue(alunoMock);

      const resultado = await alunoService.buscarPorIdEProfessor(1, professorIdMock);

      expect(alunoRepositorioMock.findOne).toHaveBeenCalledWith({
        where: { id: 1, turma: { professor: { id: professorIdMock } } },
        relations: ['turma'],
      });
      expect(resultado).toEqual(alunoMock);
    });

    it('deve lançar AppError com status 404 caso o aluno não seja encontrado ou pertença a outro professor', async () => {
      alunoRepositorioMock.findOne.mockResolvedValue(null);

      await expect(
        alunoService.buscarPorIdEProfessor(999, professorIdMock)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Aluno não encontrado ou acesso não autorizado.',
      });
    });
  });

  describe('Atualização de Alunos', () => {
    it('deve atualizar os dados do aluno pertencente ao professor com sucesso', async () => {
      const dadosAtualizacao = {
        nome: 'Lucas Pereira Santos',
        observacoesGerais: 'Evoluiu bastante no vocabulário',
      };
      const alunoAtualizado = { ...alunoMock, ...dadosAtualizacao };

      alunoRepositorioMock.findOne
        .mockResolvedValueOnce(alunoMock)
        .mockResolvedValueOnce(alunoAtualizado);
      alunoRepositorioMock.update.mockResolvedValue({});

      const resultado = await alunoService.atualizarParaProfessor(
        1,
        dadosAtualizacao,
        professorIdMock
      );

      expect(alunoRepositorioMock.update).toHaveBeenCalledWith(1, dadosAtualizacao);
      expect(resultado.nome).toBe('Lucas Pereira Santos');
    });

    it('deve permitir transferir o aluno para outra turma do mesmo professor', async () => {
      const novaTurmaId = 20;
      const novaTurma = { ...turmaMock, id: novaTurmaId };
      const dadosAtualizacao = { turmaId: novaTurmaId };
      const alunoTransferido = { ...alunoMock, turma: novaTurma };

      alunoRepositorioMock.findOne
        .mockResolvedValueOnce(alunoMock)
        .mockResolvedValueOnce(alunoTransferido);
      turmaRepositorioMock.findOne.mockResolvedValue(novaTurma);
      alunoRepositorioMock.update.mockResolvedValue({});

      const resultado = await alunoService.atualizarParaProfessor(
        1,
        dadosAtualizacao,
        professorIdMock
      );

      expect(turmaRepositorioMock.findOne).toHaveBeenCalledWith({
        where: { id: novaTurmaId, professor: { id: professorIdMock } },
      });
      expect(alunoRepositorioMock.update).toHaveBeenCalledWith(1, {
        turma: { id: novaTurmaId },
      });
      expect(resultado.turma.id).toBe(novaTurmaId);
    });

    it('não deve permitir transferir o aluno para uma turma de outro professor', async () => {
      alunoRepositorioMock.findOne.mockResolvedValue(alunoMock);
      turmaRepositorioMock.findOne.mockResolvedValue(null);

      await expect(
        alunoService.atualizarParaProfessor(1, { turmaId: 999 }, professorIdMock)
      ).rejects.toThrow(AppError);

      expect(alunoRepositorioMock.update).not.toHaveBeenCalled();
    });

    it('não deve permitir atualizar um aluno de outro professor', async () => {
      alunoRepositorioMock.findOne.mockResolvedValue(null);

      await expect(
        alunoService.atualizarParaProfessor(1, { nome: 'Novo Nome' }, 99)
      ).rejects.toThrow(AppError);

      expect(alunoRepositorioMock.update).not.toHaveBeenCalled();
    });
  });

  describe('Remoção de Alunos', () => {
    it('deve remover o aluno com sucesso quando pertencer a uma turma do professor', async () => {
      alunoRepositorioMock.findOne.mockResolvedValue(alunoMock);
      alunoRepositorioMock.delete.mockResolvedValue({});

      await alunoService.removerParaProfessor(1, professorIdMock);

      expect(alunoRepositorioMock.delete).toHaveBeenCalledWith(1);
    });

    it('não deve permitir remover um aluno inexistente ou de outro professor', async () => {
      alunoRepositorioMock.findOne.mockResolvedValue(null);

      await expect(
        alunoService.removerParaProfessor(999, professorIdMock)
      ).rejects.toThrow(AppError);

      expect(alunoRepositorioMock.delete).not.toHaveBeenCalled();
    });
  });
});
