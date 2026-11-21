import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ConquistaService } from '../conquista.service';
import { Conquista, CategoriaConquista } from '../../models/conquista.entity';
import { StatusConquista } from '../../models/aluno-conquista.entity';
import { AppError } from '../../utils/app-error';

/** Query builder falso: todos os métodos encadeiam e getRawMany devolve o resultado. */
function criarQueryBuilderMock(resultado: unknown[]) {
  const qb: any = {};
  for (const metodo of ['innerJoin', 'where', 'select', 'addSelect', 'groupBy', 'addGroupBy']) {
    qb[metodo] = jest.fn();
    qb[metodo].mockReturnValue(qb);
  }
  qb.getRawMany = jest.fn();
  qb.getRawMany.mockResolvedValue(resultado);
  return qb;
}

describe('ConquistaService (Testes Unitários)', () => {
  let conquistaService: ConquistaService;
  let repositorioMock: any;

  const conquistaMock: Conquista = {
    id: 1,
    nome: 'Vocabulário Básico',
    descricao: 'Conhece cumprimentos básicos em inglês',
    categoria: CategoriaConquista.VOCABULARY,
    nivel: 'A1',
    ativa: true,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
  };

  beforeEach(() => {
    repositorioMock = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      manager: { createQueryBuilder: jest.fn() },
    };

    conquistaService = new ConquistaService(repositorioMock);
  });

  describe('Criação de Conquistas', () => {
    it('deve criar uma conquista com nome único', async () => {
      const dto = {
        nome: conquistaMock.nome,
        descricao: conquistaMock.descricao,
        categoria: conquistaMock.categoria,
        nivel: conquistaMock.nivel,
      };

      repositorioMock.findOneBy.mockResolvedValue(null);
      repositorioMock.create.mockReturnValue(conquistaMock);
      repositorioMock.save.mockResolvedValue(conquistaMock);

      const resultado = await conquistaService.criarConquista(dto);

      expect(repositorioMock.findOneBy).toHaveBeenCalledWith({ nome: dto.nome });
      expect(repositorioMock.create).toHaveBeenCalledWith(dto);
      expect(repositorioMock.save).toHaveBeenCalledWith(conquistaMock);
      expect(resultado).toEqual(conquistaMock);
    });

    it('deve lançar AppError 409 ao tentar criar conquista com nome duplicado', async () => {
      const dto = { nome: conquistaMock.nome, categoria: conquistaMock.categoria };
      repositorioMock.findOneBy.mockResolvedValue(conquistaMock);

      await expect(conquistaService.criarConquista(dto)).rejects.toThrow(AppError);

      await expect(conquistaService.criarConquista(dto)).rejects.toMatchObject({
        statusCode: 409,
        message: 'Já existe uma conquista com esse nome.',
      });

      expect(repositorioMock.save).not.toHaveBeenCalled();
    });
  });

  describe('Atualização de Conquistas', () => {
    it('deve atualizar a conquista mantendo o próprio nome sem erro de duplicidade', async () => {
      const dto = { nome: conquistaMock.nome, descricao: 'Descrição atualizada' };
      const conquistaAtualizada = { ...conquistaMock, ...dto };

      repositorioMock.findOneBy
        .mockResolvedValueOnce(conquistaMock) // garantirNomeUnico (mesmo id)
        .mockResolvedValueOnce(conquistaMock) // buscarPorId antes do update
        .mockResolvedValueOnce(conquistaAtualizada); // buscarPorId depois do update
      repositorioMock.update.mockResolvedValue({ affected: 1 });

      const resultado = await conquistaService.atualizarConquista(1, dto);

      expect(repositorioMock.update).toHaveBeenCalledWith(1, dto);
      expect(resultado.descricao).toBe('Descrição atualizada');
    });

    it('deve atualizar apenas a descrição sem consultar unicidade de nome', async () => {
      const dto = { descricao: 'Nova descrição' };
      const conquistaAtualizada = { ...conquistaMock, ...dto };

      repositorioMock.findOneBy
        .mockResolvedValueOnce(conquistaMock)
        .mockResolvedValueOnce(conquistaAtualizada);
      repositorioMock.update.mockResolvedValue({ affected: 1 });

      const resultado = await conquistaService.atualizarConquista(1, dto);

      expect(repositorioMock.update).toHaveBeenCalledWith(1, dto);
      expect(resultado.descricao).toBe('Nova descrição');
    });

    it('deve arquivar a conquista (ativa = false) sem consultar unicidade de nome', async () => {
      const arquivada = { ...conquistaMock, ativa: false };

      repositorioMock.findOneBy
        .mockResolvedValueOnce(conquistaMock) // buscarPorId antes do update
        .mockResolvedValueOnce(arquivada); // buscarPorId depois do update
      repositorioMock.update.mockResolvedValue({ affected: 1 });

      const resultado = await conquistaService.atualizarConquista(1, { ativa: false });

      expect(repositorioMock.update).toHaveBeenCalledWith(1, { ativa: false });
      expect(repositorioMock.findOneBy).not.toHaveBeenCalledWith({ nome: expect.anything() });
      expect(resultado.ativa).toBe(false);
    });

    it('deve lançar AppError 409 ao tentar atualizar para um nome já usado por outra conquista', async () => {
      const outraConquista = { ...conquistaMock, id: 2, nome: 'Nome Existente' };
      repositorioMock.findOneBy.mockResolvedValue(outraConquista);

      await expect(
        conquistaService.atualizarConquista(1, { nome: 'Nome Existente' })
      ).rejects.toMatchObject({
        statusCode: 409,
        message: 'Já existe uma conquista com esse nome.',
      });

      expect(repositorioMock.update).not.toHaveBeenCalled();
    });
  });

  describe('Progresso por turma', () => {
    const professorId = 99;

    it('deve retornar lista vazia, sem consultar alunos, quando não há conquistas vinculadas', async () => {
      const qbVinculos = criarQueryBuilderMock([]);
      repositorioMock.manager.createQueryBuilder.mockReturnValueOnce(qbVinculos);

      const resultado = await conquistaService.progressoPorTurma(professorId);

      expect(resultado).toEqual([]);
      expect(repositorioMock.manager.createQueryBuilder).toHaveBeenCalledTimes(1);
      expect(qbVinculos.where).toHaveBeenCalledWith('p.id = :professorId', { professorId });
    });

    it('deve somar os status e calcular "não trabalhado" pelo total de alunos da turma', async () => {
      const qbVinculos = criarQueryBuilderMock([{ turmaId: 1, conquistaId: 10 }]);
      const qbTotais = criarQueryBuilderMock([{ turmaId: 1, total: '12' }]);
      const qbContagens = criarQueryBuilderMock([
        { turmaId: 1, conquistaId: 10, status: StatusConquista.CONQUISTADO, total: '7' },
        { turmaId: 1, conquistaId: 10, status: StatusConquista.EM_DESENVOLVIMENTO, total: '2' },
        { turmaId: 1, conquistaId: 10, status: StatusConquista.EM_DESENVOLVIMENTO_AVANCADO, total: '1' },
        { turmaId: 1, conquistaId: 10, status: StatusConquista.NAO_TRABALHADO, total: '1' },
      ]);
      repositorioMock.manager.createQueryBuilder
        .mockReturnValueOnce(qbVinculos)
        .mockReturnValueOnce(qbTotais)
        .mockReturnValueOnce(qbContagens);

      const resultado = await conquistaService.progressoPorTurma(professorId);

      expect(resultado).toEqual([
        { conquistaId: 10, turmaId: 1, conquistado: 7, emDesenvolvimento: 3, naoTrabalhado: 2 },
      ]);
      expect(qbTotais.where).toHaveBeenCalledWith('p.id = :professorId', { professorId });
      expect(qbContagens.where).toHaveBeenCalledWith('p.id = :professorId', { professorId });
    });

    it('deve considerar todos os alunos como "não trabalhado" quando não há registros', async () => {
      const qbVinculos = criarQueryBuilderMock([{ turmaId: 2, conquistaId: 10 }]);
      const qbTotais = criarQueryBuilderMock([{ turmaId: 2, total: '5' }]);
      const qbContagens = criarQueryBuilderMock([]);
      repositorioMock.manager.createQueryBuilder
        .mockReturnValueOnce(qbVinculos)
        .mockReturnValueOnce(qbTotais)
        .mockReturnValueOnce(qbContagens);

      const resultado = await conquistaService.progressoPorTurma(professorId);

      expect(resultado).toEqual([
        { conquistaId: 10, turmaId: 2, conquistado: 0, emDesenvolvimento: 0, naoTrabalhado: 5 },
      ]);
    });

    it('deve ignorar registros de conquistas que não estão vinculadas à turma', async () => {
      const qbVinculos = criarQueryBuilderMock([{ turmaId: 1, conquistaId: 10 }]);
      const qbTotais = criarQueryBuilderMock([{ turmaId: 1, total: '4' }]);
      const qbContagens = criarQueryBuilderMock([
        { turmaId: 1, conquistaId: 77, status: StatusConquista.CONQUISTADO, total: '4' },
      ]);
      repositorioMock.manager.createQueryBuilder
        .mockReturnValueOnce(qbVinculos)
        .mockReturnValueOnce(qbTotais)
        .mockReturnValueOnce(qbContagens);

      const resultado = await conquistaService.progressoPorTurma(professorId);

      expect(resultado).toEqual([
        { conquistaId: 10, turmaId: 1, conquistado: 0, emDesenvolvimento: 0, naoTrabalhado: 4 },
      ]);
    });
  });
});
