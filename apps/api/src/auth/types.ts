import type { Request } from 'express';

export interface AuthenticatedUser {
  sub: string;
  phone: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
