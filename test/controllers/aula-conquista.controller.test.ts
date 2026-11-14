import { AulaConquistaController } from '../../src/controllers/aula-conquista.controller';
import { AulaConquistaService } from '../../src/services/aula-conquista.service';
import { AppError } from '../../src/utils/app-error';

describe('AulaConquistaController', () => {
  let controller: AulaConquistaController;
  let service: jest.Mocked<AulaConquistaService>;

  const professorId = 10;

  const mockResponse = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  });

  beforeEach(() => {
    service = {
      listarPorAula: jest.fn(),
      buscarPorIdEProfessor: jest.fn(),
      vincularConquistaAAula: jest.fn(),
      atualizarMeta: jest.fn(),
      removerDaAula: jest.fn(),
    } as unknown as jest.Mocked<AulaConquistaService>;

    controller = new AulaConquistaController(service);
  });

  describe('listar', () => {
    it('deve listar as conquistas de uma aula', async () => {
      const conquistas = [{ id: 1, aulaId: 5 }];
      const req = {
        query: { aulaId: '5' },
        usuario: { sub: professorId },
      } as any;
      const res = mockResponse();

      service.listarPorAula.mockResolvedValue(conquistas as any);

      await controller.listar(req, res as any);

      expect(service.listarPorAula).toHaveBeenCalledWith(5, professorId);
      expect(res.json).toHaveBeenCalledWith(conquistas);
    });

    it('deve lançar AppError quando aulaId estiver ausente', async () => {
      const req = {
        query: {},
        usuario: { sub: professorId },
      } as any;
      const res = mockResponse();

      await expect(controller.listar(req, res as any)).rejects.toThrow(
        AppError
      );

      expect(service.listarPorAula).not.toHaveBeenCalled();
    });

    it('deve lançar AppError quando aulaId for inválido', async () => {
      const req = {
        query: { aulaId: 'abc' },
        usuario: { sub: professorId },
      } as any;
      const res = mockResponse();

      await expect(controller.listar(req, res as any)).rejects.toThrow(
        AppError
      );

      expect(service.listarPorAula).not.toHaveBeenCalled();
    });
    it('deve lançar AppError quando aulaId for zero', async () => {
  const req = {
    query: { aulaId: '0' },
    usuario: { sub: professorId },
  } as any;
  const res = mockResponse();

  await expect(controller.listar(req, res as any)).rejects.toThrow(AppError);

  expect(service.listarPorAula).not.toHaveBeenCalled();
});
    it('deve lançar AppError quando aulaId for negativo', async () => {
    const req = {
        query: { aulaId: '-5' },
        usuario: { sub: professorId },
    } as any;
    const res = mockResponse();

    await expect(controller.listar(req, res as any)).rejects.toThrow(AppError);

    expect(service.listarPorAula).not.toHaveBeenCalled();
    });

    it('deve lançar AppError quando aulaId for decimal', async () => {
    const req = {
        query: { aulaId: '2.5' },
        usuario: { sub: professorId },
    } as any;
    const res = mockResponse();

    await expect(controller.listar(req, res as any)).rejects.toThrow(AppError);

    expect(service.listarPorAula).not.toHaveBeenCalled();
    });
  });

  describe('buscarPorId', () => {
    it('deve buscar uma conquista vinculada pelo ID', async () => {
      const conquista = { id: 3, aulaId: 5 };
      const req = {
        params: { id: '3' },
        usuario: { sub: professorId },
      } as any;
      const res = mockResponse();

      service.buscarPorIdEProfessor.mockResolvedValue(conquista as any);

      await controller.buscarPorId(req, res as any);

      expect(service.buscarPorIdEProfessor).toHaveBeenCalledWith(
        3,
        professorId
      );
      expect(res.json).toHaveBeenCalledWith(conquista);
    });
  });

  describe('vincular', () => {
    it('deve vincular uma conquista e retornar status 201', async () => {
      const body = { aulaId: 5, conquistaId: 2 };
      const resultado = { id: 1, ...body };
      const req = {
        body,
        usuario: { sub: professorId },
      } as any;
      const res = mockResponse();

      service.vincularConquistaAAula.mockResolvedValue(resultado as any);

      await controller.vincular(req, res as any);

      expect(service.vincularConquistaAAula).toHaveBeenCalledWith(
        body,
        professorId
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(resultado);
    });
  });

  describe('atualizar', () => {
    it('deve atualizar a meta de uma conquista vinculada', async () => {
      const body = { meta: 10 };
      const resultado = { id: 3, ...body };
      const req = {
        params: { id: '3' },
        body,
        usuario: { sub: professorId },
      } as any;
      const res = mockResponse();

      service.atualizarMeta.mockResolvedValue(resultado as any);

      await controller.atualizar(req, res as any);

      expect(service.atualizarMeta).toHaveBeenCalledWith(
        3,
        body,
        professorId
      );
      expect(res.json).toHaveBeenCalledWith(resultado);
    });
  });

  describe('remover', () => {
    it('deve remover uma conquista vinculada e retornar status 204', async () => {
      const req = {
        params: { id: '3' },
        usuario: { sub: professorId },
      } as any;
      const res = mockResponse();

      service.removerDaAula.mockResolvedValue(undefined);

      await controller.remover(req, res as any);

      expect(service.removerDaAula).toHaveBeenCalledWith(3, professorId);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });
});
