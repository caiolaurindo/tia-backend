import { Repository } from 'typeorm';
import { AlunoConquista, StatusConquista } from '../models/aluno-conquista.entity';
import { TurmaConquista } from '../models/turma-conquista.entity';
import { ServiceGenerico } from './base.service';
import { AlunoService } from './aluno.service';
import { AtribuirConquistaDTO, AtualizarAlunoConquistaDTO } from '../models/aluno-conquista.schema';
import { AppError } from '../utils/app-error';

export class AlunoConquistaService extends ServiceGenerico<AlunoConquista> {
  constructor(
    repositorio: Repository<AlunoConquista>,
    private readonly alunoService: AlunoService,
    private readonly turmaConquistaRepositorio: Repository<TurmaConquista>
  ) {
    super(repositorio);
  }

  async listarPorAluno(alunoId: number, professorId: number): Promise<AlunoConquista[]> {
    await this.alunoService.buscarPorIdEProfessor(alunoId, professorId);

    return this.repositorio.find({
      where: { alunoId },
      relations: { conquista: true },
      order: { criadoEm: 'ASC' },
    });
  }

  async buscarPorIdEProfessor(id: number, professorId: number): Promise<AlunoConquista> {
    const registro = await this.repositorio.findOne({
      where: { id, aluno: { turma: { professor: { id: professorId } } } },
      relations: { conquista: true },
    });

    if (!registro) {
      throw new AppError('Conquista do aluno não encontrada ou acesso não autorizado.', 404);
    }

    return registro;
  }

  async atribuirParaProfessor(dados: AtribuirConquistaDTO, professorId: number): Promise<AlunoConquista> {
    const { alunoId, conquistaId, status, observacao } = dados;

    const aluno = await this.alunoService.buscarPorIdEProfessor(alunoId, professorId);

    const conquistaDaTurma = await this.turmaConquistaRepositorio.findOneBy({
      turmaId: aluno.turma.id,
      conquistaId,
    });
    if (!conquistaDaTurma) {
      throw new AppError('Esta conquista não está atribuída à turma do aluno.', 400);
    }

    const existente = await this.repositorio.findOneBy({ alunoId, conquistaId });
    if (existente) {
      throw new AppError('Esta conquista já foi atribuída ao aluno.', 409);
    }

    const statusFinal = status ?? StatusConquista.NAO_TRABALHADO;

    const registro = this.repositorio.create({
      alunoId,
      conquistaId,
      status: statusFinal,
      observacao,
      dataConquista: statusFinal === StatusConquista.CONQUISTADO ? new Date() : null,
    });
    return this.repositorio.save(registro);
  }

  async atualizarParaProfessor(
    id: number,
    dados: AtualizarAlunoConquistaDTO,
    professorId: number
  ): Promise<AlunoConquista> {
    const registro = await this.buscarPorIdEProfessor(id, professorId);

    if (dados.status !== undefined && dados.status !== registro.status) {
      registro.status = dados.status;
      registro.dataConquista = dados.status === StatusConquista.CONQUISTADO ? new Date() : null;
    }
    if (dados.observacao !== undefined) {
      registro.observacao = dados.observacao;
    }

    return this.repositorio.save(registro);
  }

  async removerParaProfessor(id: number, professorId: number): Promise<void> {
    await this.buscarPorIdEProfessor(id, professorId);
    await this.repositorio.delete(id);
  }
}
