// backend/src/controllers/admin.controller.ts
import type { Request, Response } from 'express';
import { prisma } from '../services/prisma.ts';
import crypto from 'node:crypto';

const ROLES = new Set(['ADMIN', 'ANALYST', 'USER']);
const PLANS = new Set(['BASIC', 'PLUS']);

// ---------- Listado ----------
export async function listUsers(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page || 1));
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize || 20)));

  // Acepta ?q= o ?search=
  const q = String((req.query.q ?? req.query.search) || '').trim();
  const role = String(req.query.role || '').toUpperCase();
  const verified = String(req.query.verified || '').toLowerCase(); // "true"/"false"
  const plan = String(req.query.plan || '').toUpperCase();
  const commune = String(req.query.commune || '').trim();

  const where: any = {};
  if (q) {
    // SQLite: contains sin mode:'insensitive'
    where.OR = [
      { email: { contains: q } },
      { name: { contains: q } },
      { city: { contains: q } },
      { commune: { contains: q } },
      { region: { contains: q } },
    ];
  }
  if (role && ROLES.has(role)) where.role = role;
  if (verified === 'true') where.emailVerifiedAt = { not: null };
  if (verified === 'false') where.emailVerifiedAt = null;
  if (plan && PLANS.has(plan)) where.plan = plan;
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
        updatedAt: true,
      },
    }),
  ]);

  return res.json({ total, page, pageSize, items, data: items });
}

// ---------- Detalle ----------
export async function getUserById(req: Request, res: Response) {
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

// ---------- Update parcial ----------
export async function updateUserById(req: Request, res: Response) {
  const id = String(req.params.id);
  const body = req.body ?? {};

  const data: any = {};

  if (typeof body.role === 'string' && body.role) {
    const r = String(body.role).toUpperCase();
    if (!ROLES.has(r)) return res.status(400).json({ message: `Rol inválido: ${r}` });
    data.role = r;
  }

  if (typeof body.plan === 'string') {
    const p = String(body.plan || '').toUpperCase();
    if (p && !PLANS.has(p)) return res.status(400).json({ message: `Plan inválido: ${p}` });
    data.plan = p || null; // permitir null para limpiar
  }

  if (typeof body.isSuspended === 'boolean') {
    data.isSuspended = !!body.isSuspended;
  }

  if (typeof body.deactivated === 'boolean') {
    data.deactivatedAt = body.deactivated ? new Date() : null;
  }

  try {
    const updated = await prisma.user.update({ where: { id }, data });
    return res.json(updated);
  } catch (e: any) {
    if (e?.code === 'P2025') return res.status(404).json({ message: 'Usuario no encontrado' });
    throw e;
  }
}

// ---------- Verificación de email ----------
export async function verifyEmailById(req: Request, res: Response) {
  const id = String(req.params.id);
  try {
    const updated = await prisma.user.update({ where: { id }, data: { emailVerifiedAt: new Date() } });
    return res.json({ ok: true, emailVerifiedAt: updated.emailVerifiedAt });
  } catch (e: any) {
    if (e?.code === 'P2025') return res.status(404).json({ message: 'Usuario no encontrado' });
    throw e;
  }
}

// ---------- Reset de contraseña (sin dependencias externas) ----------
export async function resetPasswordById(req: Request, res: Response) {
  const id = String(req.params.id);
  const { newPassword } = (req.body || {}) as { newPassword?: string };
  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    return res.status(400).json({ error: 'newPassword debe tener al menos 8 caracteres' });
  }

  try {
    // pbkdf2 con SHA-256 — formato: pbkdf2$<iterations>$<salt>$<hashhex>
    const iterations = 310_000;
    const salt = crypto.randomBytes(16).toString('hex');
    const derived = crypto.pbkdf2Sync(newPassword, salt, iterations, 32, 'sha256').toString('hex');
    const passwordHash = `pbkdf2$${iterations}$${salt}$${derived}`;

    try {
      await prisma.user.update({ where: { id }, data: { passwordHash } as any });
      return res.json({ ok: true });
    } catch (inner: any) {
      if (inner?.code === 'P2025') {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      // El modelo User podría no tener passwordHash: devolvemos 501 para que lo conectes a tu sistema de credenciales.
      return res.status(501).json({
        error: 'Not Implemented',
        hint: 'Agrega el campo passwordHash en el modelo User o conecta este endpoint con tu tabla/servicio de credenciales.',
      });
    }
  } catch (e: any) {
    return res.status(500).json({ error: 'Failed to reset password' });
  }
}

// ---------- LEGACY (compatibilidad con frontend anterior) ----------
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
