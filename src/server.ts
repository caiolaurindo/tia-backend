import 'dotenv/config';
import app from './app';
import { AppDataSource } from './data/data-source';
import 'reflect-metadata';

/**
 * @author moisesaraujo
 */

const PORTA = process.env.PORT;

async function inicializarServidor() {
  try {
    if (!process.env.JWT_SECRET?.trim()) {
      throw new Error('Variável de ambiente JWT_SECRET é obrigatória.');
    }

    if (!process.env.DATABASE_URL?.trim()) {
      throw new Error('Variável de ambiente DATABASE_URL é obrigatória (string de conexão do NeonDB).');
    }

    await AppDataSource.initialize();
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