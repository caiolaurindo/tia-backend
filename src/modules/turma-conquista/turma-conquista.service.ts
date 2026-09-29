import { Repository } from 'typeorm';
import { TurmaConquista } from './turma-conquista.entity';
import { Turma } from '../turma/turma.entity';
import { Conquista } from '../conquista/conquista.entity';
import { AppError } from '../../common/utils/app-error';

export class TurmaConquistaService {
  constructor(
    private turmaConquistaRepo: Repository<TurmaConquista>,
    private turmaRepo: Repository<Turma>,
    private conquistaRepo: Repository<Conquista>,
  ) {}

  async vincularConquista(turmaId: number, conquistaId: number, professorId: number) {
    await this.validarPosseTurma(turmaId, professorId);

    const conquistaExiste = await this.conquistaRepo.findOneBy({ id: conquistaId });
    if (!conquistaExiste) {
      throw new AppError('Conquista não encontrada.', 404);
    }

    const vinculoExistente = await this.turmaConquistaRepo.findOneBy({ turmaId, conquistaId });
    if (vinculoExistente) {
      throw new AppError('Esta conquista já está vinculada a esta turma.', 409);
    }

    const novoVinculo = this.turmaConquistaRepo.create({ turmaId, conquistaId });
    return this.turmaConquistaRepo.save(novoVinculo);
  }

  async listarConquistasDaTurma(turmaId: number, professorId: number) {
    await this.validarPosseTurma(turmaId, professorId);

    return this.turmaConquistaRepo.find({
      where: { turmaId },
      relations: ['conquista'],
    });
  }

  async desvincularConquista(turmaId: number, conquistaId: number, professorId: number) {
    await this.validarPosseTurma(turmaId, professorId);

    const vinculo = await this.turmaConquistaRepo.findOneBy({ turmaId, conquistaId });
    if (!vinculo) {
      throw new AppError('Vínculo entre turma e conquista não encontrado.', 404);
    }

    await this.turmaConquistaRepo.remove(vinculo);
  }

  private async validarPosseTurma(turmaId: number, professorId: number) {
    const turma = await this.turmaRepo.findOneBy({ id: turmaId, professorId });
    if (!turma) {
      throw new AppError('Turma não encontrada ou não pertence ao professor.', 404);
    }
    return turma;
  }
}