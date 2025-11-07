// src/controllers/admin.controller.ts
import type { Request, Response } from 'express';
import { prisma } from '../services/prisma.ts';

const ROLES = new Set(['ADMIN', 'ANALYST', 'USER']);

export async function listUsers(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page || 1));
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize || 20)));

  // Acepta ?q= o ?search=
  const q = String((req.query.q ?? req.query.search) || '').trim();
  const role = String(req.query.role || '').toUpperCase();
  const verified = String(req.query.verified || '').toLowerCase();
  const plan = String(req.query.plan || '').toUpperCase();
  const commune = String(req.query.commune || '').trim();

  const where: any = {};
  if (q) {
    // En SQLite no existe mode:'insensitive' para contains; usamos contains simple.
    where.OR = [
      { email: { contains: q } },
      { name: { contains: q } },
    ];
  }
  if (role && ROLES.has(role)) where.role = role;
  if (verified === 'true') where.emailVerifiedAt = { not: null };
  if (verified === 'false') where.emailVerifiedAt = null;
  if (plan === 'PLUS' || plan === 'BASIC') where.plan = plan;
  if (commune) where.commune = { contains: commune };

  const [total, items] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        city: true,
        commune: true,
        region: true,
        deactivatedAt: true,
        isSuspended: true,
        plan: true,
        createdAt: true,
      },
    }),
  ]);

  return res.json({ total, page, pageSize, items, data: items });
}

export async function getUser(req: Request, res: Response) {
  const id = String(req.params.id);
  const u = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      emailVerifiedAt: true,
      lastLoginAt: true,
      city: true,
      commune: true,
      region: true,
      deactivatedAt: true,
      isSuspended: true,
      plan: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!u) return res.status(404).json({ message: 'Usuario no encontrado' });
  return res.json(u);
}

export async function setRole(req: Request, res: Response) {
  const { userId, role } = req.body as { userId: string; role: string };
  const r = String(role || '').toUpperCase();
  if (!ROLES.has(r)) return res.status(400).json({ message: 'Rol inválido' });

  const u = await prisma.user.update({ where: { id: userId }, data: { role: r } });
  return res.json({ ok: true, user: { id: u.id, role: u.role } });
}

export async function verifyManually(req: Request, res: Response) {
  const { userId } = req.body as { userId: string };
  await prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
  return res.json({ ok: true });
}

export async function deactivate(req: Request, res: Response) {
  const { userId } = req.body as { userId: string };
  await prisma.user.update({ where: { id: userId }, data: { deactivatedAt: new Date() } });
  return res.json({ ok: true });
}

export async function reactivate(req: Request, res: Response) {
  const { userId } = req.body as { userId: string };
  await prisma.user.update({ where: { id: userId }, data: { deactivatedAt: null } });
  return res.json({ ok: true });
}

export async function suspend(req: Request, res: Response) {
  const { userId } = req.body as { userId: string };
  await prisma.user.update({ where: { id: userId }, data: { isSuspended: true } });
  return res.json({ ok: true });
}

export async function unsuspend(req: Request, res: Response) {
  const { userId } = req.body as { userId: string };
  await prisma.user.update({ where: { id: userId }, data: { isSuspended: false } });
  return res.json({ ok: true });
}
