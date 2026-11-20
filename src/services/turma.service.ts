import { ILike, Repository } from 'typeorm';
import { Turma } from '../models/turma.entity';
import { ServiceGenerico } from './base.service';
import { CriarTurmaDTO, AtualizarTurmaDTO } from '../models/turma.schema';
import { AppError } from '../utils/app-error';

export class TurmaService extends ServiceGenerico<Turma> {
  constructor(repositorio: Repository<Turma>) {
    super(repositorio);
  }

async listarPorProfessor(
  professorId: number,
  nome?: string,
  serie?: string,
  anoLetivo?: number,
  page: number = 1,
  limit: number = 10
) {
  const [dados, total] = await this.repositorio.findAndCount({
    where: {
      professor: { id: professorId },
      ...(nome && { nome: ILike(`%${nome}%`) }),
      ...(serie && { serie: ILike(`%${serie}%`) }),
      ...(anoLetivo !== undefined && { anoLetivo }),
    },
    order: { nome: 'ASC' },
    skip: (page - 1) * limit,
    take: limit,
  });

  return {
    dados,
    paginacao: {
      pagina: page,
      limite: limit,
      total,
      totalPaginas: Math.ceil(total / limit),
    },
  };
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
