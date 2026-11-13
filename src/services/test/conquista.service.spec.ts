import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ConquistaService } from '../conquista.service';
import { Conquista } from '../../models/conquista.entity';
import { AppError } from '../../utils/app-error';

describe('ConquistaService (Testes Unitários)', () => {
  let conquistaService: ConquistaService;
  let repositorioMock: any;

  const conquistaMock: Conquista = {
    id: 1,
    nome: 'Vocabulário Básico',
    descricao: 'Conhece cumprimentos básicos em inglês',
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
    };

    conquistaService = new ConquistaService(repositorioMock);
  });

  describe('Criação de Conquistas', () => {
    it('deve criar uma conquista com nome único', async () => {
      const dto = {
        nome: conquistaMock.nome,
        descricao: conquistaMock.descricao,
      };

      repositorioMock.findOneBy.mockResolvedValue(null);
      repositorioMock.create.mockReturnValue(conquistaMock);
      repositorioMock.save.mockResolvedValue(conquistaMock);

      const resultado = await conquistaService.criarConquista(dto);

      expect(repositorioMock.findOneBy).toHaveBeenCalledWith({ nome: dto.nome });
      expect(repositorioMock.save).toHaveBeenCalledWith(conquistaMock);
      expect(resultado).toEqual(conquistaMock);
    });

    it('deve lançar AppError 409 ao tentar criar conquista com nome duplicado', async () => {
      repositorioMock.findOneBy.mockResolvedValue(conquistaMock);

      await expect(
        conquistaService.criarConquista({ nome: conquistaMock.nome })
      ).rejects.toThrow(AppError);

      await expect(
        conquistaService.criarConquista({ nome: conquistaMock.nome })
      ).rejects.toMatchObject({
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
});
