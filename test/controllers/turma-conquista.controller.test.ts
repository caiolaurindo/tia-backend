import { TurmaConquistaController } from '../../src/controllers/turma-conquista.controller';
import { TurmaConquistaService } from '../../src/services/turma-conquista.service';

describe('TurmaConquistaController', () => {
  let controller: TurmaConquistaController;
  let service: jest.Mocked<TurmaConquistaService>;

  const professorId = 10;

  const mockResponse = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  });

  beforeEach(() => {
    service = {
      listarConquistasDaTurma: jest.fn(),
      vincularConquista: jest.fn(),
      desvincularConquista: jest.fn(),
    } as unknown as jest.Mocked<TurmaConquistaService>;

    controller = new TurmaConquistaController(service);
  });

  describe('listar', () => {
    it('deve listar as conquistas de uma turma', async () => {
      const conquistas = [
        { id: 1, nome: 'Primeira conquista' },
        { id: 2, nome: 'Segunda conquista' },
      ];

      const req = {
        params: { turmaId: '5' },
        usuario: { sub: professorId },
      } as any;

      const res = mockResponse();

      service.listarConquistasDaTurma.mockResolvedValue(conquistas as any);

      await controller.listar(req, res as any);

      expect(service.listarConquistasDaTurma).toHaveBeenCalledWith(
        5,
        professorId
      );
      expect(res.json).toHaveBeenCalledWith(conquistas);
    });
  });

  describe('vincular', () => {
    it('deve vincular uma conquista à turma e retornar status 201', async () => {
      const resultado = {
        turmaId: 5,
        conquistaId: 3,
      };

      const req = {
        params: { turmaId: '5' },
        body: { conquistaId: 3 },
        usuario: { sub: professorId },
      } as any;

      const res = mockResponse();

      service.vincularConquista.mockResolvedValue(resultado as any);

      await controller.vincular(req, res as any);

      expect(service.vincularConquista).toHaveBeenCalledWith(
        5,
        3,
        professorId
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(resultado);
    });
  });

  describe('desvincular', () => {
    it('deve desvincular uma conquista da turma e retornar status 204', async () => {
      const req = {
        params: {
          turmaId: '5',
          conquistaId: '3',
        },
        usuario: { sub: professorId },
      } as any;

      const res = mockResponse();

      service.desvincularConquista.mockResolvedValue(undefined as any);

      await controller.desvincular(req, res as any);

      expect(service.desvincularConquista).toHaveBeenCalledWith(
        5,
        3,
        professorId
      );
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });
});
