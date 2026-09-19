import { PayloadToken } from '../utils/jwt.util';

/**
 * @author moisesaraujo
 */

declare global {
  namespace Express {
    interface Request {
      usuario?: PayloadToken; 
    }
  }
}