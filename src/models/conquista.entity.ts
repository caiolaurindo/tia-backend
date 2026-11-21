import { Entity, Column } from 'typeorm';
import { EntidadeGenerica } from './base.entity';

export enum CategoriaConquista {
  SPEAKING = 'speaking',
  LISTENING = 'listening',
  GRAMMAR = 'grammar',
  VOCABULARY = 'vocabulary',
  READING = 'reading',
  WRITING = 'writing',
}

@Entity('conquista')
export class Conquista extends EntidadeGenerica {
  @Column({ type: 'varchar', length: 150, unique: true })
  nome!: string;

  @Column({ type: 'text', nullable: true })
  descricao?: string;

  // default evita erro do synchronize em linhas já existentes
  @Column({
    type: 'enum',
    enum: CategoriaConquista,
    default: CategoriaConquista.VOCABULARY,
  })
  categoria!: CategoriaConquista;

  @Column({ type: 'varchar', length: 10, nullable: true })
  nivel?: string;

  // false = arquivada (a tela arquiva em vez de excluir)
  @Column({ type: 'boolean', default: true })
  ativa!: boolean;
}
