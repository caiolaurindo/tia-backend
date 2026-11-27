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

  describe('Listagem Geral e por Professor', () => {
    it('deve listar registros filtrando pela professora quando professorId for informado', async () => {
      const registrosSimulados = [{ id: 1, alunoId: alunoIdMock, aulaId: aulaIdMock }];
      registroRepoMock.find.mockResolvedValue(registrosSimulados);

      const resultado = await service.listarTodos(professorIdMock);

      expect(registroRepoMock.find).toHaveBeenCalledWith({
        where: { aluno: { turma: { professor: { id: professorIdMock } } } },
        relations: { aluno: true, aula: true, conquista: true },
        order: { data: 'DESC' },
      });
      expect(resultado).toEqual(registrosSimulados);
    });

    it('deve listar todos os registros sem filtro quando professorId for undefined', async () => {
      const registrosSimulados = [{ id: 1 }, { id: 2 }];
      registroRepoMock.find.mockResolvedValue(registrosSimulados);

      const resultado = await service.listarTodos();

      expect(registroRepoMock.find).toHaveBeenCalledWith();
      expect(resultado).toEqual(registrosSimulados);
    });
  });

  describe('Criação de Registros', () => {
    it('deve criar um registro quando aluno e aula pertencerem à mesma turma da professora', async () => {
      alunoRepoMock.findOne.mockResolvedValue({ id: alunoIdMock, turma: { id: turmaIdMock } });
      aulaRepoMock.findOne.mockResolvedValue({ id: aulaIdMock, turma: { id: turmaIdMock } });

      const dto = {
        alunoId: alunoIdMock,
        aulaId: aulaIdMock,
        data: '2026-10-26',
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
      expect(registroRepoMock.save).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual(expect.objectContaining({ alunoId: alunoIdMock, aulaId: aulaIdMock }));
    });

    it('deve criar registro sem validação de professor caso professorId seja undefined', async () => {
      const dto = {
        alunoId: alunoIdMock,
        aulaId: aulaIdMock,
        data: '2026-10-26',
        participacao: 'Boa',
      };

      const resultado = await service.criar(dto);

      expect(alunoRepoMock.findOne).not.toHaveBeenCalled();
      expect(aulaRepoMock.findOne).not.toHaveBeenCalled();
      expect(registroRepoMock.save).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual(expect.objectContaining({ alunoId: alunoIdMock, aulaId: aulaIdMock }));
    });

    it('deve criar registro mesmo sem repositórios opcionais de aluno e aula injetados', async () => {
      const servicoSemReposAuxiliares = new RegistroService(registroRepoMock);
      const dto = {
        alunoId: alunoIdMock,
        aulaId: aulaIdMock,
        data: '2026-10-26',
      };

      const resultado = await servicoSemReposAuxiliares.criar(dto, professorIdMock);

      expect(registroRepoMock.save).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual(expect.objectContaining({ alunoId: alunoIdMock, aulaId: aulaIdMock }));
    });

    it('deve lançar AppError 404 se o aluno não existir ou não pertencer à professora', async () => {
      alunoRepoMock.findOne.mockResolvedValue(null);

      await expect(
        service.criar({ alunoId: 999, aulaId: aulaIdMock, data: '2026-10-26' }, professorIdMock)
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
        service.criar({ alunoId: alunoIdMock, aulaId: 999, data: '2026-10-26' }, professorIdMock)
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
        service.criar({ alunoId: alunoIdMock, aulaId: aulaIdMock, data: '2026-10-26' }, professorIdMock)
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
          aluno: { turma: { professor: { id: professorIdMock } } },
        },
        relations: { aula: true, conquista: true },
        order: { data: 'DESC' },
      });
      expect(resultado).toHaveLength(1);
    });

    it('deve consultar registros por aluno sem validar professor quando professorId for undefined', async () => {
      registroRepoMock.find.mockResolvedValue([{ id: 1, alunoId: alunoIdMock }]);

      const resultado = await service.buscarPorAluno(alunoIdMock);

      expect(alunoRepoMock.findOne).not.toHaveBeenCalled();
      expect(registroRepoMock.find).toHaveBeenCalledWith({
        where: { alunoId: alunoIdMock },
        relations: { aula: true, conquista: true },
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
        relations: { aluno: true, conquista: true },
        order: { data: 'DESC' },
      });
      expect(resultado).toHaveLength(1);
    });

    it('deve consultar registros por aula sem validar professor quando professorId for undefined', async () => {
      registroRepoMock.find.mockResolvedValue([{ id: 1, aulaId: aulaIdMock }]);

      const resultado = await service.buscarPorAula(aulaIdMock);

      expect(aulaRepoMock.findOne).not.toHaveBeenCalled();
      expect(registroRepoMock.find).toHaveBeenCalledWith({
        where: { aulaId: aulaIdMock },
        relations: { aluno: true, conquista: true },
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
      expect(registroRepoMock.save).toHaveBeenCalled();
      expect(resultado).toEqual(expect.objectContaining({ alunoId: 11, participacao: 'Boa' }));
    });

    it('deve atualizar registro sem revalidar vínculos se nem alunoId nem aulaId forem informados', async () => {
      const registroExistente = { id: 1, alunoId: alunoIdMock, aulaId: aulaIdMock, participacao: 'Regular' };
      registroRepoMock.findOne.mockResolvedValue(registroExistente);

      const resultado = await service.atualizar(1, { participacao: 'Excelente' }, professorIdMock);

      expect(alunoRepoMock.findOne).not.toHaveBeenCalled();
      expect(aulaRepoMock.findOne).not.toHaveBeenCalled();
      expect(registroRepoMock.save).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual(expect.objectContaining({ participacao: 'Excelente' }));
    });

    it('deve remover registro existente da professora', async () => {
      const registroExistente = { id: 1, alunoId: alunoIdMock, aulaId: aulaIdMock };
      registroRepoMock.findOne.mockResolvedValue(registroExistente);
      registroRepoMock.remove.mockResolvedValue(undefined);

      await service.remover(1, professorIdMock);

      expect(registroRepoMock.remove).toHaveBeenCalledWith(registroExistente);
    });
  });

  describe('Aula opcional e conquista', () => {
    it('deve criar registro sem aula, validando só o aluno', async () => {
      alunoRepoMock.findOne.mockResolvedValue({ id: alunoIdMock, turma: { id: turmaIdMock } });

      const resultado = await service.criar(
        { alunoId: alunoIdMock, data: '2026-11-27', participacao: 'Boa' },
        professorIdMock
      );

      expect(aulaRepoMock.findOne).not.toHaveBeenCalled();
      expect(registroRepoMock.save).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual(expect.objectContaining({ alunoId: alunoIdMock }));
    });

    it('deve criar registro com conquista vinculada à turma do aluno', async () => {
      const turmaConquistaRepoMock: any = {
        findOneBy: jest.fn().mockResolvedValue({ id: 1 } as never),
      };
      const svc = new RegistroService(registroRepoMock, alunoRepoMock, aulaRepoMock, turmaConquistaRepoMock);
      alunoRepoMock.findOne.mockResolvedValue({ id: alunoIdMock, turma: { id: turmaIdMock } });

      await svc.criar({ alunoId: alunoIdMock, conquistaId: 7, data: '2026-11-27' }, professorIdMock);

      expect(turmaConquistaRepoMock.findOneBy).toHaveBeenCalledWith({
        turmaId: turmaIdMock,
        conquistaId: 7,
      });
      expect(registroRepoMock.save).toHaveBeenCalledTimes(1);
    });

    it('deve lançar AppError 400 se a conquista não estiver vinculada à turma do aluno', async () => {
      const turmaConquistaRepoMock: any = {
        findOneBy: jest.fn().mockResolvedValue(null as never),
      };
      const svc = new RegistroService(registroRepoMock, alunoRepoMock, aulaRepoMock, turmaConquistaRepoMock);
      alunoRepoMock.findOne.mockResolvedValue({ id: alunoIdMock, turma: { id: turmaIdMock } });

      await expect(
        svc.criar({ alunoId: alunoIdMock, conquistaId: 7, data: '2026-11-27' }, professorIdMock)
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'Esta conquista não está vinculada à turma do aluno.',
      });
      expect(registroRepoMock.save).not.toHaveBeenCalled();
    });
  });
});