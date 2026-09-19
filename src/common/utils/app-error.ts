/**
 * @description Classe utilitária para padronizar os erros operacionais (conhecidos) da aplicação.
 * Permite lançar exceções informando a mensagem e o código de status HTTP correspondente (ex: 400, 404).
 * 
 * @usage Utilize dentro de Services ou Controllers para interromper o fluxo com um erro.
 * Exemplo: `if (!aluno) throw new AppError('Aluno não encontrado', 404);`
 */


/**
 * @author moisesaraujo
 */

export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}