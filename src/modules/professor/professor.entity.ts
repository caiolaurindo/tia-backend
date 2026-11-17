import { Entity, Column } from 'typeorm';
import { EntidadeGenerica } from '../../common/base/base.entity';
import { Role } from '../../common/enums/role.enum';

/**
 * @author moisesaraujo
 */

@Entity('professor')
export class Professor extends EntidadeGenerica {
  @Column({ type: 'varchar' })
  nome!: string;

  @Column({ type: 'varchar', unique: true })
  email!: string;

  @Column({ name: 'senha_hash', type: 'varchar' })
  senhaHash!: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.PROFESSOR,
  })
  role!: Role;

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;
}