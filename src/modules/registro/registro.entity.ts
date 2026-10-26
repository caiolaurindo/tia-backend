import { Entity, Column } from 'typeorm';
import { EntidadeGenerica } from '../../common/base/base.entity';

/**
 * @author josiellysantos
 */

@Entity('registro')
export class Registro extends EntidadeGenerica {
  @Column({ name: 'aluno_id', type: 'bigint' })
  alunoId!: number;

  @Column({ name: 'aula_id', type: 'bigint' })
  aulaId!: number;

  @Column({ type: 'date' })
  data!: Date;

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
}