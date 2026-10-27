import { Repository } from 'typeorm';
import { AulaConquista } from './aula-conquista.entity';
import { Aula } from '../aula/aula.entity';
import { Conquista } from '../conquista/conquista.entity';
import { ServiceGenerico } from '../../common/base/base.service';
import { CriarAulaConquistaDTO, AtualizarAulaConquistaDTO } from './aula-conquista.schema';
import { AppError } from '../../common/utils/app-error';

/**
 * Serviço responsável pelas regras de negócio de definição e acompanhamento
 * de metas de conquistas por aula.
 * 
 * @author caiolaurindo
 */
export class AulaConquistaService extends ServiceGenerico<AulaConquista> {
  constructor(
    repositorio: Repository<AulaConquista>,
    private readonly aulaRepositorio: Repository<Aula>,
    private readonly conquistaRepositorio: Repository<Conquista>
  ) {
    super(repositorio);
  }

  async vincularConquistaAAula(dados: CriarAulaConquistaDTO, professorId: number): Promise<AulaConquista> {
    const aula = await this.aulaRepositorio.findOne({
      where: { id: dados.aulaId, professor: { id: professorId } },
    });

    if (!aula) {
      throw new AppError('Aula não encontrada ou acesso não autorizado.', 404);
    }

    const conquista = await this.conquistaRepositorio.findOneBy({ id: dados.conquistaId });
    if (!conquista) {
      throw new AppError('Conquista não encontrada.', 404);
    }

    const vinculoExistente = await this.repositorio.findOne({
      where: {
        aula: { id: dados.aulaId },
        conquista: { id: dados.conquistaId },
      },
    });

    if (vinculoExistente) {
      throw new AppError('Esta conquista já foi definida como meta para esta aula.', 409);
    }

    const novaAulaConquista = this.repositorio.create({
      aula: { id: dados.aulaId } as Aula,
      conquista: { id: dados.conquistaId } as Conquista,
      meta: dados.meta,
    });

    return this.repositorio.save(novaAulaConquista);
  }

  async listarPorAula(aulaId: number, professorId: number): Promise<AulaConquista[]> {
    const aula = await this.aulaRepositorio.findOne({
      where: { id: aulaId, professor: { id: professorId } },
    });

    if (!aula) {
      throw new AppError('Aula não encontrada ou acesso não autorizado.', 404);
    }

    return this.repositorio.find({
      where: { aula: { id: aulaId } },
      relations: ['conquista'],
      order: { criadoEm: 'ASC' },
    });
  }

  async buscarPorIdEProfessor(id: number, professorId: number): Promise<AulaConquista> {
    const aulaConquista = await this.repositorio.findOne({
      where: {
        id,
        aula: { professor: { id: professorId } },
      },
      relations: ['aula', 'conquista'],
    });

    if (!aulaConquista) {
      throw new AppError('Registro de conquista da aula não encontrado ou acesso não autorizado.', 404);
    }

    return aulaConquista;
  }

  async atualizarMeta(id: number, dados: AtualizarAulaConquistaDTO, professorId: number): Promise<AulaConquista> {
    await this.buscarPorIdEProfessor(id, professorId);
    await this.repositorio.update(id, { meta: dados.meta });
    return this.buscarPorIdEProfessor(id, professorId);
  }

  async removerDaAula(id: number, professorId: number): Promise<void> {
    await this.buscarPorIdEProfessor(id, professorId);
    await this.repositorio.delete(id);
  }
}

