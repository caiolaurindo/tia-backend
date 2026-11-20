import { PayloadToken } from './jwt.util';

/**
 * @author moisesaraujo
 */

declare global {
  namespace Express {
    interface Request {
      usuario?: PayloadToken;
    }

    interface Locals {
      validatedQuery?: any;
      validatedParams?: any;
    }
  }
}
