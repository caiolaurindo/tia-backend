import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { EntidadeGenerica } from '../../common/base/base.entity';
import { Aluno } from '../aluno/aluno.entity';
import { Aula } from '../aula/aula.entity';

/**
 * @author josiellysantos
 */

@Entity('registro')
export class Registro extends EntidadeGenerica {
  @Column({ name: 'aluno_id', type: 'int' })
  alunoId!: number;

  @Column({ name: 'aula_id', type: 'int' })
  aulaId!: number;

  @Column({ type: 'date' })
  data!: Date | string;

  @Column({ type: 'text', nullable: true })
  participacao?: string | null;

  @Column({ name: 'realizou_atividade', type: 'text', nullable: true })
  realizouAtividade?: string | null;

  @Column({ name: 'seguiu_comandos', type: 'text', nullable: true })
  seguiuComandos?: string | null;

  @Column({ type: 'text', nullable: true })
  dificuldades?: string | null;

  @Column({ name: 'observacoes_livres', type: 'text', nullable: true })
  observacoesLivres?: string | null;

  @ManyToOne(() => Aluno, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'aluno_id' })
  aluno!: Aluno;

  @ManyToOne(() => Aula, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'aula_id' })
  aula!: Aula;
}