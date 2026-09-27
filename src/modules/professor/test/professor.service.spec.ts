import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Repository } from 'typeorm/repository/Repository';
import { AppError } from '../../../common/utils/app-error';
import { JwtUtil } from '../../../common/utils/jwt.util';
import type { Professor } from '../professor.entity';
import type { ProfessorService as ProfessorServiceType } from '../professor.service';

jest.mock('bcrypt', () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn(),
}));

const bcryptMock = jest.requireMock('bcrypt') as jest.Mocked<
  typeof import('bcrypt')
>;
const { ProfessorService } = require('../professor.service') as typeof import('../professor.service');

describe('ProfessorService (Testes Unitários)', () => {
  let professorService: ProfessorServiceType;
  let repositorioMock: jest.Mocked<Repository<Professor>>;

  const professorMock: Professor = {
    id: 1,
    nome: 'Maria Silva',
    email: 'maria@email.com',
    senhaHash: 'senha-hash',
    criadoEm: new Date(),
    atualizadoEm: new Date(),
  };

  beforeEach(() => {
    repositorioMock = {
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<Professor>>;

    professorService = new ProfessorService(repositorioMock);
  });

  describe('Cadastro de Professor', () => {
    it('deve cadastrar um professor com a senha criptografada', async () => {
      const dados = {
        nome: 'Maria Silva',
        email: 'maria@email.com',
        senha: '123456',
      };

      repositorioMock.findOneBy.mockResolvedValue(null);
      bcryptMock.genSalt.mockResolvedValue('salt');
      bcryptMock.hash.mockResolvedValue(professorMock.senhaHash);
      repositorioMock.create.mockReturnValue(professorMock);
      repositorioMock.save.mockResolvedValue(professorMock);

      const resultado = await professorService.cadastrar(dados);

      expect(repositorioMock.findOneBy).toHaveBeenCalledWith({
        email: dados.email,
      });
      expect(bcryptMock.genSalt).toHaveBeenCalledWith(10);
      expect(bcryptMock.hash).toHaveBeenCalledWith(dados.senha, 'salt');
      expect(repositorioMock.create).toHaveBeenCalledWith({
        nome: dados.nome,
        email: dados.email,
        senhaHash: professorMock.senhaHash,
      });
      expect(repositorioMock.save).toHaveBeenCalledWith(professorMock);
      expect(resultado).toEqual({
        id: professorMock.id,
        nome: professorMock.nome,
        email: professorMock.email,
        criadoEm: professorMock.criadoEm,
        atualizadoEm: professorMock.atualizadoEm,
      });
      expect(resultado).not.toHaveProperty('senhaHash');
    });

    it('deve lançar AppError quando o e-mail já estiver cadastrado', async () => {
      repositorioMock.findOneBy.mockResolvedValue(professorMock);
      await expect(
        professorService.cadastrar({
          nome: 'Outra Maria',
          email: professorMock.email,
          senha: '123456',
        }),
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'E-mail já cadastrado.',
      });

      expect(bcryptMock.genSalt).not.toHaveBeenCalled();
      expect(repositorioMock.save).not.toHaveBeenCalled();
    });
  });

  describe('Login de Professor', () => {
    const dadosLogin = {
      email: professorMock.email,
      senha: '123456',
    };

    it('deve autenticar o professor e retornar seus dados sem a senha e o token', async () => {
      repositorioMock.findOneBy.mockResolvedValue(professorMock);
      bcryptMock.compare.mockResolvedValue(true);
      const gerarTokenMock = jest
        .spyOn(JwtUtil, 'gerarToken')
        .mockReturnValue('token-jwt');

      const resultado = await professorService.login(dadosLogin);

      expect(repositorioMock.findOneBy).toHaveBeenCalledWith({
        email: dadosLogin.email,
      });
      expect(bcryptMock.compare).toHaveBeenCalledWith(
        dadosLogin.senha,
        professorMock.senhaHash,
      );
      expect(gerarTokenMock).toHaveBeenCalledWith({
        sub: professorMock.id,
        email: professorMock.email,
      });
      expect(resultado).toEqual({
        professor: {
          id: professorMock.id,
          nome: professorMock.nome,
          email: professorMock.email,
          criadoEm: professorMock.criadoEm,
          atualizadoEm: professorMock.atualizadoEm,
        },
        token: 'token-jwt',
      });
      expect(resultado.professor).not.toHaveProperty('senhaHash');
    });

    it('deve lançar AppError quando o e-mail não estiver cadastrado', async () => {
      repositorioMock.findOneBy.mockResolvedValue(null);
      await expect(professorService.login(dadosLogin)).rejects.toThrow(AppError);
      await expect(professorService.login(dadosLogin)).rejects.toMatchObject({
        statusCode: 401,
        message: 'Credenciais inválidas.',
      });

      expect(bcryptMock.compare).not.toHaveBeenCalled();
    });

    it('deve lançar AppError quando a senha estiver incorreta', async () => {
      repositorioMock.findOneBy.mockResolvedValue(professorMock);
      bcryptMock.compare.mockResolvedValue(false);

      await expect(professorService.login(dadosLogin)).rejects.toMatchObject({
        statusCode: 401,
        message: 'Credenciais inválidas.',
      });

      expect(bcryptMock.compare).toHaveBeenCalledWith(
        dadosLogin.senha,
        professorMock.senhaHash,
      );
    });
  });
});
