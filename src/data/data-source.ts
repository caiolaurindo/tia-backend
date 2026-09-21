import "reflect-metadata";
import { DataSource } from "typeorm";
const dotenv = require("dotenv");
import { Professor } from '../modules/professor/professor.entity';
import { Turma } from '../modules/turma/turma.entity';

/**
 * @author moisesaraujo
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
  logging: false,
  entities: [Professor, Turma],
});
