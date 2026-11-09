import "reflect-metadata";
import { DataSource } from "typeorm";
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
