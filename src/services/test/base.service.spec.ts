import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Repository } from 'typeorm';
import { ServiceGenerico } from '../base.service';
import { AppError } from '../../utils/app-error';

interface EntidadeTeste {
  id: number;
  nome: string;
}

class TesteService extends ServiceGenerico<EntidadeTeste> {
  constructor(repositorio: Repository<EntidadeTeste>) {
    super(repositorio);
  }
}

describe('ServiceGenerico (Testes Unitários)', () => {
  let service: TesteService;
  let repositorioMock: any;

  const entidadeMock: EntidadeTeste = { id: 1, nome: 'Item Teste' };

  beforeEach(() => {
    repositorioMock = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    service = new TesteService(repositorioMock);
  });

  describe('listarTodos', () => {
    it('deve retornar todos os registros do repositório', async () => {
      repositorioMock.find.mockResolvedValue([entidadeMock]);

      const resultado = await service.listarTodos();

      expect(repositorioMock.find).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual([entidadeMock]);
    });
  });

  describe('buscarPorId', () => {
    it('deve retornar o registro quando encontrado', async () => {
      repositorioMock.findOneBy.mockResolvedValue(entidadeMock);

      const resultado = await service.buscarPorId(1);

      expect(repositorioMock.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(resultado).toEqual(entidadeMock);
    });

    it('deve lançar AppError 404 quando o registro não for encontrado', async () => {
      repositorioMock.findOneBy.mockResolvedValue(null);

      await expect(service.buscarPorId(99)).rejects.toThrow(AppError);
      await expect(service.buscarPorId(99)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Registro com id 99 não encontrado.',
      });
    });
  });

  describe('criar', () => {
    it('deve criar e salvar o registro no repositório', async () => {
      const dados = { nome: 'Novo Item' };
      repositorioMock.create.mockReturnValue(entidadeMock);
      repositorioMock.save.mockResolvedValue(entidadeMock);

      const resultado = await service.criar(dados);

      expect(repositorioMock.create).toHaveBeenCalledWith(dados);
      expect(repositorioMock.save).toHaveBeenCalledWith(entidadeMock);
      expect(resultado).toEqual(entidadeMock);
    });
  });

  describe('atualizar', () => {
    it('deve atualizar o registro existente e retornar o registro atualizado', async () => {
      const dadosAtualizacao = { nome: 'Item Atualizado' };
      const entidadeAtualizada = { ...entidadeMock, ...dadosAtualizacao };

      repositorioMock.findOneBy
        .mockResolvedValueOnce(entidadeMock)
        .mockResolvedValueOnce(entidadeAtualizada);
      repositorioMock.update.mockResolvedValue({ affected: 1 });

      const resultado = await service.atualizar(1, dadosAtualizacao);

      expect(repositorioMock.update).toHaveBeenCalledWith(1, dadosAtualizacao);
      expect(resultado).toEqual(entidadeAtualizada);
    });

    it('deve lançar AppError 404 ao tentar atualizar registro inexistente', async () => {
      repositorioMock.findOneBy.mockResolvedValue(null);

      await expect(service.atualizar(99, { nome: 'Teste' })).rejects.toMatchObject({
        statusCode: 404,
      });
      expect(repositorioMock.update).not.toHaveBeenCalled();
    });
  });

  describe('remover', () => {
    it('deve remover o registro existente', async () => {
      repositorioMock.findOneBy.mockResolvedValue(entidadeMock);
      repositorioMock.delete.mockResolvedValue({ affected: 1 });

      await service.remover(1);

      expect(repositorioMock.delete).toHaveBeenCalledWith(1);
    });

    it('deve lançar AppError 404 ao tentar remover registro inexistente', async () => {
      repositorioMock.findOneBy.mockResolvedValue(null);

      await expect(service.remover(99)).rejects.toMatchObject({
        statusCode: 404,
      });
      expect(repositorioMock.delete).not.toHaveBeenCalled();
    });
  });
});
