import app from './app';
import { AppDataSource } from './data/data-source';
import 'reflect-metadata';

/**
 * @author moisesaraujo
 */

const PORTA = process.env.PORT;

async function inicializarServidor() {
  try {
    
    await AppDataSource.initialize();
    console.log('conectado ao banco de dados MySQL via TypeORM!');

    
    app.listen(PORTA, () => {
      console.log(`Servidor Express rodando na porta ${PORTA}`);
    });
  } catch (erro) {
    console.error('Erro ao inicializar a aplicação:', erro);
    process.exit(1); 
  }
}

inicializarServidor();