import { Repository } from 'typeorm';
import { Registro } from './registro.entity';
import { CreateRegistroInput, UpdateRegistroInput } from './registro.schema';

export class RegistroService {
  constructor(private readonly registroRepository: Repository<Registro>) {}

  async criar(data: CreateRegistroInput): Promise<Registro> {
    const registro = this.registroRepository.create(data);
    return await this.registroRepository.save(registro);
  }

  async listarTodos(): Promise<Registro[]> {
    return await this.registroRepository.find();
  }

  async buscarPorId(id: number): Promise<Registro> {
    const registro = await this.registroRepository.findOne({ where: { id } });
    if (!registro) {
      throw new Error(`Registro com ID ${id} não encontrado.`);
    }
    return registro;
  }

  async buscarPorAluno(alunoId: number): Promise<Registro[]> {
    return await this.registroRepository.find({ where: { alunoId } });
  }

  async buscarPorAula(aulaId: number): Promise<Registro[]> {
    return await this.registroRepository.find({ where: { aulaId } });
  }

  async atualizar(id: number, data: UpdateRegistroInput): Promise<Registro> {
    const registro = await this.buscarPorId(id);
    Object.assign(registro, data);
    return await this.registroRepository.save(registro);
  }

  async remover(id: number): Promise<void> {
    const registro = await this.buscarPorId(id);
    await this.registroRepository.remove(registro);
  }
}