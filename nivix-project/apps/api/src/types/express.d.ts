import type { JwtPayload } from '../auth/jwt';

// Attach the authenticated user to Express requests (set by requireAuth).
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export {};
