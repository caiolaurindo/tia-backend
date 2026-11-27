import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { EntidadeGenerica } from './base.entity';
import { Turma } from './turma.entity';
import { Professor } from './professor.entity';

export type AulaStatus =
  | 'proxima'
  | 'planejada'
  | 'em_andamento'
  | 'concluida';

export interface AulaAtividade {
  id: string;
  label: string;
  color: string;
}

@Entity('aula')
export class Aula extends EntidadeGenerica {
  @Column({ type: 'varchar' })
  nome!: string;

  @Column({ type: 'varchar' })
  assunto!: string;

  @Column({ type: 'date' })
  data!: string | Date;

  @Column({ name: 'horario_inicio', type: 'time', nullable: true })
  horarioInicio!: string | null;

  @Column({ name: 'horario_fim', type: 'time', nullable: true })
  horarioFim!: string | null;

  @Column({ type: 'varchar', default: 'planejada' })
  status!: AulaStatus;

  @Column({ type: 'json', nullable: true })
  atividades!: AulaAtividade[] | null;

  @ManyToOne(() => Turma, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'turma_id' })
  turma!: Turma;

  @ManyToOne(() => Professor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'professor_id' })
  professor!: Professor;
}