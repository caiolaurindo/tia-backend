import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { AlunoConquistaService } from '../aluno-conquista.service';
import { AlunoConquista, StatusConquista } from '../../models/aluno-conquista.entity';
import { AppError } from '../../utils/app-error';

describe('AlunoConquistaService (Testes Unitários)', () => {
  let service: AlunoConquistaService;
  let repositorioMock: any;
  let alunoServiceMock: any;
  let turmaConquistaRepoMock: any;

  const professorIdMock = 1;
  const alunoIdMock = 5;
  const turmaIdMock = 10;
  const conquistaIdMock = 2;

  beforeEach(() => {
    repositorioMock = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn((d: any) => d),
      save: jest.fn((d: any) => Promise.resolve({ id: 1, ...d })),
      delete: jest.fn(),
    };

    alunoServiceMock = {
      buscarPorIdEProfessor: jest.fn(),
    };

    turmaConquistaRepoMock = {
      findOneBy: jest.fn(),
    };

    service = new AlunoConquistaService(
      repositorioMock,
      alunoServiceMock,
      turmaConquistaRepoMock
    );
  });

  describe('Atribuição de Conquista ao Aluno', () => {
    it('deve atribuir conquista ao aluno com dataConquista preenchida quando status for CONQUISTADO', async () => {
      alunoServiceMock.buscarPorIdEProfessor.mockResolvedValue({
        id: alunoIdMock,
        turma: { id: turmaIdMock },
      });
      turmaConquistaRepoMock.findOneBy.mockResolvedValue({
        id: 1,
        turmaId: turmaIdMock,
        conquistaId: conquistaIdMock,
      });
      repositorioMock.findOneBy.mockResolvedValue(null);

      const resultado = await service.atribuirParaProfessor(
        { alunoId: alunoIdMock, conquistaId: conquistaIdMock, status: StatusConquista.CONQUISTADO },
        professorIdMock
      );

      expect(turmaConquistaRepoMock.findOneBy).toHaveBeenCalledWith({
        turmaId: turmaIdMock,
        conquistaId: conquistaIdMock,
      });
      expect(resultado.status).toBe(StatusConquista.CONQUISTADO);
      expect(resultado.dataConquista).toBeInstanceOf(Date);
    });

    it('deve atribuir conquista com status padrão NAO_TRABALHADO e dataConquista nula', async () => {
      alunoServiceMock.buscarPorIdEProfessor.mockResolvedValue({
        id: alunoIdMock,
        turma: { id: turmaIdMock },
      });
      turmaConquistaRepoMock.findOneBy.mockResolvedValue({
        id: 1,
        turmaId: turmaIdMock,
        conquistaId: conquistaIdMock,
      });
      repositorioMock.findOneBy.mockResolvedValue(null);

      const resultado = await service.atribuirParaProfessor(
        { alunoId: alunoIdMock, conquistaId: conquistaIdMock },
        professorIdMock
      );

      expect(resultado.status).toBe(StatusConquista.NAO_TRABALHADO);
      expect(resultado.dataConquista).toBeNull();
    });

    it('deve lançar AppError 400 quando a conquista não pertencer à turma do aluno', async () => {
      alunoServiceMock.buscarPorIdEProfessor.mockResolvedValue({
        id: alunoIdMock,
        turma: { id: turmaIdMock },
      });
      turmaConquistaRepoMock.findOneBy.mockResolvedValue(null);

      await expect(
        service.atribuirParaProfessor(
          { alunoId: alunoIdMock, conquistaId: 99 },
          professorIdMock
        )
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'Esta conquista não está atribuída à turma do aluno.',
      });

      expect(repositorioMock.save).not.toHaveBeenCalled();
    });

    it('deve lançar AppError 409 quando a conquista já estiver atribuída ao aluno', async () => {
      alunoServiceMock.buscarPorIdEProfessor.mockResolvedValue({
        id: alunoIdMock,
        turma: { id: turmaIdMock },
      });
      turmaConquistaRepoMock.findOneBy.mockResolvedValue({
        id: 1,
        turmaId: turmaIdMock,
        conquistaId: conquistaIdMock,
      });
      repositorioMock.findOneBy.mockResolvedValue({
        id: 1,
        alunoId: alunoIdMock,
        conquistaId: conquistaIdMock,
      });

      await expect(
        service.atribuirParaProfessor(
          { alunoId: alunoIdMock, conquistaId: conquistaIdMock },
          professorIdMock
        )
      ).rejects.toMatchObject({
        statusCode: 409,
        message: 'Esta conquista já foi atribuída ao aluno.',
      });

      expect(repositorioMock.save).not.toHaveBeenCalled();
    });
  });

  describe('Atualização de Status e dataConquista', () => {
    it('deve preencher dataConquista automaticamente ao mudar para CONQUISTADO', async () => {
      const registroExistente = {
        id: 1,
        alunoId: alunoIdMock,
        conquistaId: conquistaIdMock,
        status: StatusConquista.EM_DESENVOLVIMENTO,
        dataConquista: null,
      } as unknown as AlunoConquista;

      repositorioMock.findOne.mockResolvedValue(registroExistente);

      const resultado = await service.atualizarParaProfessor(
        1,
        { status: StatusConquista.CONQUISTADO, observacao: 'Dominou o tema' },
        professorIdMock
      );

      expect(resultado.status).toBe(StatusConquista.CONQUISTADO);
      expect(resultado.dataConquista).toBeInstanceOf(Date);
      expect(resultado.observacao).toBe('Dominou o tema');
    });

    it('deve limpar dataConquista para null ao mudar de CONQUISTADO para outro status', async () => {
      const registroExistente = {
        id: 1,
        alunoId: alunoIdMock,
        conquistaId: conquistaIdMock,
        status: StatusConquista.CONQUISTADO,
        dataConquista: new Date('2026-10-01'),
      } as unknown as AlunoConquista;

      repositorioMock.findOne.mockResolvedValue(registroExistente);

      const resultado = await service.atualizarParaProfessor(
        1,
        { status: StatusConquista.EM_DESENVOLVIMENTO_AVANCADO },
        professorIdMock
      );

      expect(resultado.status).toBe(StatusConquista.EM_DESENVOLVIMENTO_AVANCADO);
      expect(resultado.dataConquista).toBeNull();
    });
  });

  describe('Listagem e Remoção', () => {
    it('deve listar conquistas do aluno validando acesso da professora', async () => {
      alunoServiceMock.buscarPorIdEProfessor.mockResolvedValue({ id: alunoIdMock });
      repositorioMock.find.mockResolvedValue([{ id: 1, alunoId: alunoIdMock }]);

      const resultado = await service.listarPorAluno(alunoIdMock, professorIdMock);

      expect(alunoServiceMock.buscarPorIdEProfessor).toHaveBeenCalledWith(alunoIdMock, professorIdMock);
      expect(resultado).toHaveLength(1);
    });

    it('deve lançar AppError 404 ao buscar conquista de aluno de outra professora', async () => {
      repositorioMock.findOne.mockResolvedValue(null);

      await expect(service.buscarPorIdEProfessor(1, 999)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('deve remover o registro de conquista do aluno', async () => {
      repositorioMock.findOne.mockResolvedValue({ id: 1 });
      repositorioMock.delete.mockResolvedValue({ affected: 1 });

      await service.removerParaProfessor(1, professorIdMock);

      expect(repositorioMock.delete).toHaveBeenCalledWith(1);
    });
  });
});
