/**
 * @description Middlewares de Autenticação e Autorização (RBAC).
 * - `autenticar`: valida o cabeçalho Authorization (JWT), verifica claims de RBAC e bloqueia usuários inativos.
 * - `autorizar`: restringe acesso por perfil (`RoleUsuario`), exigindo uso após `autenticar`.
 *
 * @usage
 * - Rota autenticada para qualquer usuário ativo:
 *   `router.get('/turmas', autenticar, controller);`
 * - Rota restrita a perfis específicos (RBAC):
 *   `router.delete('/:id', autenticar, autorizar(RoleUsuario.ADMIN), controller);`
 *
 * @author moisesaraujo
 * @author caiolaurindo (RBAC: validação de role/ativo e middleware autorizar)
 */
import { Request, Response, NextFunction } from 'express';
import { JwtUtil } from '../utils/jwt.util';
import { AppError } from '../utils/app-error';
import { RoleUsuario } from '../models/professor.entity';

const ROLES_VALIDAS = new Set<string>(Object.values(RoleUsuario));

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

  if (
    typeof payload.ativo !== 'boolean' ||
    typeof payload.role !== 'string' ||
    !ROLES_VALIDAS.has(payload.role)
  ) {
    throw new AppError('Token inválido ou expirado.', 401);
  }

  if (!payload.ativo) {
    throw new AppError('Usuário inativo. Acesso negado.', 403);
  }

  req.usuario = payload;

  next();
};

export const autorizar = (...rolesPermitidas: RoleUsuario[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.usuario) {
      throw new AppError('Usuário não autenticado.', 401);
    }

    if (!req.usuario.ativo) {
      throw new AppError('Usuário inativo. Acesso negado.', 403);
    }

    if (
      rolesPermitidas.length === 0 ||
      !rolesPermitidas.includes(req.usuario.role)
    ) {
      throw new AppError('Acesso negado: permissão insuficiente.', 403);
    }

    next();
  };
};
