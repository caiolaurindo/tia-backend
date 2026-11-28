import { MigrationInterface, QueryRunner } from "typeorm";

export class CriarSchemaInicial1795824291843 implements MigrationInterface {
    name = 'CriarSchemaInicial1795824291843'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "professor" ("id" SERIAL NOT NULL, "criado_em" TIMESTAMP NOT NULL DEFAULT now(), "atualizado_em" TIMESTAMP NOT NULL DEFAULT now(), "nome" character varying NOT NULL, "email" character varying NOT NULL, "senha_hash" character varying NOT NULL, CONSTRAINT "UQ_492e744e6333071da912c7d651b" UNIQUE ("email"), CONSTRAINT "PK_39a6c8f16280dc3bc3ffdc41e02" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "turma" ("id" SERIAL NOT NULL, "criado_em" TIMESTAMP NOT NULL DEFAULT now(), "atualizado_em" TIMESTAMP NOT NULL DEFAULT now(), "nome" character varying NOT NULL, "serie" character varying NOT NULL, "ano_letivo" integer NOT NULL, "faixa_etaria" character varying, "turno" character varying, "descricao" text, "arquivada" boolean NOT NULL DEFAULT false, "professor_id" integer, CONSTRAINT "PK_b7da8685b4c588d7bb0c3b30930" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."aluno_situacao_enum" AS ENUM('NO_RITMO', 'DESTAQUE', 'ATENCAO')`);
        await queryRunner.query(`CREATE TABLE "aluno" ("id" SERIAL NOT NULL, "criado_em" TIMESTAMP NOT NULL DEFAULT now(), "atualizado_em" TIMESTAMP NOT NULL DEFAULT now(), "nome" character varying NOT NULL, "data_nascimento" date NOT NULL, "responsavel" character varying, "situacao" "public"."aluno_situacao_enum" NOT NULL DEFAULT 'NO_RITMO', "observacoes" text, "turma_id" integer, CONSTRAINT "PK_9611d4cf7a77574063439cf46b2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "aula" ("id" SERIAL NOT NULL, "criado_em" TIMESTAMP NOT NULL DEFAULT now(), "atualizado_em" TIMESTAMP NOT NULL DEFAULT now(), "nome" character varying NOT NULL, "assunto" character varying NOT NULL, "data" date NOT NULL, "horario_inicio" TIME, "horario_fim" TIME, "status" character varying NOT NULL DEFAULT 'planejada', "atividades" json, "turma_id" integer, "professor_id" integer, CONSTRAINT "PK_f4b5d2e277c6146e2572c6ee76a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."conquista_categoria_enum" AS ENUM('speaking', 'listening', 'grammar', 'vocabulary', 'reading', 'writing')`);
        await queryRunner.query(`CREATE TABLE "conquista" ("id" SERIAL NOT NULL, "criado_em" TIMESTAMP NOT NULL DEFAULT now(), "atualizado_em" TIMESTAMP NOT NULL DEFAULT now(), "nome" character varying(150) NOT NULL, "descricao" text, "categoria" "public"."conquista_categoria_enum" NOT NULL DEFAULT 'vocabulary', "nivel" character varying(10), "ativa" boolean NOT NULL DEFAULT true, "professor_id" integer, CONSTRAINT "UQ_4dcdcb1ed751e97a26350b05e16" UNIQUE ("professor_id", "nome"), CONSTRAINT "PK_012e7af531960c070c7e098d30e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "registro" ("id" SERIAL NOT NULL, "criado_em" TIMESTAMP NOT NULL DEFAULT now(), "atualizado_em" TIMESTAMP NOT NULL DEFAULT now(), "aluno_id" integer NOT NULL, "aula_id" integer, "conquista_id" integer, "data" date NOT NULL, "participacao" text, "realizou_atividade" text, "seguiu_comandos" text, "dificuldades" text, "observacoes_livres" text, CONSTRAINT "PK_68115a72117fce58864e9bf6509" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "turma_conquista" ("id" SERIAL NOT NULL, "criado_em" TIMESTAMP NOT NULL DEFAULT now(), "atualizado_em" TIMESTAMP NOT NULL DEFAULT now(), "turma_id" integer NOT NULL, "conquista_id" integer NOT NULL, CONSTRAINT "UQ_c12693f7b03d0fe025cfe386170" UNIQUE ("turma_id", "conquista_id"), CONSTRAINT "PK_9f5913ceb473fd529d1ee98b98e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."aluno_conquista_status_enum" AS ENUM('NAO_TRABALHADO', 'EM_DESENVOLVIMENTO', 'EM_DESENVOLVIMENTO_AVANCADO', 'CONQUISTADO')`);
        await queryRunner.query(`CREATE TABLE "aluno_conquista" ("id" SERIAL NOT NULL, "criado_em" TIMESTAMP NOT NULL DEFAULT now(), "atualizado_em" TIMESTAMP NOT NULL DEFAULT now(), "aluno_id" integer NOT NULL, "conquista_id" integer NOT NULL, "status" "public"."aluno_conquista_status_enum" NOT NULL DEFAULT 'NAO_TRABALHADO', "data_conquista" date, "observacao" text, CONSTRAINT "UQ_94f7151ab9829910ff9a389917a" UNIQUE ("aluno_id", "conquista_id"), CONSTRAINT "PK_a0caca86f63596d58e016f022b2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "aula_conquista" ("id" SERIAL NOT NULL, "criado_em" TIMESTAMP NOT NULL DEFAULT now(), "atualizado_em" TIMESTAMP NOT NULL DEFAULT now(), "meta" text, "aula_id" integer, "conquista_id" integer, CONSTRAINT "UQ_8cb5bc96534af66e407c09fe87a" UNIQUE ("aula_id", "conquista_id"), CONSTRAINT "PK_6f1f541ff3049e421745be2bed8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "turma" ADD CONSTRAINT "FK_af57dd6a25d0f7e93b67de3381a" FOREIGN KEY ("professor_id") REFERENCES "professor"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "aluno" ADD CONSTRAINT "FK_dccb2af8f6c092f820c4dcc9aa0" FOREIGN KEY ("turma_id") REFERENCES "turma"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "aula" ADD CONSTRAINT "FK_81fa5c5dcf8dbfda0d420ba8293" FOREIGN KEY ("turma_id") REFERENCES "turma"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "aula" ADD CONSTRAINT "FK_4ea35e6d4fe8cf54a4c1d04638b" FOREIGN KEY ("professor_id") REFERENCES "professor"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conquista" ADD CONSTRAINT "FK_01b27aa2ce7c47034749266b851" FOREIGN KEY ("professor_id") REFERENCES "professor"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "registro" ADD CONSTRAINT "FK_5abc98c1e4c5e787d61954ed431" FOREIGN KEY ("aluno_id") REFERENCES "aluno"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "registro" ADD CONSTRAINT "FK_3dbdce5c3f198f36ca1ea5b5da9" FOREIGN KEY ("aula_id") REFERENCES "aula"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "registro" ADD CONSTRAINT "FK_a2d166875c4cf81ed24fe8520d4" FOREIGN KEY ("conquista_id") REFERENCES "conquista"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "turma_conquista" ADD CONSTRAINT "FK_6b8cd2c641d9b29e3d14beabad4" FOREIGN KEY ("turma_id") REFERENCES "turma"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "turma_conquista" ADD CONSTRAINT "FK_d26724c6212317840c79d27f5b3" FOREIGN KEY ("conquista_id") REFERENCES "conquista"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "aluno_conquista" ADD CONSTRAINT "FK_9c7bebd70c33a036a9be9b13a2f" FOREIGN KEY ("aluno_id") REFERENCES "aluno"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "aluno_conquista" ADD CONSTRAINT "FK_d7823aa7628fb39a3547337821c" FOREIGN KEY ("conquista_id") REFERENCES "conquista"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "aula_conquista" ADD CONSTRAINT "FK_71f5bfaccf037900f9ee953ea51" FOREIGN KEY ("aula_id") REFERENCES "aula"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "aula_conquista" ADD CONSTRAINT "FK_c3d2a21258c6343aee709ca1204" FOREIGN KEY ("conquista_id") REFERENCES "conquista"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "aula_conquista" DROP CONSTRAINT "FK_c3d2a21258c6343aee709ca1204"`);
        await queryRunner.query(`ALTER TABLE "aula_conquista" DROP CONSTRAINT "FK_71f5bfaccf037900f9ee953ea51"`);
        await queryRunner.query(`ALTER TABLE "aluno_conquista" DROP CONSTRAINT "FK_d7823aa7628fb39a3547337821c"`);
        await queryRunner.query(`ALTER TABLE "aluno_conquista" DROP CONSTRAINT "FK_9c7bebd70c33a036a9be9b13a2f"`);
        await queryRunner.query(`ALTER TABLE "turma_conquista" DROP CONSTRAINT "FK_d26724c6212317840c79d27f5b3"`);
        await queryRunner.query(`ALTER TABLE "turma_conquista" DROP CONSTRAINT "FK_6b8cd2c641d9b29e3d14beabad4"`);
        await queryRunner.query(`ALTER TABLE "registro" DROP CONSTRAINT "FK_a2d166875c4cf81ed24fe8520d4"`);
        await queryRunner.query(`ALTER TABLE "registro" DROP CONSTRAINT "FK_3dbdce5c3f198f36ca1ea5b5da9"`);
        await queryRunner.query(`ALTER TABLE "registro" DROP CONSTRAINT "FK_5abc98c1e4c5e787d61954ed431"`);
        await queryRunner.query(`ALTER TABLE "conquista" DROP CONSTRAINT "FK_01b27aa2ce7c47034749266b851"`);
        await queryRunner.query(`ALTER TABLE "aula" DROP CONSTRAINT "FK_4ea35e6d4fe8cf54a4c1d04638b"`);
        await queryRunner.query(`ALTER TABLE "aula" DROP CONSTRAINT "FK_81fa5c5dcf8dbfda0d420ba8293"`);
        await queryRunner.query(`ALTER TABLE "aluno" DROP CONSTRAINT "FK_dccb2af8f6c092f820c4dcc9aa0"`);
        await queryRunner.query(`ALTER TABLE "turma" DROP CONSTRAINT "FK_af57dd6a25d0f7e93b67de3381a"`);
        await queryRunner.query(`DROP TABLE "aula_conquista"`);
        await queryRunner.query(`DROP TABLE "aluno_conquista"`);
        await queryRunner.query(`DROP TYPE "public"."aluno_conquista_status_enum"`);
        await queryRunner.query(`DROP TABLE "turma_conquista"`);
        await queryRunner.query(`DROP TABLE "registro"`);
        await queryRunner.query(`DROP TABLE "conquista"`);
        await queryRunner.query(`DROP TYPE "public"."conquista_categoria_enum"`);
        await queryRunner.query(`DROP TABLE "aula"`);
        await queryRunner.query(`DROP TABLE "aluno"`);
        await queryRunner.query(`DROP TYPE "public"."aluno_situacao_enum"`);
        await queryRunner.query(`DROP TABLE "turma"`);
        await queryRunner.query(`DROP TABLE "professor"`);
    }

}
