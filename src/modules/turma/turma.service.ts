import { Repository } from 'typeorm';
import { Turma } from './turma.entity';
import { ServiceGenerico } from '../../common/base/base.service';
import { CriarTurmaDTO, AtualizarTurmaDTO } from './turma.schema';
import { AppError } from '../../common/utils/app-error';

export class TurmaService extends ServiceGenerico<Turma> {
  constructor(repositorio: Repository<Turma>) {
    super(repositorio);
  }

  async listarPorProfessor(professorId: number): Promise<Turma[]> {
    return this.repositorio.find({
      where: { professor: { id: professorId } },
      order: { nome: 'ASC' },
    });
  }

  async buscarPorIdEProfessor(id: number, professorId: number): Promise<Turma> {
    const turma = await this.repositorio.findOne({
      where: { id, professor: { id: professorId } },
    });

    if (!turma) {
      throw new AppError('Turma não encontrada ou acesso não autorizado.', 404);
    }

    return turma;
  }

  async criarParaProfessor(dados: CriarTurmaDTO, professorId: number): Promise<Turma> {
    const turma = this.repositorio.create({
      ...dados,
      professor: { id: professorId } as any,
    });
    return this.repositorio.save(turma);
  }

  async atualizarParaProfessor(id: number, dados: AtualizarTurmaDTO, professorId: number): Promise<Turma> {
    await this.buscarPorIdEProfessor(id, professorId);
    await this.repositorio.update(id, dados);
    return this.buscarPorIdEProfessor(id, professorId);
  }

  async removerParaProfessor(id: number, professorId: number): Promise<void> {
    await this.buscarPorIdEProfessor(id, professorId);
    await this.repositorio.delete(id);
  }
}