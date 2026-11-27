import { Repository } from 'typeorm';
import { Registro } from '../models/registro.entity';
import { Aluno } from '../models/aluno.entity';
import { Aula } from '../models/aula.entity';
import { TurmaConquista } from '../models/turma-conquista.entity';
import { ServiceGenerico } from './base.service';
import { CreateRegistroInput, UpdateRegistroInput } from '../models/registro.schema';
import { AppError } from '../utils/app-error';

export class RegistroService extends ServiceGenerico<Registro> {
  constructor(
    private readonly registroRepository: Repository<Registro>,
    private readonly alunoRepository?: Repository<Aluno>,
    private readonly aulaRepository?: Repository<Aula>,
    private readonly turmaConquistaRepository?: Repository<TurmaConquista>,
  ) {
    super(registroRepository);
  }

  private async validarVinculosDoProfessor(
    alunoId: number,
    aulaId: number | null | undefined,
    conquistaId: number | null | undefined,
    professorId?: number
  ): Promise<void> {
    if (!this.alunoRepository || professorId === undefined) {
      return;
    }

    const aluno = await this.alunoRepository.findOne({
      where: { id: alunoId, turma: { professor: { id: professorId } } },
      relations: { turma: true },
    });

    if (!aluno) {
      throw new AppError('Aluno não encontrado ou acesso não autorizado.', 404);
    }

    if (aulaId && this.aulaRepository) {
      const aula = await this.aulaRepository.findOne({
        where: { id: aulaId, professor: { id: professorId } },
        relations: { turma: true },
      });

      if (!aula) {
        throw new AppError('Aula não encontrada ou acesso não autorizado.', 404);
      }

      if (aluno.turma.id !== aula.turma.id) {
        throw new AppError('O aluno e a aula informados pertencem a turmas diferentes.', 400);
      }
    }

    if (conquistaId && this.turmaConquistaRepository) {
      const vinculo = await this.turmaConquistaRepository.findOneBy({
        turmaId: aluno.turma.id,
        conquistaId,
      });

      if (!vinculo) {
        throw new AppError('Esta conquista não está vinculada à turma do aluno.', 400);
      }
    }
  }

  override async criar(data: CreateRegistroInput, professorId?: number): Promise<Registro> {
    await this.validarVinculosDoProfessor(data.alunoId, data.aulaId, data.conquistaId, professorId);
    const registro = this.registroRepository.create(data);
    return await this.registroRepository.save(registro);
  }

  override async listarTodos(professorId?: number): Promise<Registro[]> {
    if (professorId !== undefined) {
      return await this.registroRepository.find({
        where: { aluno: { turma: { professor: { id: professorId } } } },
        relations: { aluno: true, aula: true, conquista: true },
        order: { data: 'DESC' },
      });
    }
    return await this.registroRepository.find();
  }

  override async buscarPorId(id: number, professorId?: number): Promise<Registro> {
    const registro = await this.registroRepository.findOne({
      where: {
        id,
        ...(professorId !== undefined && { aluno: { turma: { professor: { id: professorId } } } }),
      },
      relations: { aluno: true, aula: true, conquista: true },
    });
    if (!registro) {
      throw new AppError(`Registro com ID ${id} não encontrado ou acesso não autorizado.`, 404);
    }
    return registro;
  }

  async buscarPorAluno(alunoId: number, professorId?: number): Promise<Registro[]> {
    if (this.alunoRepository && professorId !== undefined) {
      const aluno = await this.alunoRepository.findOne({
        where: { id: alunoId, turma: { professor: { id: professorId } } },
      });
      if (!aluno) {
        throw new AppError('Aluno não encontrado ou acesso não autorizado.', 404);
      }
    }

    return await this.registroRepository.find({
      where: {
        alunoId,
        ...(professorId !== undefined && { aluno: { turma: { professor: { id: professorId } } } }),
      },
      relations: { aula: true, conquista: true },
      order: { data: 'DESC' },
    });
  }

  async buscarPorAula(aulaId: number, professorId?: number): Promise<Registro[]> {
    if (this.aulaRepository && professorId !== undefined) {
      const aula = await this.aulaRepository.findOne({
        where: { id: aulaId, professor: { id: professorId } },
      });
      if (!aula) {
        throw new AppError('Aula não encontrada ou acesso não autorizado.', 404);
      }
    }

    return await this.registroRepository.find({
      where: {
        aulaId,
        ...(professorId !== undefined && { aula: { professor: { id: professorId } } }),
      },
      relations: { aluno: true, conquista: true },
      order: { data: 'DESC' },
    });
  }

  override async atualizar(
    id: number,
    data: UpdateRegistroInput,
    professorId?: number
  ): Promise<Registro> {
    const registro = await this.buscarPorId(id, professorId);

    const novoAlunoId = data.alunoId ?? registro.alunoId;
    const novaAulaId = data.aulaId !== undefined ? data.aulaId : registro.aulaId;
    const novaConquistaId = data.conquistaId !== undefined ? data.conquistaId : registro.conquistaId;

    if (data.alunoId !== undefined || data.aulaId !== undefined || data.conquistaId !== undefined) {
      await this.validarVinculosDoProfessor(novoAlunoId, novaAulaId, novaConquistaId, professorId);
    }

    Object.assign(registro, data);
    return await this.registroRepository.save(registro);
  }

  override async remover(id: number, professorId?: number): Promise<void> {
    const registro = await this.buscarPorId(id, professorId);
    await this.registroRepository.remove(registro);
  }
}