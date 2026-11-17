import { Request, Response, NextFunction } from 'express';
import { Role } from '../enums/role.enum';
import { PayloadToken } from '../utils/jwt.util'; // Importe a interface do PayloadToken

interface AuthenticatedRequest extends Request {
  usuario?: PayloadToken & {
    ativo: boolean; // Garante que o 'ativo' também esteja presente
  };
}

export const autorizar = (rolesPermitidas: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const usuario = req.usuario; // Alterado de req.user para req.usuario

    if (!usuario) {
      res.status(401).json({ error: 'Não autorizado. Token não fornecido ou inválido.' });
      return;
    }

    if (!usuario.ativo) {
      res.status(403).json({ error: 'Acesso negado. Usuário inativo.' });
      return;
    }


    const temPermissao = rolesPermitidas.includes(usuario.role);

    if (!temPermissao) {
      res.status(403).json({ error: 'Acesso negado. Você não possui permissão para esta rota.' });
      return;
    }

    next();
  };
};