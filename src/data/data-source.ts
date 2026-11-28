import "reflect-metadata";
import { DataSource } from "typeorm";
import * as neon from "@neondatabase/serverless";
import ws from "ws";
const dotenv = require("dotenv");

import { Professor } from '../models/professor.entity';
import { Turma } from '../models/turma.entity';
import { Registro } from '../models/registro.entity';
import { Conquista } from '../models/conquista.entity';
import { TurmaConquista } from '../models/turma-conquista.entity';
import { Aluno } from '../models/aluno.entity';
import { AlunoConquista } from '../models/aluno-conquista.entity';
import { Aula } from '../models/aula.entity';
import { AulaConquista } from '../models/aula-conquista.entity';

/**
 * @author moisesaraujo
 * @author caiolaurindo (inclusão das entidades Aula e AulaConquista, migração para NeonDB/PostgreSQL)
 */

dotenv.config();

const isDevelopment = process.env.NODE_ENV === "development";

/**
 * DB_DRIVER define como a aplicação fala com o Neon:
 * - "neon" (padrão): driver @neondatabase/serverless via WebSocket na porta 443.
 *   Funciona mesmo em redes que bloqueiam a porta 5432 do Postgres.
 * - "pg": driver TCP tradicional (porta 5432).
 */
const usarDriverNeon = (process.env.DB_DRIVER ?? "neon").toLowerCase() !== "pg";

if (usarDriverNeon) {
  neon.neonConfig.webSocketConstructor = ws;
}

/**
 * Conexão com o PostgreSQL hospedado no NeonDB.
 * O schema é controlado exclusivamente pelas migrations em src/data/migrations
 * (synchronize desligado), executadas com `npm run migration:run`.
 */
export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  ...(usarDriverNeon ? { driver: neon } : { ssl: { rejectUnauthorized: true } }),
  synchronize: false,
  migrationsRun: process.env.DB_MIGRATIONS_RUN === "true",
  logging: isDevelopment,
  migrations: [__dirname + "/migrations/*.{ts,js}"],
  migrationsTableName: "migrations",
  entities: [
    Professor,
    Turma,
    Registro,
    Conquista,
    TurmaConquista,
    Aluno,
    AlunoConquista,
    Aula,
    AulaConquista,
  ],
});
