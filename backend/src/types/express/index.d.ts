import { User, Website } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: Partial<User> | null;
      website?: Partial<Website> | null;
    }
  }
}
