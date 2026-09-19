/**
 * @description Classe abstrata que serve como base genérica para todas as entidades do banco de dados.
 * Ela centraliza a criação da chave primária (id) e os campos de auditoria de tempo.
 * 
 * @usage Faça as suas tabelas herdarem desta classe em vez de recriar o ID em cada uma.
 * Exemplo: `export class Turma extends EntidadeGenerica { ... }`
 */

import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * @author moisesaraujo
 */

export abstract class EntidadeGenerica {
  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm!: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm!: Date;
}