import { Repository } from 'typeorm';
import { Aula } from './aula.entity';
import { Turma } from '../turma/turma.entity';
import { ServiceGenerico } from '../../common/base/base.service';
import { CriarAulaDTO, AtualizarAulaDTO } from './aula.schema';
import { AppError } from '../../common/utils/app-error';

/**
 * Serviço responsável pelas regras de negócio da entidade Aula,
 * incluindo validação de permissão da professora e vínculo com as turmas.
 * 
 * @author caiolaurindo
 */
export class AulaService extends ServiceGenerico<Aula> {
  constructor(
    repositorio: Repository<Aula>,
    private readonly turmaRepositorio?: Repository<Turma>
  ) {
    super(repositorio);
  }

  async listarPorProfessor(professorId: number): Promise<Aula[]> {
    return this.repositorio.find({
      where: { professor: { id: professorId } },
      relations: ['turma'],
      order: { data: 'DESC' },
    });
  }

  async listarPorTurmaEProfessor(turmaId: number, professorId: number): Promise<Aula[]> {
    return this.repositorio.find({
      where: {
        turma: { id: turmaId },
        professor: { id: professorId },
      },
      relations: ['turma'],
      order: { data: 'DESC' },
    });
  }

  async buscarPorIdEProfessor(id: number, professorId: number): Promise<Aula> {
    const aula = await this.repositorio.findOne({
      where: { id, professor: { id: professorId } },
      relations: ['turma'],
    });

    if (!aula) {
      throw new AppError('Aula não encontrada ou acesso não autorizado.', 404);
    }

    return aula;
  }

  async criarParaProfessor(dados: CriarAulaDTO, professorId: number): Promise<Aula> {
    if (this.turmaRepositorio) {
      const turmaExiste = await this.turmaRepositorio.findOne({
        where: { id: dados.turmaId, professor: { id: professorId } },
      });

      if (!turmaExiste) {
        throw new AppError('Turma não encontrada ou acesso não autorizado.', 404);
      }
    }

    const aula = this.repositorio.create({
      nome: dados.nome,
      assunto: dados.assunto,
      data: dados.data,
      turma: { id: dados.turmaId } as Turma,
      professor: { id: professorId } as any,
    });

    return this.repositorio.save(aula);
  }

  async atualizarParaProfessor(id: number, dados: AtualizarAulaDTO, professorId: number): Promise<Aula> {
    await this.buscarPorIdEProfessor(id, professorId);

    if (dados.turmaId && this.turmaRepositorio) {
      const turmaExiste = await this.turmaRepositorio.findOne({
        where: { id: dados.turmaId, professor: { id: professorId } },
      });

      if (!turmaExiste) {
        throw new AppError('Turma não encontrada ou acesso não autorizado.', 404);
      }
    }

    const { turmaId, ...demaisDados } = dados;
    const dadosParaAtualizar: any = { ...demaisDados };

    if (turmaId) {
      dadosParaAtualizar.turma = { id: turmaId };
    }

    await this.repositorio.update(id, dadosParaAtualizar);
    return this.buscarPorIdEProfessor(id, professorId);
  }

  async removerParaProfessor(id: number, professorId: number): Promise<void> {
    await this.buscarPorIdEProfessor(id, professorId);
    await this.repositorio.delete(id);
  }
}

