import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { EntidadeGenerica } from './base.entity';
import { Turma } from './turma.entity';
import { Conquista } from './conquista.entity';

@Entity('turma_conquista')
@Unique(['turmaId', 'conquistaId'])
export class TurmaConquista extends EntidadeGenerica {
  @Column({ name: 'turma_id', type: 'int' })
  turmaId!: number;

  @Column({ name: 'conquista_id', type: 'int' })
  conquistaId!: number;

  @ManyToOne(() => Turma, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'turma_id' })
  turma!: Turma;

  @ManyToOne(() => Conquista, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conquista_id' })
  conquista!: Conquista;
}
