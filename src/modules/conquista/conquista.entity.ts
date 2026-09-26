import { Entity, Column } from 'typeorm';
import { EntidadeGenerica } from '../../common/base/base.entity';

@Entity('conquista')
export class Conquista extends EntidadeGenerica {
  @Column({ type: 'varchar', length: 150, unique: true })
  nome!: string;

  @Column({ type: 'text', nullable: true })
  descricao?: string;
}