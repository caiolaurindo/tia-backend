import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { EntidadeGenerica } from './base.entity';
import { Turma } from './turma.entity';

@Entity('aluno')
export class Aluno extends EntidadeGenerica {
  @Column({ type: 'varchar' })
  nome!: string;

  @Column({ name: 'data_nascimento', type: 'date' })
  dataNascimento!: Date;

  @Column({ type: 'text', nullable: true })
  observacoes?: string;

  @ManyToOne(() => Turma, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'turma_id' })
  turma!: Turma;
}
