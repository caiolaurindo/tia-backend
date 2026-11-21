import { Entity, Column } from 'typeorm';
import { EntidadeGenerica } from './base.entity';

/**
 * Perfis de acesso suportados pelo RBAC da aplicação.
 *
 * @author caiolaurindo
 */
export enum RoleUsuario {
  PROFESSOR = 'PROFESSOR',
  ADMIN = 'ADMIN',
}

/**
 * @author moisesaraujo
 * @author caiolaurindo (adição de role e ativo para RBAC)
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
    enum: RoleUsuario,
    default: RoleUsuario.PROFESSOR,
  })
  role!: RoleUsuario;

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;
}
