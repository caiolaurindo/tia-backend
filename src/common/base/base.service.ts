/**
 * @description Classe abstrata genérica que implementa as operações padrão de CRUD (Listar, Buscar, Criar, Atualizar, Remover).
 * Evita a repetição de código de acesso a dados (TypeORM) em cada módulo do sistema.
 * 
 * @usage Crie um service específico herdando desta classe e passando a sua entidade.
 * Exemplo: `export class TurmaService extends ServiceGenerico<Turma> { ... }`
 */

import { Repository, DeepPartial, FindOptionsWhere } from 'typeorm';
import { AppError } from '../utils/app-error';

/**
 * @author moisesaraujo
 */

export abstract class ServiceGenerico<T extends { id: number }> {
  protected constructor(protected readonly repositorio: Repository<T>) {}

  async listarTodos(): Promise<T[]> {
    return this.repositorio.find();
  }

  async buscarPorId(id: number): Promise<T> {
    const entidade = await this.repositorio.findOneBy({ id } as FindOptionsWhere<T>);
    if (!entidade) {
      throw new AppError(`Registro com id ${id} não encontrado.`, 404);
    }
    return entidade;
  }

  async criar(dados: DeepPartial<T>): Promise<T> {
    const entidade = this.repositorio.create(dados);
    return this.repositorio.save(entidade);
  }

  async atualizar(id: number, dados: DeepPartial<T>): Promise<T> {
    await this.buscarPorId(id); 
    await this.repositorio.update(id, dados as any);
    return this.buscarPorId(id);
  }

  async remover(id: number): Promise<void> {
    await this.buscarPorId(id); 
    await this.repositorio.delete(id);
  }
}