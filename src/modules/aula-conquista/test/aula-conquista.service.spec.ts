import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { AulaConquistaService } from '../aula-conquista.service';
import { AulaConquista } from '../aula-conquista.entity';
import { Aula } from '../../aula/aula.entity';
import { Conquista } from '../../conquista/conquista.entity';
import { AppError } from '../../../common/utils/app-error';

/**
 * Testes unitários para o AulaConquistaService.
 * 
 * @author caiolaurindo
 */
describe('AulaConquistaService (Testes Unitários)', () => {
  let aulaConquistaService: AulaConquistaService;
  let aulaConquistaRepositorioMock: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  let aulaRepositorioMock: {
    findOne: jest.Mock;
  };
  let conquistaRepositorioMock: {
    findOneBy: jest.Mock;
  };

  const professorIdMock = 1;
  const aulaIdMock = 10;
  const conquistaIdMock = 5;

  const aulaMock: Aula = {
    id: aulaIdMock,
    nome: 'Animals and Pets',
    assunto: 'Vocabulário de animais domésticos',
    data: '2026-10-26',
    turma: { id: 1 } as any,
    professor: { id: professorIdMock } as any,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
  };

  const conquistaMock: Conquista = {
    id: conquistaIdMock,
    nome: 'Identificar animais em inglês',
    descricao: 'Capacidade de apontar e dizer o nome de animais domésticos',
    criadoEm: new Date(),
    atualizadoEm: new Date(),
  };

  const aulaConquistaMock: AulaConquista = {
    id: 1,
    aula: aulaMock,
    conquista: conquistaMock,
    meta: 'Identificar corretamente ao menos 4 animais na atividade lúdica',
    criadoEm: new Date(),
    atualizadoEm: new Date(),
  };

  beforeEach(() => {
    aulaConquistaRepositorioMock = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    aulaRepositorioMock = {
      findOne: jest.fn(),
    };

    conquistaRepositorioMock = {
      findOneBy: jest.fn(),
    };

    aulaConquistaService = new AulaConquistaService(
      aulaConquistaRepositorioMock as any,
      aulaRepositorioMock as any,
      conquistaRepositorioMock as any
    );
  });

  describe('Definição de Conquistas/Metas na Aula', () => {
    it('deve vincular uma conquista à aula definindo a meta esperada com sucesso', async () => {
      const dto = {
        aulaId: aulaIdMock,
        conquistaId: conquistaIdMock,
        meta: 'Identificar corretamente ao menos 4 animais na atividade lúdica',
      };

      aulaRepositorioMock.findOne.mockResolvedValue(aulaMock);
      conquistaRepositorioMock.findOneBy.mockResolvedValue(conquistaMock);
      aulaConquistaRepositorioMock.findOne.mockResolvedValue(null);
      aulaConquistaRepositorioMock.create.mockReturnValue(aulaConquistaMock);
      aulaConquistaRepositorioMock.save.mockResolvedValue(aulaConquistaMock);

      const resultado = await aulaConquistaService.vincularConquistaAAula(dto, professorIdMock);

      expect(aulaRepositorioMock.findOne).toHaveBeenCalledWith({
        where: { id: aulaIdMock, professor: { id: professorIdMock } },
      });
      expect(conquistaRepositorioMock.findOneBy).toHaveBeenCalledWith({ id: conquistaIdMock });
      expect(aulaConquistaRepositorioMock.create).toHaveBeenCalledWith({
        aula: { id: dto.aulaId },
        conquista: { id: dto.conquistaId },
        meta: dto.meta,
      });
      expect(aulaConquistaRepositorioMock.save).toHaveBeenCalledWith(aulaConquistaMock);
      expect(resultado).toEqual(aulaConquistaMock);
    });

    it('deve lançar AppError 404 se a aula não for encontrada ou não pertencer à professora', async () => {
      const dto = {
        aulaId: 999,
        conquistaId: conquistaIdMock,
      };

      aulaRepositorioMock.findOne.mockResolvedValue(null);

      await expect(
        aulaConquistaService.vincularConquistaAAula(dto, professorIdMock)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Aula não encontrada ou acesso não autorizado.',
      });

      expect(aulaConquistaRepositorioMock.save).not.toHaveBeenCalled();
    });

    it('deve lançar AppError 404 se a conquista não existir', async () => {
      const dto = {
        aulaId: aulaIdMock,
        conquistaId: 999,
      };

      aulaRepositorioMock.findOne.mockResolvedValue(aulaMock);
      conquistaRepositorioMock.findOneBy.mockResolvedValue(null);

      await expect(
        aulaConquistaService.vincularConquistaAAula(dto, professorIdMock)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Conquista não encontrada.',
      });
    });

    it('deve lançar AppError 409 se a conquista já tiver sido vinculada àquela aula', async () => {
      const dto = {
        aulaId: aulaIdMock,
        conquistaId: conquistaIdMock,
      };

      aulaRepositorioMock.findOne.mockResolvedValue(aulaMock);
      conquistaRepositorioMock.findOneBy.mockResolvedValue(conquistaMock);
      aulaConquistaRepositorioMock.findOne.mockResolvedValue(aulaConquistaMock);

      await expect(
        aulaConquistaService.vincularConquistaAAula(dto, professorIdMock)
      ).rejects.toMatchObject({
        statusCode: 409,
        message: 'Esta conquista já foi definida como meta para esta aula.',
      });
    });
  });

  describe('Consulta de Metas/Conquistas da Aula', () => {
    it('deve listar todas as conquistas e metas definidas para a aula', async () => {
      aulaRepositorioMock.findOne.mockResolvedValue(aulaMock);
      aulaConquistaRepositorioMock.find.mockResolvedValue([aulaConquistaMock]);

      const resultado = await aulaConquistaService.listarPorAula(aulaIdMock, professorIdMock);

      expect(aulaRepositorioMock.findOne).toHaveBeenCalledWith({
        where: { id: aulaIdMock, professor: { id: professorIdMock } },
      });
      expect(aulaConquistaRepositorioMock.find).toHaveBeenCalledWith({
        where: { aula: { id: aulaIdMock } },
        relations: ['conquista'],
        order: { criadoEm: 'ASC' },
      });
      expect(resultado).toEqual([aulaConquistaMock]);
    });

    it('deve lançar AppError 404 ao listar caso a aula não pertença à professora', async () => {
      aulaRepositorioMock.findOne.mockResolvedValue(null);

      await expect(
        aulaConquistaService.listarPorAula(999, professorIdMock)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Aula não encontrada ou acesso não autorizado.',
      });
    });

    it('deve buscar uma aula_conquista por ID', async () => {
      aulaConquistaRepositorioMock.findOne.mockResolvedValue(aulaConquistaMock);

      const resultado = await aulaConquistaService.buscarPorIdEProfessor(1, professorIdMock);

      expect(aulaConquistaRepositorioMock.findOne).toHaveBeenCalledWith({
        where: {
          id: 1,
          aula: { professor: { id: professorIdMock } },
        },
        relations: ['aula', 'conquista'],
      });
      expect(resultado).toEqual(aulaConquistaMock);
    });

    it('deve lançar AppError 404 caso a aula_conquista não exista', async () => {
      aulaConquistaRepositorioMock.findOne.mockResolvedValue(null);

      await expect(
        aulaConquistaService.buscarPorIdEProfessor(999, professorIdMock)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Registro de conquista da aula não encontrado ou acesso não autorizado.',
      });
    });
  });

  describe('Atualização e Exclusão', () => {
    it('deve atualizar a meta da conquista da aula com sucesso', async () => {
      const novaMeta = { meta: 'Meta revisada para 5 animais' };
      const aulaConquistaAtualizada = { ...aulaConquistaMock, meta: novaMeta.meta };

      aulaConquistaRepositorioMock.findOne
        .mockResolvedValueOnce(aulaConquistaMock)
        .mockResolvedValueOnce(aulaConquistaAtualizada);

      aulaConquistaRepositorioMock.update.mockResolvedValue({ affected: 1 });

      const resultado = await aulaConquistaService.atualizarMeta(1, novaMeta, professorIdMock);

      expect(aulaConquistaRepositorioMock.update).toHaveBeenCalledWith(1, { meta: novaMeta.meta });
      expect(resultado.meta).toBe(novaMeta.meta);
    });

    it('deve remover a conquista vinculada à aula com sucesso', async () => {
      aulaConquistaRepositorioMock.findOne.mockResolvedValue(aulaConquistaMock);
      aulaConquistaRepositorioMock.delete.mockResolvedValue({ affected: 1 });

      await aulaConquistaService.removerDaAula(1, professorIdMock);

      expect(aulaConquistaRepositorioMock.delete).toHaveBeenCalledWith(1);
    });
  });
});

