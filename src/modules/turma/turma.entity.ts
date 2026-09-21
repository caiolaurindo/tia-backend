import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { EntidadeGenerica } from '../../common/base/base.entity';
import { Professor } from '../professor/professor.entity';

@Entity('turma')
export class Turma extends EntidadeGenerica {
  @Column({ type: 'varchar' })
  nome!: string;

  @Column({ type: 'varchar' })
  serie!: string;

  @Column({ name: 'ano_letivo', type: 'int' })
  anoLetivo!: number;

  @ManyToOne(() => Professor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'professor_id' })
  professor!: Professor;
}