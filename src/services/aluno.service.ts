import { Repository } from 'typeorm';
import { Aluno } from '../models/aluno.entity';
import { ServiceGenerico } from './base.service';
import { TurmaService } from './turma.service';
import { CriarAlunoDTO, AtualizarAlunoDTO } from '../models/aluno.schema';
import { AppError } from '../utils/app-error';

export class AlunoService extends ServiceGenerico<Aluno> {
  constructor(
    repositorio: Repository<Aluno>,
    private readonly turmaService: TurmaService
  ) {
    super(repositorio);
  }

  async listarPorProfessor(professorId: number, turmaId?: number): Promise<Aluno[]> {
    return this.repositorio.find({
      where: {
        turma: {
          professor: { id: professorId },
          ...(turmaId !== undefined && { id: turmaId }),
        },
      },
      relations: { turma: true },
      order: { nome: 'ASC' },
    });
  }

  async buscarPorIdEProfessor(id: number, professorId: number): Promise<Aluno> {
    const aluno = await this.repositorio.findOne({
      where: { id, turma: { professor: { id: professorId } } },
      relations: { turma: true },
    });

    if (!aluno) {
      throw new AppError('Aluno não encontrado ou acesso não autorizado.', 404);
    }

    return aluno;
  }

  async criarParaProfessor(dados: CriarAlunoDTO, professorId: number): Promise<Aluno> {
    const { turmaId, ...resto } = dados;
    await this.turmaService.buscarPorIdEProfessor(turmaId, professorId);

    const aluno = this.repositorio.create({
      ...resto,
      turma: { id: turmaId } as any,
    });
    return this.repositorio.save(aluno);
  }

  async atualizarParaProfessor(id: number, dados: AtualizarAlunoDTO, professorId: number): Promise<Aluno> {
    await this.buscarPorIdEProfessor(id, professorId);

    const { turmaId, ...resto } = dados;
    if (turmaId !== undefined) {
      await this.turmaService.buscarPorIdEProfessor(turmaId, professorId);
    }

    await this.repositorio.update(id, {
      ...resto,
      ...(turmaId !== undefined && { turma: { id: turmaId } as any }),
    });
    return this.buscarPorIdEProfessor(id, professorId);
  }

  async removerParaProfessor(id: number, professorId: number): Promise<void> {
    await this.buscarPorIdEProfessor(id, professorId);
    await this.repositorio.delete(id);
  }
}
