import "reflect-metadata";
import { DataSource } from "typeorm";
const dotenv = require("dotenv");

import { Professor } from '../modules/professor/professor.entity';
import { Turma } from '../modules/turma/turma.entity';
import { Registro } from '../modules/registro/registro.entity';
import { Conquista } from '../modules/conquista/conquista.entity';
import { TurmaConquista } from '../modules/turma-conquista/turma-conquista.entity';
import { Aluno } from '../modules/aluno/aluno.entity';
import { AlunoConquista } from '../modules/aluno-conquista/aluno-conquista.entity';
import { Aula } from '../modules/aula/aula.entity';
import { AulaConquista } from '../modules/aula-conquista/aula-conquista.entity';
/**
 * @author moisesaraujo
 * @author caiolaurindo (inclusão das entidades Aula e AulaConquista)
 */

dotenv.config();

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  synchronize: true,
  logging: true,
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
