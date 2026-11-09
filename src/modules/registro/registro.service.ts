import { Repository } from 'typeorm';
import { Registro } from './registro.entity';
import { Aluno } from '../aluno/aluno.entity';
import { Aula } from '../aula/aula.entity';
import { ServiceGenerico } from '../../common/base/base.service';
import { CreateRegistroInput, UpdateRegistroInput } from './registro.schema';
import { AppError } from '../../common/utils/app-error';

export class RegistroService extends ServiceGenerico<Registro> {
  constructor(
    private readonly registroRepository: Repository<Registro>,
    private readonly alunoRepository?: Repository<Aluno>,
    private readonly aulaRepository?: Repository<Aula>,
  ) {
    super(registroRepository);
  }

  private async validarVinculosDoProfessor(
    alunoId: number,
    aulaId: number,
    professorId?: number
  ): Promise<void> {
    if (!this.alunoRepository || !this.aulaRepository || professorId === undefined) {
      return;
    }

    const aluno = await this.alunoRepository.findOne({
      where: { id: alunoId, turma: { professor: { id: professorId } } },
      relations: { turma: true },
    });

    if (!aluno) {
      throw new AppError('Aluno não encontrado ou acesso não autorizado.', 404);
    }

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

  override async criar(data: CreateRegistroInput, professorId?: number): Promise<Registro> {
    await this.validarVinculosDoProfessor(data.alunoId, data.aulaId, professorId);
    const registro = this.registroRepository.create(data);
    return await this.registroRepository.save(registro);
  }

  override async listarTodos(professorId?: number): Promise<Registro[]> {
    if (professorId !== undefined) {
      return await this.registroRepository.find({
        where: { aula: { professor: { id: professorId } } },
        relations: { aluno: true, aula: true },
        order: { data: 'DESC' },
      });
    }
    return await this.registroRepository.find();
  }

  override async buscarPorId(id: number, professorId?: number): Promise<Registro> {
    const registro = await this.registroRepository.findOne({
      where: {
        id,
        ...(professorId !== undefined && { aula: { professor: { id: professorId } } }),
      },
      relations: { aluno: true, aula: true },
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
        ...(professorId !== undefined && { aula: { professor: { id: professorId } } }),
      },
      relations: { aula: true },
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
      relations: { aluno: true },
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
    const novaAulaId = data.aulaId ?? registro.aulaId;

    if (data.alunoId !== undefined || data.aulaId !== undefined) {
      await this.validarVinculosDoProfessor(novoAlunoId, novaAulaId, professorId);
    }

    Object.assign(registro, data);
    return await this.registroRepository.save(registro);
  }

  override async remover(id: number, professorId?: number): Promise<void> {
    const registro = await this.buscarPorId(id, professorId);
    await this.registroRepository.remove(registro);
  }
}