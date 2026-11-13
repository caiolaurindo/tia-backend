import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { RegistroService } from '../registro.service';
import { AppError } from '../../utils/app-error';

describe('RegistroService (Testes Unitários)', () => {
  let service: RegistroService;
  let registroRepoMock: any;
  let alunoRepoMock: any;
  let aulaRepoMock: any;

  const professorIdMock = 1;
  const turmaIdMock = 5;
  const alunoIdMock = 10;
  const aulaIdMock = 20;

  beforeEach(() => {
    registroRepoMock = {
      create: jest.fn((d: any) => d),
      save: jest.fn((d: any) => Promise.resolve({ id: 1, ...d })),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    alunoRepoMock = {
      findOne: jest.fn(),
    };

    aulaRepoMock = {
      findOne: jest.fn(),
    };

    service = new RegistroService(registroRepoMock, alunoRepoMock, aulaRepoMock);
  });

  describe('Criação de Registros', () => {
    it('deve criar um registro quando aluno e aula pertencerem à mesma turma da professora', async () => {
      alunoRepoMock.findOne.mockResolvedValue({ id: alunoIdMock, turma: { id: turmaIdMock } });
      aulaRepoMock.findOne.mockResolvedValue({ id: aulaIdMock, turma: { id: turmaIdMock } });

      const dto = {
        alunoId: alunoIdMock,
        aulaId: aulaIdMock,
        data: new Date('2026-10-26'),
        participacao: 'Excelente',
      };

      const resultado = await service.criar(dto, professorIdMock);

      expect(alunoRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: alunoIdMock, turma: { professor: { id: professorIdMock } } },
        relations: { turma: true },
      });
      expect(aulaRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: aulaIdMock, professor: { id: professorIdMock } },
        relations: { turma: true },
      });
      expect(registroRepoMock.save).toHaveBeenCalled();
      expect(resultado).toEqual(expect.objectContaining({ alunoId: alunoIdMock, aulaId: aulaIdMock }));
    });

    it('deve lançar AppError 404 se o aluno não existir ou não pertencer à professora', async () => {
      alunoRepoMock.findOne.mockResolvedValue(null);

      await expect(
        service.criar({ alunoId: 999, aulaId: aulaIdMock, data: new Date() }, professorIdMock)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Aluno não encontrado ou acesso não autorizado.',
      });

      expect(registroRepoMock.save).not.toHaveBeenCalled();
    });

    it('deve lançar AppError 404 se a aula não existir ou não pertencer à professora', async () => {
      alunoRepoMock.findOne.mockResolvedValue({ id: alunoIdMock, turma: { id: turmaIdMock } });
      aulaRepoMock.findOne.mockResolvedValue(null);

      await expect(
        service.criar({ alunoId: alunoIdMock, aulaId: 999, data: new Date() }, professorIdMock)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Aula não encontrada ou acesso não autorizado.',
      });

      expect(registroRepoMock.save).not.toHaveBeenCalled();
    });

    it('deve lançar AppError 400 quando aluno e aula forem de turmas diferentes', async () => {
      alunoRepoMock.findOne.mockResolvedValue({ id: alunoIdMock, turma: { id: 5 } });
      aulaRepoMock.findOne.mockResolvedValue({ id: aulaIdMock, turma: { id: 6 } });

      await expect(
        service.criar({ alunoId: alunoIdMock, aulaId: aulaIdMock, data: new Date() }, professorIdMock)
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'O aluno e a aula informados pertencem a turmas diferentes.',
      });

      expect(registroRepoMock.save).not.toHaveBeenCalled();
    });
  });

  describe('Consultas por Aluno, Aula e ID', () => {
    it('deve consultar registros por aluno validando posse da professora', async () => {
      alunoRepoMock.findOne.mockResolvedValue({ id: alunoIdMock });
      registroRepoMock.find.mockResolvedValue([{ id: 1, alunoId: alunoIdMock }]);

      const resultado = await service.buscarPorAluno(alunoIdMock, professorIdMock);

      expect(alunoRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: alunoIdMock, turma: { professor: { id: professorIdMock } } },
      });
      expect(registroRepoMock.find).toHaveBeenCalledWith({
        where: {
          alunoId: alunoIdMock,
          aula: { professor: { id: professorIdMock } },
        },
        relations: { aula: true },
        order: { data: 'DESC' },
      });
      expect(resultado).toHaveLength(1);
    });

    it('deve lançar AppError 404 ao consultar registros de aluno de outra professora', async () => {
      alunoRepoMock.findOne.mockResolvedValue(null);

      await expect(service.buscarPorAluno(alunoIdMock, 999)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Aluno não encontrado ou acesso não autorizado.',
      });
    });

    it('deve consultar registros por aula validando posse da professora', async () => {
      aulaRepoMock.findOne.mockResolvedValue({ id: aulaIdMock });
      registroRepoMock.find.mockResolvedValue([{ id: 1, aulaId: aulaIdMock }]);

      const resultado = await service.buscarPorAula(aulaIdMock, professorIdMock);

      expect(aulaRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: aulaIdMock, professor: { id: professorIdMock } },
      });
      expect(registroRepoMock.find).toHaveBeenCalledWith({
        where: {
          aulaId: aulaIdMock,
          aula: { professor: { id: professorIdMock } },
        },
        relations: { aluno: true },
        order: { data: 'DESC' },
      });
      expect(resultado).toHaveLength(1);
    });

    it('deve lançar AppError 404 ao consultar registros de aula de outra professora', async () => {
      aulaRepoMock.findOne.mockResolvedValue(null);

      await expect(service.buscarPorAula(aulaIdMock, 999)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Aula não encontrada ou acesso não autorizado.',
      });
    });

    it('deve lançar AppError 404 ao buscar registro inexistente por ID', async () => {
      registroRepoMock.findOne.mockResolvedValue(null);

      await expect(service.buscarPorId(999, professorIdMock)).rejects.toThrow(AppError);
    });
  });

  describe('Atualização e Remoção de Registros', () => {
    it('deve atualizar registro e validar vínculo caso mude alunoId ou aulaId', async () => {
      const registroExistente = { id: 1, alunoId: alunoIdMock, aulaId: aulaIdMock };
      registroRepoMock.findOne.mockResolvedValue(registroExistente);
      alunoRepoMock.findOne.mockResolvedValue({ id: 11, turma: { id: turmaIdMock } });
      aulaRepoMock.findOne.mockResolvedValue({ id: aulaIdMock, turma: { id: turmaIdMock } });

      const resultado = await service.atualizar(1, { alunoId: 11, participacao: 'Boa' }, professorIdMock);

      expect(alunoRepoMock.findOne).toHaveBeenCalled();
      expect(resultado).toEqual(expect.objectContaining({ alunoId: 11, participacao: 'Boa' }));
    });

    it('deve remover registro existente da professora', async () => {
      const registroExistente = { id: 1, alunoId: alunoIdMock, aulaId: aulaIdMock };
      registroRepoMock.findOne.mockResolvedValue(registroExistente);
      registroRepoMock.remove.mockResolvedValue(undefined);

      await service.remover(1, professorIdMock);

      expect(registroRepoMock.remove).toHaveBeenCalledWith(registroExistente);
    });
  });
});
