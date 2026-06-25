import { Router } from 'express';
import { RegisterInput, LoginInput } from '@nivix/shared';
import { prisma } from '../db';
import { hashPassword, verifyPassword } from '../auth/password';
import { signToken } from '../auth/jwt';
import { requireAuth } from '../middleware/auth';

export const authRouter = Router();

authRouter.post('/auth/register', async (req, res) => {
  const parsed = RegisterInput.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_input', details: parsed.error.flatten() });
  }
  const { email, password, type, country, phone } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'email_taken' });

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(password),
      type,
      country,
      phone,
      status: 'active',
    },
  });

  const token = signToken({ sub: user.id, role: user.role, type: user.type });
  return res.status(201).json({
    token,
    user: { id: user.id, email: user.email, type: user.type, role: user.role },
  });
});

authRouter.post('/auth/login', async (req, res) => {
  const parsed = LoginInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }

  const token = signToken({ sub: user.id, role: user.role, type: user.type });
  return res.json({
    token,
    user: { id: user.id, email: user.email, type: user.type, role: user.role },
  });
});

authRouter.get('/auth/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
  if (!user) return res.status(404).json({ error: 'not_found' });
  return res.json({
    id: user.id,
    email: user.email,
    type: user.type,
    role: user.role,
    status: user.status,
    country: user.country,
  });
});
