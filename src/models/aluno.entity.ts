import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { EntidadeGenerica } from './base.entity';
import { Turma } from './turma.entity';

export enum SituacaoAluno {
  NO_RITMO = 'NO_RITMO',
  DESTAQUE = 'DESTAQUE',
  ATENCAO = 'ATENCAO',
}

@Entity('aluno')
export class Aluno extends EntidadeGenerica {
  @Column({ type: 'varchar' })
  nome!: string;

  @Column({ name: 'data_nascimento', type: 'date' })
  dataNascimento!: Date | string;

  @Column({ type: 'varchar', nullable: true })
  responsavel?: string | null;

  @Column({
    type: 'enum',
    enum: SituacaoAluno,
    default: SituacaoAluno.NO_RITMO,
  })
  situacao!: SituacaoAluno;

  @Column({ type: 'text', nullable: true })
  observacoes?: string;

  @ManyToOne(() => Turma, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'turma_id' })
  turma!: Turma;
}