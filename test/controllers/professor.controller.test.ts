import { ProfessorController } from '../../src/controllers/professor.controller';
import { ProfessorService } from '../../src/services/professor.service';

describe('ProfessorController', () => {
  let controller: ProfessorController;
  let service: jest.Mocked<ProfessorService>;

  const professorId = 10;

  const mockResponse = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  });

  beforeEach(() => {
    service = {
      cadastrar: jest.fn(),
      login: jest.fn(),
      buscarPorId: jest.fn(),
    } as unknown as jest.Mocked<ProfessorService>;

    controller = new ProfessorController(service);
  });

  describe('cadastrar', () => {
    it('deve cadastrar um professor e retornar status 201', async () => {
      const body = {
        nome: 'Professor teste',
        email: 'professor@teste.com',
        senha: '123456',
      };

      const resultado = {
        id: 1,
        nome: body.nome,
        email: body.email,
      };

      const req = { body } as any;
      const res = mockResponse();

      service.cadastrar.mockResolvedValue(resultado as any);

      await controller.cadastrar(req, res as any);

      expect(service.cadastrar).toHaveBeenCalledWith(body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(resultado);
    });
  });

  describe('login', () => {
    it('deve realizar login com as credenciais recebidas', async () => {
      const body = {
        email: 'professor@teste.com',
        senha: '123456',
      };

      const resultado = {
        token: 'token-teste',
      };

      const req = { body } as any;
      const res = mockResponse();

      service.login.mockResolvedValue(resultado as any);

      await controller.login(req, res as any);

      expect(service.login).toHaveBeenCalledWith(body);
      expect(res.json).toHaveBeenCalledWith(resultado);
    });
  });

  describe('me', () => {
    it('deve buscar os dados do professor autenticado', async () => {
      const professor = {
        id: professorId,
        nome: 'Professor teste',
        email: 'professor@teste.com',
        senhaHash: 'hash-senha',
      };

      const req = {
        usuario: { sub: professorId },
      } as any;

      const res = mockResponse();

      service.buscarPorId.mockResolvedValue(professor as any);

      await controller.me(req, res as any);

      expect(service.buscarPorId).toHaveBeenCalledWith(professorId);

      expect(res.json).toHaveBeenCalledWith({
        id: professorId,
        nome: 'Professor teste',
        email: 'professor@teste.com',
      });
    });

    it('não deve retornar senhaHash na resposta', async () => {
      const professor = {
        id: professorId,
        nome: 'Professor teste',
        senhaHash: 'hash-senha',
      };

      const req = {
        usuario: { sub: professorId },
      } as any;

      const res = mockResponse();

      service.buscarPorId.mockResolvedValue(professor as any);

      await controller.me(req, res as any);

      const resposta = res.json.mock.calls[0][0];

      expect(resposta).not.toHaveProperty('senhaHash');
    });
  });
});
