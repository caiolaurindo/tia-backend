import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { TurmaConquistaService } from './turma-conquista.service';
import { AppError } from '../../common/utils/app-error';

describe('TurmaConquistaService', () => {
  let service: TurmaConquistaService;
  let turmaConquistaRepoMock: any;
  let turmaRepoMock: any;
  let conquistaRepoMock: any;

  beforeEach(() => {
    turmaConquistaRepoMock = {
      findOneBy: jest.fn(),
      find: jest.fn(),
      create: jest.fn((dados: any) => dados),
      save: jest.fn((dados: any) => Promise.resolve({ id: 1, ...dados })),
      remove: jest.fn().mockResolvedValue(undefined as never),
    };

    turmaRepoMock = {
      findOneBy: jest.fn(),
    };

    conquistaRepoMock = {
      findOneBy: jest.fn(),
    };

    service = new TurmaConquistaService(
      turmaConquistaRepoMock,
      turmaRepoMock,
      conquistaRepoMock,
    );
  });

  describe('Vincular Conquista a Turma', () => {
    it('deve vincular uma conquista com sucesso se a turma pertencer ao professor', async () => {
      turmaRepoMock.findOneBy.mockResolvedValue({ id: 1, professorId: 10 });
      conquistaRepoMock.findOneBy.mockResolvedValue({ id: 2, nome: 'Primeiro Código' });
      turmaConquistaRepoMock.findOneBy.mockResolvedValue(null);

      const resultado = await service.vincularConquista(1, 2, 10);

      expect(resultado).toEqual(expect.objectContaining({ turmaId: 1, conquistaId: 2 }));
      expect(turmaConquistaRepoMock.save).toHaveBeenCalled();
    });

    it('deve lançar erro 404 se a turma for de outro professor', async () => {
      turmaRepoMock.findOneBy.mockResolvedValue(null);

      await expect(service.vincularConquista(1, 2, 99)).rejects.toThrow(AppError);
    });

    it('deve lançar erro 404 se a conquista não existir', async () => {
      turmaRepoMock.findOneBy.mockResolvedValue({ id: 1, professorId: 10 });
      conquistaRepoMock.findOneBy.mockResolvedValue(null);

      await expect(service.vincularConquista(1, 999, 10)).rejects.toThrow(AppError);
    });

    it('deve lançar erro 409 se a conquista já estiver vinculada à turma', async () => {
      turmaRepoMock.findOneBy.mockResolvedValue({ id: 1, professorId: 10 });
      conquistaRepoMock.findOneBy.mockResolvedValue({ id: 2 });
      turmaConquistaRepoMock.findOneBy.mockResolvedValue({ id: 1, turmaId: 1, conquistaId: 2 });

      await expect(service.vincularConquista(1, 2, 10)).rejects.toThrow(AppError);
    });
  });

  describe('Listar Conquistas da Turma', () => {
    it('deve listar conquistas vinculadas à turma do professor autenticado', async () => {
      turmaRepoMock.findOneBy.mockResolvedValue({ id: 1, professorId: 10 });
      turmaConquistaRepoMock.find.mockResolvedValue([
        { id: 1, turmaId: 1, conquistaId: 2, conquista: { nome: 'Parabéns' } },
      ]);

      const lista = await service.listarConquistasDaTurma(1, 10);

      expect(lista).toHaveLength(1);
      expect(turmaConquistaRepoMock.find).toHaveBeenCalledWith({
        where: { turmaId: 1 },
        relations: ['conquista'],
      });
    });
  });

  describe('Desvincular Conquista', () => {
    it('deve desvincular uma conquista com sucesso', async () => {
      turmaRepoMock.findOneBy.mockResolvedValue({ id: 1, professorId: 10 });
      turmaConquistaRepoMock.findOneBy.mockResolvedValue({ id: 1, turmaId: 1, conquistaId: 2 });

      await expect(service.desvincularConquista(1, 2, 10)).resolves.not.toThrow();
      expect(turmaConquistaRepoMock.remove).toHaveBeenCalled();
    });

    it('deve lançar erro 404 se o vínculo não existir', async () => {
      turmaRepoMock.findOneBy.mockResolvedValue({ id: 1, professorId: 10 });
      turmaConquistaRepoMock.findOneBy.mockResolvedValue(null);

      await expect(service.desvincularConquista(1, 2, 10)).rejects.toThrow(AppError);
    });
  });
});