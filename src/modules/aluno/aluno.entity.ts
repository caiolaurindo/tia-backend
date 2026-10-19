  import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
  import { EntidadeGenerica } from '../../common/base/base.entity';
  import { Turma } from '../turma/turma.entity';

  /**
   * @author moisesaraujo
   */

  @Entity('aluno')
  export class Aluno extends EntidadeGenerica {
    @Column({ type: 'varchar' })
    nome!: string;

    @Column({ name: 'data_nascimento', type: 'date', nullable: true })
    dataNascimento?: string;

    @Column({ name: 'observacoes_gerais', type: 'text', nullable: true })
    observacoesGerais?: string;

    @ManyToOne(() => Turma, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'turma_id' })
    turma!: Turma;
  }
