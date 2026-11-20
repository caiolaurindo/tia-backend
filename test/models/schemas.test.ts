import {
  criarProfessorSchema,
  loginProfessorSchema,
} from '../../src/models/professor.schema';
import {
  criarAlunoSchema,
  atualizarAlunoSchema,
  listarAlunoQuerySchema,
} from '../../src/models/aluno.schema';
import {
  criarAulaSchema,
  atualizarAulaSchema,
  listarAulaQuerySchema,
} from '../../src/models/aula.schema';
import {
  createRegistroSchema,
  updateRegistroSchema,
} from '../../src/models/registro.schema';
import {
  criarTurmaSchema,
  atualizarTurmaSchema,
} from '../../src/models/turma.schema';
import { criarConquistaSchema } from '../../src/models/conquista.schema';
import { vincularConquistaSchema } from '../../src/models/turma-conquista.schema';
import {
  criarAulaConquistaSchema,
  listarAulaConquistaQuerySchema,
} from '../../src/models/aula-conquista.schema';
import {
  atribuirConquistaSchema,
  listarAlunoConquistaQuerySchema,
} from '../../src/models/aluno-conquista.schema';
import {
  idParamSchema,
  turmaIdParamSchema,
  turmaConquistaParamsSchema,
  alunoIdParamSchema,
  aulaIdParamSchema,
} from '../../src/models/common.schema';

