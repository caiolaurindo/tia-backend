import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { EntidadeGenerica } from '../../common/base/base.entity';
import { Aluno } from '../aluno/aluno.entity';
import { Conquista } from '../conquista/conquista.entity';

/**
 * @author seu-nome
 */

export enum StatusConquista {
  NAO_TRABALHADO = 'NAO_TRABALHADO',
  EM_DESENVOLVIMENTO = 'EM_DESENVOLVIMENTO',
  EM_DESENVOLVIMENTO_AVANCADO = 'EM_DESENVOLVIMENTO_AVANCADO',
  CONQUISTADO = 'CONQUISTADO',
}

@Entity('aluno_conquista')
@Unique(['alunoId', 'conquistaId'])
export class AlunoConquista extends EntidadeGenerica {
  @Column({ name: 'aluno_id', type: 'int' })
  alunoId!: number;

  @Column({ name: 'conquista_id', type: 'int' })
  conquistaId!: number;

  @Column({
    type: 'enum',
    enum: StatusConquista,
    default: StatusConquista.NAO_TRABALHADO,
  })
  status!: StatusConquista;

  @Column({ name: 'data_conquista', type: 'date', nullable: true })
  dataConquista?: Date | null;

  @Column({ type: 'text', nullable: true })
  observacao?: string;

  @ManyToOne(() => Aluno, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'aluno_id' })
  aluno!: Aluno;

  @ManyToOne(() => Conquista, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conquista_id' })
  conquista!: Conquista;
}