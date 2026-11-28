import { DataSource } from 'typeorm';
import { AppDataSource } from './data-source';

/**
 * @description Inicialização única (memoizada) da conexão com o banco.
 * Usada tanto pelo servidor tradicional (`src/server.ts`) quanto pela função serverless
 * da Vercel (`src/vercel.ts`), onde a mesma instância é reaproveitada entre requisições
 * enquanto o container estiver "quente".
 */

const VARIAVEIS_OBRIGATORIAS = ['JWT_SECRET', 'DATABASE_URL'] as const;

export function validarVariaveisDeAmbiente(): void {
  const faltando = VARIAVEIS_OBRIGATORIAS.filter((nome) => !process.env[nome]?.trim());
  if (faltando.length > 0) {
    throw new Error(`Variáveis de ambiente obrigatórias ausentes: ${faltando.join(', ')}.`);
  }
}

let inicializacao: Promise<DataSource> | null = null;

export function conectarBanco(): Promise<DataSource> {
  if (AppDataSource.isInitialized) {
    return Promise.resolve(AppDataSource);
  }

  if (!inicializacao) {
    validarVariaveisDeAmbiente();
    inicializacao = AppDataSource.initialize().catch((erro) => {
      // Libera nova tentativa na próxima requisição em vez de travar a instância no erro.
      inicializacao = null;
      throw erro;
    });
  }

  return inicializacao;
}
