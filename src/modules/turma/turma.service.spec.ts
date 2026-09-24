import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Repository } from 'typeorm';
import { TurmaService } from './turma.service';
import { Turma } from './turma.entity';
import { AppError } from '../../common/utils/app-error';

describe('TurmaService (Testes Unitários)', () => {
  let turmaService: TurmaService;
  let repositorioMock: jest.Mocked<Repository<Turma>>;

  const professorIdMock = 1;

  const turmaMock: Turma = {
    id: 1,
    nome: 'Inglês Kids A1',
    serie: '3º Ano',
    anoLetivo: 2026,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    professor: { id: professorIdMock } as any,
  };

  beforeEach(() => {
    repositorioMock = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<Turma>>;

    turmaService = new TurmaService(repositorioMock);
  });

  describe('Criação de Turmas (RF03)', () => {
    it('deve criar uma turma vinculada ao professor autenticado com sucesso', async () => {
      const dto = {
        nome: 'Inglês Kids A1',
        serie: '3º Ano',
        anoLetivo: 2026,
        faixaEtaria: '8 a 9 anos',
      };

      repositorioMock.create.mockReturnValue(turmaMock);
      repositorioMock.save.mockResolvedValue(turmaMock);

      const resultado = await turmaService.criarParaProfessor(dto, professorIdMock);

      expect(repositorioMock.create).toHaveBeenCalledWith({
        ...dto,
        professor: { id: professorIdMock },
      });
      expect(repositorioMock.save).toHaveBeenCalledWith(turmaMock);
      expect(resultado).toEqual(turmaMock);
    });
  });

  describe('Listagem e Consulta com Isolamento por Professor', () => {
    it('deve listar apenas as turmas pertencentes ao professor informado', async () => {
      repositorioMock.find.mockResolvedValue([turmaMock]);

      const resultado = await turmaService.listarPorProfessor(professorIdMock);

      expect(repositorioMock.find).toHaveBeenCalledWith({
        where: { professor: { id: professorIdMock } },
        order: { nome: 'ASC' },
      });
      expect(resultado).toHaveLength(1);
      expect(resultado[0].nome).toBe('Inglês Kids A1');
    });

    it('deve buscar uma turma por ID caso ela pertença ao professor', async () => {
      repositorioMock.findOne.mockResolvedValue(turmaMock);

      const resultado = await turmaService.buscarPorIdEProfessor(1, professorIdMock);

      expect(repositorioMock.findOne).toHaveBeenCalledWith({
        where: { id: 1, professor: { id: professorIdMock } },
      });
      expect(resultado).toEqual(turmaMock);
    });

    it('deve lançar AppError com status 404 caso a turma não seja encontrada ou seja de outro professor', async () => {
      repositorioMock.findOne.mockResolvedValue(null);

      await expect(
        turmaService.buscarPorIdEProfessor(999, professorIdMock)
      ).rejects.toThrow(AppError);

      await expect(
        turmaService.buscarPorIdEProfessor(999, professorIdMock)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Turma não encontrada ou acesso não autorizado.',
      });
    });
  });

  describe('Atualização de Turmas', () => {
    it('deve atualizar os dados da turma pertencente ao professor com sucesso', async () => {
      const dadosAtualizacao = { nome: 'Inglês Kids Avançado' };
      const turmaAtualizada = { ...turmaMock, ...dadosAtualizacao };

      repositorioMock.findOne
        .mockResolvedValueOnce(turmaMock)
        .mockResolvedValueOnce(turmaAtualizada);

      repositorioMock.update.mockResolvedValue({} as any);

      const resultado = await turmaService.atualizarParaProfessor(1, dadosAtualizacao, professorIdMock);

      expect(repositorioMock.update).toHaveBeenCalledWith(1, dadosAtualizacao);
      expect(resultado.nome).toBe('Inglês Kids Avançado');
    });

    it('não deve permitir atualizar uma turma de outro professor', async () => {
      repositorioMock.findOne.mockResolvedValue(null);

      await expect(
        turmaService.atualizarParaProfessor(1, { nome: 'Novo Nome' }, 99)
      ).rejects.toThrow(AppError);
    });
  });

  describe('Remoção de Turmas', () => {
    it('deve remover a turma com sucesso quando pertencer ao professor', async () => {
      repositorioMock.findOne.mockResolvedValue(turmaMock);
      repositorioMock.delete.mockResolvedValue({} as any);

      await turmaService.removerParaProfessor(1, professorIdMock);

      expect(repositorioMock.delete).toHaveBeenCalledWith(1);
    });

    it('não deve permitir remover uma turma inexistente ou de outro professor', async () => {
      repositorioMock.findOne.mockResolvedValue(null);

      await expect(
        turmaService.removerParaProfessor(999, professorIdMock)
      ).rejects.toThrow(AppError);

      expect(repositorioMock.delete).not.toHaveBeenCalled();
    });
  });
});