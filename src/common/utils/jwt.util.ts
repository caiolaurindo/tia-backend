/**
 * @description Utilitário para assinar e verificar JSON Web Tokens (JWT).
 * Lê o segredo e o tempo de expiração do arquivo .env configurado.
 */

import jwt from 'jsonwebtoken';
import { AppError } from './app-error';

/**
 * @author moisesaraujo
 */

export interface PayloadToken {
  sub: number; 
  email: string;
}

export class JwtUtil {
  private static getSecret(): string {
    return process.env.JWT_SECRET || 'super_secret_key_pi4';
  }

  public static gerarToken(payload: PayloadToken): string {
    return jwt.sign(payload, this.getSecret(), {
      expiresIn: (process.env.JWT_EXPIRATION || '1d') as import('jsonwebtoken').SignOptions['expiresIn'],
    });
  }

  public static verificarToken(token: string): PayloadToken {
    try {
      return jwt.verify(token, this.getSecret()) as unknown as PayloadToken;
    } catch {
      throw new AppError('Token inválido ou expirado.', 401);
    }
  }
}