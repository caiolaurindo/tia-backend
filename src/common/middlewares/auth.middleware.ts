/**
 * @description Middleware de Autenticação (equivalente ao JwtAuthGuard do NestJS).
 * Valida o cabeçalho Authorization da requisição e extrai os dados do professor.
 * 
 * @usage Proteja rotas privadas adicionando este middleware.
 * Exemplo: `router.get('/turmas', autenticar, controller);`
 */
import { Request, Response, NextFunction } from 'express';
import { JwtUtil } from '../utils/jwt.util';
import { AppError } from '../utils/app-error';

/**
 * @author moisesaraujo
 */

export const autenticar = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError('Token de autenticação não fornecido.', 401);
  }

  const [esquema, token] = authHeader.split(' ');

  if (esquema !== 'Bearer' || !token) {
    throw new AppError('Formato de token inválido.', 401);
  }

  const payload = JwtUtil.verificarToken(token);
  req.usuario = payload;

  next();
};