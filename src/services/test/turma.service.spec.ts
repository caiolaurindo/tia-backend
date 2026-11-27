import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { TurmaService } from '../turma.service';
import { Turma } from '../../models/turma.entity';
import { AppError } from '../../utils/app-error';

describe('TurmaService (Testes Unitários)', () => {
  let turmaService: TurmaService;
  let repositorioMock: any;

  const professorIdMock = 1;

  const turmaMock: Turma = {
    id: 1,
    nome: 'Inglês Kids A1',
    serie: '3º Ano',
    anoLetivo: 2026,
    faixaEtaria: '8 a 9 anos',
    turno: 'Manhã',
    descricao: 'Turma de inglês infantil',
    arquivada: false,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    professor: { id: professorIdMock } as any,
  };

  beforeEach(() => {
    repositorioMock = {
      find: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

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

  
it('deve listar as turmas do professor com paginação padrão', async () => {
  repositorioMock.findAndCount.mockResolvedValue([[turmaMock], 1]);

  const resultado = await turmaService.listarPorProfessor(professorIdMock);

  expect(repositorioMock.findAndCount).toHaveBeenCalledWith({
    where: {
      professor: { id: professorIdMock },
    },
    order: { nome: 'ASC' },
    skip: 0,
    take: 10,
  });

  expect(resultado.dados).toHaveLength(1);
  expect(resultado.dados[0].nome).toBe('Inglês Kids A1');
  expect(resultado.paginacao).toEqual({
    pagina: 1,
    limite: 10,
    total: 1,
    totalPaginas: 1,
  });
});

it('deve aplicar filtros e paginação na listagem de turmas', async () => {
  repositorioMock.findAndCount.mockResolvedValue([[turmaMock], 1]);

  const resultado = await turmaService.listarPorProfessor(
    professorIdMock,
    'Inglês',
    '3º Ano',
    2026,
    2,
    5
  );

  expect(repositorioMock.findAndCount).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({
        professor: { id: professorIdMock },
        anoLetivo: 2026,
      }),
      skip: 5,
      take: 5,
    })
  );

  expect(resultado.paginacao.pagina).toBe(2);
  expect(resultado.paginacao.limite).toBe(5);
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
