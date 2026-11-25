import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { EntidadeGenerica } from './base.entity';
import { Professor } from './professor.entity';

export enum CategoriaConquista {
  SPEAKING = 'speaking',
  LISTENING = 'listening',
  GRAMMAR = 'grammar',
  VOCABULARY = 'vocabulary',
  READING = 'reading',
  WRITING = 'writing',
}

@Entity('conquista')
@Unique(['professorId', 'nome'])
export class Conquista extends EntidadeGenerica {
  @Column({ type: 'varchar', length: 150 })
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

  // Dono da conquista. Nullable só para não quebrar linhas criadas antes deste campo
  // (essas ficam sem dono e não aparecem para ninguém até serem atribuídas).
  @Column({ name: 'professor_id', type: 'int', nullable: true })
  professorId?: number | null;

  @ManyToOne(() => Professor, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'professor_id' })
  professor?: Professor;
}
