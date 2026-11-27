import { Repository } from 'typeorm';
import { Conquista } from '../models/conquista.entity';
import { Aluno } from '../models/aluno.entity';
import { AlunoConquista, StatusConquista } from '../models/aluno-conquista.entity';
import { TurmaConquista } from '../models/turma-conquista.entity';
import { ServiceGenerico } from './base.service';
import { AppError } from '../utils/app-error';
import { CriarConquistaDTO, AtualizarConquistaDTO } from '../models/conquista.schema';

export interface ProgressoConquistaTurma {
  conquistaId: number;
  turmaId: number;
  conquistado: number;
  emDesenvolvimento: number;
  naoTrabalhado: number;
}

/**
 * Cada conquista pertence a um professor. As rotas devem usar apenas os métodos
 * "...Professor" abaixo; os herdados de ServiceGenerico (listarTodos, buscarPorId,
 * atualizar, remover) não filtram por dono.
 */
export class ConquistaService extends ServiceGenerico<Conquista> {
  constructor(repositorio: Repository<Conquista>) {
    super(repositorio);
  }

  async listarPorProfessor(professorId: number): Promise<Conquista[]> {
    return this.repositorio.find({ where: { professorId } });
  }

  async buscarPorIdEProfessor(id: number, professorId: number): Promise<Conquista> {
    const conquista = await this.repositorio.findOneBy({ id, professorId });
    if (!conquista) {
      throw new AppError('Conquista não encontrada ou acesso não autorizado.', 404);
    }
    return conquista;
  }

  async criarConquista(dados: CriarConquistaDTO, professorId: number) {
    await this.garantirNomeUnico(dados.nome, professorId);
    return this.criar({ ...dados, professorId });
  }

  async atualizarConquista(id: number, dados: AtualizarConquistaDTO, professorId: number) {
    await this.buscarPorIdEProfessor(id, professorId);
    if (dados.nome) await this.garantirNomeUnico(dados.nome, professorId, id);
    await this.repositorio.update(id, dados as any);
    return this.buscarPorIdEProfessor(id, professorId);
  }

  async removerParaProfessor(id: number, professorId: number): Promise<void> {
    await this.buscarPorIdEProfessor(id, professorId);
    await this.repositorio.delete(id);
  }

  /**
   * Progresso de cada conquista do professor em cada turma dele (só turmas onde a
   * conquista está vinculada). "Não trabalhado" = alunos da turma que não
   * estão nem conquistados nem em desenvolvimento (inclui quem não tem registro).
   * Só lê as tabelas de outros módulos; não altera nada deles.
   */
  async progressoPorTurma(professorId: number): Promise<ProgressoConquistaTurma[]> {
    const manager = this.repositorio.manager;

    const vinculos = await manager
      .createQueryBuilder(TurmaConquista, 'tc')
      .innerJoin('tc.turma', 't')
      .innerJoin('t.professor', 'p')
      .innerJoin('tc.conquista', 'c')
      .where('p.id = :professorId', { professorId })
      .andWhere('c.professorId = :professorId', { professorId })
      .select('tc.turmaId', 'turmaId')
      .addSelect('tc.conquistaId', 'conquistaId')
      .getRawMany<{ turmaId: number; conquistaId: number }>();

    if (vinculos.length === 0) return [];

    const totais = await manager
      .createQueryBuilder(Aluno, 'a')
      .innerJoin('a.turma', 't')
      .innerJoin('t.professor', 'p')
      .where('p.id = :professorId', { professorId })
      .select('t.id', 'turmaId')
      .addSelect('COUNT(a.id)', 'total')
      .groupBy('t.id')
      .getRawMany<{ turmaId: number; total: string }>();

    const contagens = await manager
      .createQueryBuilder(AlunoConquista, 'ac')
      .innerJoin('ac.aluno', 'a')
      .innerJoin('a.turma', 't')
      .innerJoin('t.professor', 'p')
      .where('p.id = :professorId', { professorId })
      .select('t.id', 'turmaId')
      .addSelect('ac.conquistaId', 'conquistaId')
      .addSelect('ac.status', 'status')
      .addSelect('COUNT(ac.id)', 'total')
      .groupBy('t.id')
      .addGroupBy('ac.conquistaId')
      .addGroupBy('ac.status')
      .getRawMany<{ turmaId: number; conquistaId: number; status: StatusConquista; total: string }>();

    const totalPorTurma = new Map(totais.map((t) => [Number(t.turmaId), Number(t.total)]));

    const porPar = new Map<string, { conquistado: number; emDesenvolvimento: number }>();
    for (const c of contagens) {
      const chave = `${Number(c.turmaId)}:${Number(c.conquistaId)}`;
      const atual = porPar.get(chave) ?? { conquistado: 0, emDesenvolvimento: 0 };
      const quantidade = Number(c.total);

      if (c.status === StatusConquista.CONQUISTADO) {
        atual.conquistado += quantidade;
      } else if (
        c.status === StatusConquista.EM_DESENVOLVIMENTO ||
        c.status === StatusConquista.EM_DESENVOLVIMENTO_AVANCADO
      ) {
        atual.emDesenvolvimento += quantidade;
      }
      porPar.set(chave, atual);
    }

    return vinculos.map((v) => {
      const turmaId = Number(v.turmaId);
      const conquistaId = Number(v.conquistaId);
      const { conquistado, emDesenvolvimento } =
        porPar.get(`${turmaId}:${conquistaId}`) ?? { conquistado: 0, emDesenvolvimento: 0 };
      const total = totalPorTurma.get(turmaId) ?? 0;

      return {
        conquistaId,
        turmaId,
        conquistado,
        emDesenvolvimento,
        naoTrabalhado: Math.max(total - conquistado - emDesenvolvimento, 0),
      };
    });
  }

  // O nome só precisa ser único entre as conquistas do mesmo professor.
  private async garantirNomeUnico(nome: string, professorId: number, ignorarId?: number) {
    const existente = await this.repositorio.findOneBy({ nome, professorId });
    if (existente && existente.id !== ignorarId) {
      throw new AppError('Já existe uma conquista com esse nome.', 409);
    }
  }
}
