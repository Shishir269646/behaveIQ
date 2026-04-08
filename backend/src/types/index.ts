import { Request } from 'express';
import { User, Website, Session, UserRole } from '@prisma/client';

export type UserWithoutPassword = Omit<User, 'password'>;

export interface AuthenticatedRequest extends Request {
  user?: UserWithoutPassword | null;
  website?: Website | null;
  session?: Session | null;
}