describe('Padronização de Schemas Zod (T-05 e T-06)', () => {
  describe('professor.schema (senha max 72 bytes, e-mail normalizado e strict)', () => {
    it('deve aceitar senha com exatamente 72 caracteres ASCII e normalizar e-mail', () => {
      const resultado = criarProfessorSchema.parse({
        nome: '  Maria Silva  ',
        email: '  MARIA@Escola.COM  ',
        senha: 'a'.repeat(72),
      });

      expect(resultado).toEqual({
        nome: 'Maria Silva',
        email: 'maria@escola.com',
        senha: 'a'.repeat(72),
      });
    });

    it('deve rejeitar senha com mais de 72 caracteres no cadastro', () => {
      const res = criarProfessorSchema.safeParse({
        nome: 'Maria Silva',
        email: 'maria@escola.com',
        senha: 'a'.repeat(73),
      });

      expect(res.success).toBe(false);
      expect(res.error?.issues[0].message).toContain('72');
    });

    it('deve rejeitar senha com caracteres multi-byte que excedam 72 bytes UTF-8', () => {
      // Cada emoji ocupa 4 bytes em UTF-8 -> 19 emojis = 76 bytes (> 72), apesar de ter length 38
      const senhaMultiByte = '🔒'.repeat(19);
      const res = criarProfessorSchema.safeParse({
        nome: 'Maria Silva',
        email: 'maria@escola.com',
        senha: senhaMultiByte,
      });

      expect(res.success).toBe(false);
      expect(res.error?.issues.some((i) => i.message.includes('72'))).toBe(true);
    });

    it('deve rejeitar senha acima de 72 caracteres também no login', () => {
      const res = loginProfessorSchema.safeParse({
        email: 'maria@escola.com',
        senha: 'x'.repeat(73),
      });

      expect(res.success).toBe(false);
    });

    it('deve rejeitar campos desconhecidos no cadastro e login (strict)', () => {
      const resCadastro = criarProfessorSchema.safeParse({
        nome: 'Maria Silva',
        email: 'maria@escola.com',
        senha: 'senhaValida123',
        role: 'ADMIN',
      });
      const resLogin = loginProfessorSchema.safeParse({
        email: 'maria@escola.com',
        senha: 'senhaValida123',
        ativo: true,
      });

      expect(resCadastro.success).toBe(false);
      expect(resLogin.success).toBe(false);
    });
  });

  describe('aluno.schema (formato único AAAA-MM-DD e dataNascimento não futura)', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 10, 20, 12, 0, 0)); // 2026-11-20 (horário local)
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('deve aceitar dataNascimento no passado e igual à data atual', () => {
      const passado = criarAlunoSchema.parse({
        nome: 'Lucas',
        dataNascimento: '2018-05-10',
        turmaId: 1,
      });
      const hoje = criarAlunoSchema.parse({
        nome: 'Bebê',
        dataNascimento: '2026-11-20',
        turmaId: 1,
      });

      expect(passado.dataNascimento).toBe('2018-05-10');
      expect(hoje.dataNascimento).toBe('2026-11-20');
    });

    it('deve rejeitar dataNascimento futura (dia seguinte)', () => {
      const res = criarAlunoSchema.safeParse({
        nome: 'Lucas',
        dataNascimento: '2026-11-21',
        turmaId: 1,
      });

      expect(res.success).toBe(false);
      expect(res.error?.issues[0].message).toBe('A data de nascimento não pode ser futura');
    });

    it('deve rejeitar dataNascimento futura na atualização parcial', () => {
      const res = atualizarAlunoSchema.safeParse({
        dataNascimento: '2027-01-01',
      });

      expect(res.success).toBe(false);
      expect(res.error?.issues[0].message).toBe('A data de nascimento não pode ser futura');
    });

    it('deve rejeitar formatos diferentes de AAAA-MM-DD e datas inexistentes no calendário', () => {
      const entradasInvalidas = [
        '10/05/2018',
        '2018-05-10T00:00:00Z',
        '2025-02-29', // ano não bissexto
        '2026-02-30',
        '2026-13-01',
        1234567890,
      ];

      for (const dataInvalida of entradasInvalidas) {
        const res = criarAlunoSchema.safeParse({
          nome: 'Lucas',
          dataNascimento: dataInvalida,
          turmaId: 1,
        });
        expect(res.success).toBe(false);
      }
    });

    it('deve aceitar 29 de fevereiro em ano bissexto no passado', () => {
      const res = criarAlunoSchema.safeParse({
        nome: 'Lucas',
        dataNascimento: '2024-02-29',
        turmaId: 1,
      });

      expect(res.success).toBe(true);
    });

    it('deve validar query opcional de turmaId em listarAlunoQuerySchema', () => {
      expect(listarAlunoQuerySchema.parse({})).toEqual({});
      expect(listarAlunoQuerySchema.parse({ turmaId: '10' })).toEqual({ turmaId: 10 });
      expect(listarAlunoQuerySchema.safeParse({ turmaId: '0' }).success).toBe(false);
      expect(listarAlunoQuerySchema.safeParse({ turmaId: '-5' }).success).toBe(false);
      expect(listarAlunoQuerySchema.safeParse({ turmaId: 'abc' }).success).toBe(false);
      expect(listarAlunoQuerySchema.safeParse({ turmaId: '1.5' }).success).toBe(false);
    });
  });

  describe('aula.schema e registro.schema (formato único AAAA-MM-DD e strict)', () => {
    it('deve aceitar data válida AAAA-MM-DD em aula (incluindo datas futuras) e rejeitar datas inexistentes', () => {
      expect(
        criarAulaSchema.parse({
          nome: 'Aula 1',
          assunto: 'Cores',
          data: '2027-03-15',
          turmaId: 1,
        }).data
      ).toBe('2027-03-15');

      expect(
        criarAulaSchema.safeParse({
          nome: 'Aula 1',
          assunto: 'Cores',
          data: '2026-02-31',
          turmaId: 1,
        }).success
      ).toBe(false);

      expect(
        atualizarAulaSchema.safeParse({
          nome: 'Aula 1',
          campoExtra: true,
        }).success
      ).toBe(false);
    });

    it('deve exigir formato único AAAA-MM-DD em registro.schema (sem coerção permissiva)', () => {
      expect(
        createRegistroSchema.parse({
          alunoId: 1,
          aulaId: 2,
          data: '2026-10-26',
        }).data
      ).toBe('2026-10-26');

      for (const dataInvalida of ['26/10/2026', '2026-10-26T10:00:00Z', '2026-02-30', 0]) {
        expect(
          createRegistroSchema.safeParse({
            alunoId: 1,
            aulaId: 2,
            data: dataInvalida,
          }).success
        ).toBe(false);
      }

      expect(
        updateRegistroSchema.safeParse({
          participacao: 'Ótima',
          professorId: 99,
        }).success
      ).toBe(false);
    });
  });

  describe('strict nos demais schemas de body e validação de params/query', () => {
    it('deve rejeitar campos desconhecidos nos demais schemas de body', () => {
      expect(
        criarTurmaSchema.safeParse({
          nome: 'Turma A',
          serie: '1º Ano',
          anoLetivo: 2026,
          professorId: 99,
        }).success
      ).toBe(false);

      expect(atualizarTurmaSchema.safeParse({ nome: 'B', extra: 1 }).success).toBe(false);
      expect(criarConquistaSchema.safeParse({ nome: 'Ler', extra: 1 }).success).toBe(false);
      expect(vincularConquistaSchema.safeParse({ conquistaId: 1, extra: 1 }).success).toBe(false);
      expect(
        criarAulaConquistaSchema.safeParse({ aulaId: 1, conquistaId: 2, extra: 1 }).success
      ).toBe(false);
      expect(
        atribuirConquistaSchema.safeParse({ alunoId: 1, conquistaId: 2, extra: 1 }).success
      ).toBe(false);
    });

    it('deve validar e converter parâmetros de rota corretamente', () => {
      expect(idParamSchema.parse({ id: '15' })).toEqual({ id: 15 });
      expect(turmaIdParamSchema.parse({ turmaId: '3' })).toEqual({ turmaId: 3 });
      expect(turmaConquistaParamsSchema.parse({ turmaId: '3', conquistaId: '8' })).toEqual({
        turmaId: 3,
        conquistaId: 8,
      });
      expect(alunoIdParamSchema.parse({ aluno_id: '12' })).toEqual({ aluno_id: 12 });
      expect(aulaIdParamSchema.parse({ aula_id: '9' })).toEqual({ aula_id: 9 });

      for (const invalido of ['', '0', '-1', 'abc', '2.5', '1e2']) {
        expect(idParamSchema.safeParse({ id: invalido }).success).toBe(false);
      }
    });

    it('deve validar queries de aula, aula-conquista e aluno-conquista', () => {
      expect(listarAulaQuerySchema.parse({})).toEqual({});
      expect(listarAulaQuerySchema.parse({ turmaId: '4' })).toEqual({ turmaId: 4 });
      expect(listarAulaConquistaQuerySchema.parse({ aulaId: '7' })).toEqual({ aulaId: 7 });
      expect(listarAulaConquistaQuerySchema.safeParse({}).success).toBe(false);
      expect(listarAlunoConquistaQuerySchema.parse({ alunoId: '9' })).toEqual({ alunoId: 9 });
      expect(listarAlunoConquistaQuerySchema.safeParse({}).success).toBe(false);
    });
  });
});
