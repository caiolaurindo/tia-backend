import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { EntidadeGenerica } from './base.entity';
import { Professor } from './professor.entity';

@Entity('turma')
export class Turma extends EntidadeGenerica {
  @Column({ type: 'varchar' })
  nome!: string;

  @Column({ type: 'varchar' })
  serie!: string;

  @Column({ name: 'ano_letivo', type: 'int' })
  anoLetivo!: number;

  @Column({ name: 'faixa_etaria', type: 'varchar', nullable: true })
  faixaEtaria!: string | null;

  @Column({ type: 'varchar', nullable: true })
  turno!: string | null;

  @Column({ type: 'text', nullable: true })
  descricao!: string | null;

  @Column({ type: 'boolean', default: false })
  arquivada!: boolean;

  @ManyToOne(() => Professor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'professor_id' })
  professor!: Professor;
}
