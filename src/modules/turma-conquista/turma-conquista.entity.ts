import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { EntidadeGenerica } from '../../common/base/base.entity';
import { Turma } from '../turma/turma.entity';
import { Conquista } from '../conquista/conquista.entity';

@Entity('turma_conquista')
@Unique(['turmaId', 'conquistaId'])
export class TurmaConquista extends EntidadeGenerica {
  @Column({ name: 'turma_id' })
  turmaId!: number;

  @Column({ name: 'conquista_id' })
  conquistaId!: number;

  @ManyToOne(() => Turma, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'turma_id' })
  turma!: Turma;

  @ManyToOne(() => Conquista, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conquista_id' })
  conquista!: Conquista;
}