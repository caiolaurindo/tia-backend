import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { AulaService } from '../aula.service';
import { Aula } from '../aula.entity';
import { Turma } from '../../turma/turma.entity';
import { AppError } from '../../../common/utils/app-error';

/**
 * Testes unitários para o AulaService.
 * 
 * @author caiolaurindo
 */
describe('AulaService (Testes Unitários)', () => {
  let aulaService: AulaService;
  let aulaRepositorioMock: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  let turmaRepositorioMock: {
    findOne: jest.Mock;
  };

  const professorIdMock = 1;
  const turmaIdMock = 10;

  const turmaMock: Turma = {
    id: turmaIdMock,
    nome: 'Turma Kids A1',
    serie: '1º Ano',
    anoLetivo: 2026,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    professor: { id: professorIdMock } as any,
  };

  const aulaMock: Aula = {
    id: 1,
    nome: 'Colors and Animals',
    assunto: 'Vocabulário de cores e animais em inglês',
    data: '2026-10-26',
    turma: turmaMock,
    professor: { id: professorIdMock } as any,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
  };

  beforeEach(() => {
    aulaRepositorioMock = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    turmaRepositorioMock = {
      findOne: jest.fn(),
    };

    aulaService = new AulaService(
      aulaRepositorioMock as any,
      turmaRepositorioMock as any
    );
  });

  describe('Criação de Aulas', () => {
    it('deve criar uma aula vinculada à turma e à professora com sucesso', async () => {
      const dto = {
        nome: 'Colors and Animals',
        assunto: 'Vocabulário de cores e animais em inglês',
        data: '2026-10-26',
        turmaId: turmaIdMock,
      };

      turmaRepositorioMock.findOne.mockResolvedValue(turmaMock);
      aulaRepositorioMock.create.mockReturnValue(aulaMock);
      aulaRepositorioMock.save.mockResolvedValue(aulaMock);

      const resultado = await aulaService.criarParaProfessor(dto, professorIdMock);

      expect(turmaRepositorioMock.findOne).toHaveBeenCalledWith({
        where: { id: turmaIdMock, professor: { id: professorIdMock } },
      });
      expect(aulaRepositorioMock.create).toHaveBeenCalledWith({
        nome: dto.nome,
        assunto: dto.assunto,
        data: dto.data,
        turma: { id: dto.turmaId },
        professor: { id: professorIdMock },
      });
      expect(aulaRepositorioMock.save).toHaveBeenCalledWith(aulaMock);
      expect(resultado).toEqual(aulaMock);
    });

    it('deve lançar AppError 404 se a turma informada não existir ou não pertencer à professora', async () => {
      const dto = {
        nome: 'Colors and Animals',
        assunto: 'Vocabulário de cores e animais em inglês',
        data: '2026-10-26',
        turmaId: 999,
      };

      turmaRepositorioMock.findOne.mockResolvedValue(null);

      await expect(
        aulaService.criarParaProfessor(dto, professorIdMock)
      ).rejects.toThrow(AppError);

      await expect(
        aulaService.criarParaProfessor(dto, professorIdMock)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Turma não encontrada ou acesso não autorizado.',
      });

      expect(aulaRepositorioMock.create).not.toHaveBeenCalled();
      expect(aulaRepositorioMock.save).not.toHaveBeenCalled();
    });
  });

  describe('Listagem e Consulta com Isolamento por Professora', () => {
    it('deve listar todas as aulas da professora', async () => {
      aulaRepositorioMock.find.mockResolvedValue([aulaMock]);

      const resultado = await aulaService.listarPorProfessor(professorIdMock);

      expect(aulaRepositorioMock.find).toHaveBeenCalledWith({
        where: { professor: { id: professorIdMock } },
        relations: ['turma'],
        order: { data: 'DESC' },
      });
      expect(resultado).toHaveLength(1);
      expect(resultado[0].nome).toBe('Colors and Animals');
    });

    it('deve listar as aulas de uma turma específica da professora', async () => {
      aulaRepositorioMock.find.mockResolvedValue([aulaMock]);

      const resultado = await aulaService.listarPorTurmaEProfessor(turmaIdMock, professorIdMock);

      expect(aulaRepositorioMock.find).toHaveBeenCalledWith({
        where: {
          turma: { id: turmaIdMock },
          professor: { id: professorIdMock },
        },
        relations: ['turma'],
        order: { data: 'DESC' },
      });
      expect(resultado).toEqual([aulaMock]);
    });

    it('deve buscar uma aula por ID caso ela pertença à professora', async () => {
      aulaRepositorioMock.findOne.mockResolvedValue(aulaMock);

      const resultado = await aulaService.buscarPorIdEProfessor(1, professorIdMock);

      expect(aulaRepositorioMock.findOne).toHaveBeenCalledWith({
        where: { id: 1, professor: { id: professorIdMock } },
        relations: ['turma'],
      });
      expect(resultado).toEqual(aulaMock);
    });

    it('deve lançar AppError 404 caso a aula não seja encontrada ou seja de outra professora', async () => {
      aulaRepositorioMock.findOne.mockResolvedValue(null);

      await expect(
        aulaService.buscarPorIdEProfessor(999, professorIdMock)
      ).rejects.toThrow(AppError);

      await expect(
        aulaService.buscarPorIdEProfessor(999, professorIdMock)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Aula não encontrada ou acesso não autorizado.',
      });
    });
  });

  describe('Atualização de Aulas', () => {
    it('deve atualizar os dados da aula com sucesso', async () => {
      const dadosAtualizados = {
        nome: 'Numbers and Colors',
        assunto: 'Vocabulário ampliado',
      };

      const aulaAtualizadaMock = {
        ...aulaMock,
        ...dadosAtualizados,
      };

      aulaRepositorioMock.findOne
        .mockResolvedValueOnce(aulaMock)
        .mockResolvedValueOnce(aulaAtualizadaMock);

      aulaRepositorioMock.update.mockResolvedValue({ affected: 1 });

      const resultado = await aulaService.atualizarParaProfessor(1, dadosAtualizados, professorIdMock);

      expect(aulaRepositorioMock.update).toHaveBeenCalledWith(1, dadosAtualizados);
      expect(resultado.nome).toBe('Numbers and Colors');
    });

    it('deve atualizar a turma da aula validando a posse da nova turma', async () => {
      const novaTurmaId = 20;
      const dadosAtualizados = {
        turmaId: novaTurmaId,
      };

      const novaTurmaMock = { ...turmaMock, id: novaTurmaId };
      turmaRepositorioMock.findOne.mockResolvedValue(novaTurmaMock);

      aulaRepositorioMock.findOne
        .mockResolvedValueOnce(aulaMock)
        .mockResolvedValueOnce({ ...aulaMock, turma: novaTurmaMock });

      aulaRepositorioMock.update.mockResolvedValue({ affected: 1 });

      const resultado = await aulaService.atualizarParaProfessor(1, dadosAtualizados, professorIdMock);

      expect(turmaRepositorioMock.findOne).toHaveBeenCalledWith({
        where: { id: novaTurmaId, professor: { id: professorIdMock } },
      });
      expect(aulaRepositorioMock.update).toHaveBeenCalledWith(1, {
        turma: { id: novaTurmaId },
      });
      expect(resultado.turma.id).toBe(novaTurmaId);
    });
  });

  describe('Exclusão de Aulas', () => {
    it('deve remover a aula caso pertença à professora', async () => {
      aulaRepositorioMock.findOne.mockResolvedValue(aulaMock);
      aulaRepositorioMock.delete.mockResolvedValue({ affected: 1 });

      await aulaService.removerParaProfessor(1, professorIdMock);

      expect(aulaRepositorioMock.findOne).toHaveBeenCalledWith({
        where: { id: 1, professor: { id: professorIdMock } },
        relations: ['turma'],
      });
      expect(aulaRepositorioMock.delete).toHaveBeenCalledWith(1);
    });
  });
});

