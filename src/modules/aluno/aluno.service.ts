import { Repository } from 'typeorm';
import { Aluno } from './aluno.entity';
import { Turma } from '../turma/turma.entity';
import { ServiceGenerico } from '../../common/base/base.service';
import { CriarAlunoDTO, AtualizarAlunoDTO } from './aluno.schema';
import { AppError } from '../../common/utils/app-error';

/**
 * @author moisesaraujo
 */

export class AlunoService extends ServiceGenerico<Aluno> {
  constructor(
    repositorio: Repository<Aluno>,
    private readonly turmaRepositorio: Repository<Turma>
  ) {
    super(repositorio);
  }

  private async validarPosseTurma(turmaId: number, professorId: number): Promise<Turma> {
    const turma = await this.turmaRepositorio.findOne({
      where: { id: turmaId, professor: { id: professorId } },
    });

    if (!turma) {
      throw new AppError('Turma não encontrada ou acesso não autorizado.', 404);
    }

    return turma;
  }

  async listarPorProfessor(professorId: number): Promise<Aluno[]> {
    return this.repositorio.find({
      where: { turma: { professor: { id: professorId } } },
      relations: ['turma'],
      order: { nome: 'ASC' },
    });
  }

  async listarPorTurma(turmaId: number, professorId: number): Promise<Aluno[]> {
    await this.validarPosseTurma(turmaId, professorId);

    return this.repositorio.find({
      where: { turma: { id: turmaId, professor: { id: professorId } } },
      order: { nome: 'ASC' },
    });
  }

  async buscarPorIdEProfessor(id: number, professorId: number): Promise<Aluno> {
    const aluno = await this.repositorio.findOne({
      where: { id, turma: { professor: { id: professorId } } },
      relations: ['turma'],
    });

    if (!aluno) {
      throw new AppError('Aluno não encontrado ou acesso não autorizado.', 404);
    }

    return aluno;
  }

  async criarParaProfessor(dados: CriarAlunoDTO, professorId: number): Promise<Aluno> {
    await this.validarPosseTurma(dados.turmaId, professorId);

    const { turmaId, ...dadosAluno } = dados;
    const aluno = this.repositorio.create({
      ...dadosAluno,
      turma: { id: turmaId } as any,
    });

    return this.repositorio.save(aluno);
  }

  async atualizarParaProfessor(
    id: number,
    dados: AtualizarAlunoDTO,
    professorId: number
  ): Promise<Aluno> {
    await this.buscarPorIdEProfessor(id, professorId);

    const { turmaId, ...dadosAtualizacao } = dados;
    const payloadAtualizacao: any = { ...dadosAtualizacao };

    if (turmaId !== undefined) {
      await this.validarPosseTurma(turmaId, professorId);
      payloadAtualizacao.turma = { id: turmaId };
    }

    await this.repositorio.update(id, payloadAtualizacao);
    return this.buscarPorIdEProfessor(id, professorId);
  }

  async removerParaProfessor(id: number, professorId: number): Promise<void> {
    await this.buscarPorIdEProfessor(id, professorId);
    await this.repositorio.delete(id);
  }
}
