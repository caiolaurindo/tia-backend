import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adiciona as colunas de RBAC (`role` e `ativo`) na tabela professor, que existem na
 * entidade Professor mas ficaram de fora da migration inicial.
 * Idempotente: pode rodar com segurança em bancos onde as colunas já foram criadas.
 */
export class AdicionarRoleAtivoProfessor1795830000000 implements MigrationInterface {
    name = 'AdicionarRoleAtivoProfessor1795830000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DO $$ BEGIN CREATE TYPE "public"."professor_role_enum" AS ENUM('PROFESSOR', 'ADMIN'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
        await queryRunner.query(`ALTER TABLE "professor" ADD COLUMN IF NOT EXISTS "role" "public"."professor_role_enum" NOT NULL DEFAULT 'PROFESSOR'`);
        await queryRunner.query(`ALTER TABLE "professor" ADD COLUMN IF NOT EXISTS "ativo" boolean NOT NULL DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "professor" DROP COLUMN IF EXISTS "ativo"`);
        await queryRunner.query(`ALTER TABLE "professor" DROP COLUMN IF EXISTS "role"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."professor_role_enum"`);
    }
}
