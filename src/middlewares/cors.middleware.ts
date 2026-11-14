import cors, { CorsOptionsDelegate } from 'cors';
import { Request } from 'express';
import { AppError } from '../utils/app-error';

const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8081',
  'http://127.0.0.1:8081',
];

function getAllowedOrigins(): string[] {
  return process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : defaultOrigins;
}

const corsOptionsDelegate: CorsOptionsDelegate<Request> = (req, callback) => {
  const origin = req.headers.origin;
  const allowedOrigins = getAllowedOrigins();

  // Permite requisições sem 'Origin' (Expo/React Native nativo, mobile, cURL, Postman)
  if (!origin) {
    return callback(null, { origin: true, credentials: true });
  }

  if (allowedOrigins.includes(origin)) {
    return callback(null, {
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      optionsSuccessStatus: 204,
    });
  }

  const clientIp = req.ip || req.socket?.remoteAddress || 'desconhecido';
  const method = req.method;
  const path = req.originalUrl || req.url;

  return callback(
    new AppError(
      `Bloqueio de CORS: Origem '${origin}' não autorizada para o IP ${clientIp} em ${method} ${path}.`,
      403
    )
  );
};

export const corsMiddleware = cors(corsOptionsDelegate);
export default corsMiddleware;
