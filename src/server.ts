import 'dotenv/config';
import 'reflect-metadata';
import app from './app';
import { conectarBanco } from './data/conexao';

/**
 * Servidor tradicional (desenvolvimento local / hospedagem com processo contínuo).
 * Na Vercel o ponto de entrada é `src/vercel.ts`.
 *
 * @author moisesaraujo
 */

const PORTA = process.env.PORT || 3000;

async function inicializarServidor() {
  try {
    await conectarBanco();
    console.log('conectado ao banco de dados PostgreSQL (NeonDB) via TypeORM!');

    app.listen(PORTA, () => {
      console.log(`Servidor Express rodando na porta ${PORTA}`);
    });
  } catch (erro) {
    console.error('Erro ao inicializar a aplicação:', erro);
    process.exit(1);
  }
}

inicializarServidor();
