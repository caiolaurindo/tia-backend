import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { EntidadeGenerica } from '../../common/base/base.entity';
import { Turma } from '../turma/turma.entity';
import { Professor } from '../professor/professor.entity';

/**
 * Entidade que representa uma aula ministrada pela professora.
 * Permite registrar o nome da aula, assunto abordado, data da realização
 * e associação direta com a turma e professora responsável.
 * 
 * @author caiolaurindo
 */
@Entity('aula')
export class Aula extends EntidadeGenerica {
  @Column({ type: 'varchar' })
  nome!: string;

  @Column({ type: 'varchar' })
  assunto!: string;

  @Column({ type: 'date' })
  data!: string | Date;

  @ManyToOne(() => Turma, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'turma_id' })
  turma!: Turma;

  @ManyToOne(() => Professor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'professor_id' })
  professor!: Professor;
}

