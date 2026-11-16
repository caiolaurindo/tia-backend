/**
 * @description Limitadores de taxa de requisições (rate limiting) baseados em `express-rate-limit`.
 * Ao exceder o limite, repassa um `AppError` 429 ao middleware global de erros, mantendo o
 * formato de resposta padrão da API: `{ status: 'erro', mensagem }`.
 *
 * @usage Registre no `src/app.ts`:
 * - `app.use(criarLimitadorGeral())` para toda a API;
 * - `app.post('/auth/login', criarLimitadorLogin())` e `app.post('/auth/cadastro', criarLimitadorCadastro())`.
 *
 * Os contadores ficam em memória (por processo) e são chaveados pelo IP do cliente.
 * Atrás de um proxy reverso, configure `TRUST_PROXY` (veja `app.ts`) para que o IP real seja usado.
 */
import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';

export interface OpcoesLimitador {
  windowMs: number;
  limit: number;
  mensagem: string;
  skipSuccessfulRequests?: boolean;
}

const QUINZE_MINUTOS = 15 * 60 * 1000;

export const LIMITES = {
  geral: {
    windowMs: QUINZE_MINUTOS,
    limit: 100,
    mensagem: 'Muitas requisições. Tente novamente mais tarde.',
  },
  login: {
    windowMs: QUINZE_MINUTOS,
    limit: 10,
    // Só tentativas que falham (status >= 400) contam, protegendo contra força bruta
    // sem penalizar quem acerta a senha.
    skipSuccessfulRequests: true,
    mensagem: 'Muitas tentativas de login. Tente novamente em alguns minutos.',
  },
  cadastro: {
    windowMs: QUINZE_MINUTOS,
    limit: 5,
    mensagem: 'Muitas tentativas de cadastro. Tente novamente em alguns minutos.',
  },
} as const;

export const criarLimitador = ({
  windowMs,
  limit,
  mensagem,
  skipSuccessfulRequests = false,
}: OpcoesLimitador): RateLimitRequestHandler =>
  rateLimit({
    windowMs,
    limit,
    skipSuccessfulRequests,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req: Request, _res: Response, next: NextFunction) => {
      next(new AppError(mensagem, 429));
    },
  });

export const criarLimitadorGeral = () => criarLimitador(LIMITES.geral);
export const criarLimitadorLogin = () => criarLimitador(LIMITES.login);
export const criarLimitadorCadastro = () => criarLimitador(LIMITES.cadastro);
