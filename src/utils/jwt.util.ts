/**
 * @description Utilitário para assinar e verificar JSON Web Tokens (JWT).
 * Lê o segredo e o tempo de expiração do arquivo .env configurado.
 * 
 * @author moisesaraujo
 */

import jwt from 'jsonwebtoken';
import { AppError } from './app-error';

export interface PayloadToken {
  sub: number; 
  email: string;
}

export class JwtUtil {
  private static getSecret(): string {
    const secret = process.env.JWT_SECRET?.trim();
    if (!secret) {
      throw new Error('Variável de ambiente JWT_SECRET não configurada.');
    }
    return secret;
  }

  public static gerarToken(payload: PayloadToken): string {
    return jwt.sign(payload, this.getSecret(), {
      expiresIn: (process.env.JWT_EXPIRATION || '1d') as import('jsonwebtoken').SignOptions['expiresIn'],
    });
  }

  public static verificarToken(token: string): PayloadToken {
    const secret = this.getSecret();
    try {
      return jwt.verify(token, secret) as unknown as PayloadToken;
    } catch {
      throw new AppError('Token inválido ou expirado.', 401);
    }
  }
}
