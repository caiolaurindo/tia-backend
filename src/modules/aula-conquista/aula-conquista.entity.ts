import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { EntidadeGenerica } from '../../common/base/base.entity';
import { Aula } from '../aula/aula.entity';
import { Conquista } from '../conquista/conquista.entity';

/**
 * Entidade que associa uma Conquista pedagógica a uma determinada Aula,
 * permitindo que a professora defina a meta/critério esperado para aquela aula.
 * 
 * @author caiolaurindo
 */
@Entity('aula_conquista')
export class AulaConquista extends EntidadeGenerica {
  @ManyToOne(() => Aula, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'aula_id' })
  aula!: Aula;

  @ManyToOne(() => Conquista, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conquista_id' })
  conquista!: Conquista;

  @Column({ type: 'text', nullable: true })
  meta?: string;
}

