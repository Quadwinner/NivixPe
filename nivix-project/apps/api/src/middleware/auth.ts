import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../auth/jwt';
import { prisma } from '../db';

// Require a valid Bearer JWT; populates req.user.
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'missing_token' });
  }
  try {
    req.user = verifyToken(header.slice('Bearer '.length));
    return next();
  } catch {
    return res.status(401).json({ error: 'invalid_token' });
  }
}

// Require one of the given roles (use after requireAuth).
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'forbidden' });
    }
    return next();
  };
}

// Gate money-moving endpoints on an approved KYC (used in Phase 2).
export async function requireApprovedKyc(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
  const kyc = await prisma.kycRecord.findUnique({ where: { userId: req.user.sub } });
  if (!kyc || kyc.status !== 'approved') {
    return res.status(403).json({ error: 'kyc_required', status: kyc?.status ?? 'not_started' });
  }
  return next();
}
