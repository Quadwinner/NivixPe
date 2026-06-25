import { Router } from 'express';
import { prisma } from '../db';

export const healthRouter = Router();

healthRouter.get('/health', async (_req, res) => {
  const services: Record<string, string> = {};

  try {
    await prisma.$queryRaw`SELECT 1`;
    services.postgres = 'connected';
  } catch {
    services.postgres = 'down';
  }

  const ok = Object.values(services).every((s) => s === 'connected');
  res.status(ok ? 200 : 503).json({
    status: ok ? 'ok' : 'degraded',
    services,
    ts: new Date().toISOString(),
  });
});
