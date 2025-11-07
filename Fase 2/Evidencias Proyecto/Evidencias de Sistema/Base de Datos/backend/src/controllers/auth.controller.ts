// backend/src/controllers/auth.controller.ts
import type { Request, Response } from 'express';
import { prisma } from '../services/prisma.ts';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../env.ts';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'node:crypto';
import { sendWelcomeEmail, sendPasswordResetEmail, sendVerifyEmail } from '../lib/mailer.ts';
import { trackEvent } from '../services/analytics.ts';

const googleClient = env.GOOGLE_CLIENT_ID ? new OAuth2Client(env.GOOGLE_CLIENT_ID) : null;

const signWithRole = (user: { id: string; role?: string | null; email?: string | null }) =>
  jwt.sign(
    {
      sub: user.id,
      role: (user.role || 'USER'),
      is_admin: (user.role || '').toUpperCase() === 'ADMIN',
      email: user.email || undefined,
    },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );

// =============== Registro ===============
export async function register(req: Request, res: Response) {
  try {
    const { email, password, name } = req.body as { email: string; password: string; name?: string };
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ message: 'Email ya registrado' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, name, passwordHash, role: 'USER' },
    });

    // Token verificación (24h)
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);
    await prisma.emailVerifyToken.create({ data: { token, userId: user.id, expiresAt: expires } });

    sendWelcomeEmail(user.email, user.name).catch(() => {});
    const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;
    sendVerifyEmail(user.email, verifyUrl).catch(() => {});

    return res.status(201).json({ ok: true });
  } catch (e) {
    console.error('register error', e);
    return res.status(500).json({ message: 'Error al registrar' });
  }
}

// =============== Login (bloquea no verificados) ===============
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) return res.status(401).json({ message: 'Credenciales inválidas' });

    if (!user.emailVerifiedAt) {
      return res.status(403).json({ message: 'Cuenta no verificada. Revisa tu correo para activar la cuenta.' });
    }
    if (user.deactivatedAt || user.isSuspended) {
      return res.status(403).json({ message: 'Cuenta desactivada o suspendida' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Credenciales inválidas' });

    // Marca login + evento de uso
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    trackEvent(user.id, 'LOGIN', { device: 'WEB' }).catch(() => {});

    return res.json({
      token: signWithRole(user),
      user: { id: user.id, email: user.email, name: user.name ?? undefined, role: user.role ?? 'USER' },
    });
  } catch (e) {
    console.error('login error', e);
    return res.status(500).json({ message: 'Error al iniciar sesión' });
  }
}

// =============== Google Sign-In ===============
export async function googleLogin(req: Request, res: Response) {
  try {
    if (!googleClient || !env.GOOGLE_CLIENT_ID)
      return res.status(503).json({ message: 'Google Sign-In no está configurado' });

    const { idToken } = req.body as { idToken: string };
    const ticket = await googleClient.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.email) return res.status(401).json({ message: 'Token inválido' });

    const email = payload.email!, googleId = payload.sub!, name = payload.name ?? undefined;
    let user = await prisma.user.findFirst({ where: { OR: [{ email }, { googleId }] } });
    if (!user) {
      user = await prisma.user.create({
        data: { email, googleId, name, emailVerifiedAt: new Date(), role: 'USER', lastLoginAt: new Date() },
      });
    } else {
      const data: any = { googleId, lastLoginAt: new Date() };
      if (!user.emailVerifiedAt) data.emailVerifiedAt = new Date();
      user = await prisma.user.update({ where: { id: user.id }, data });
    }

    trackEvent(user.id, 'LOGIN', { device: 'WEB' }).catch(() => {});

    return res.json({
      token: signWithRole(user),
      user: { id: user.id, email: user.email, name: user.name ?? undefined, role: user.role ?? 'USER' },
    });
  } catch (e) {
    console.error('googleLogin error', e);
    return res.status(401).json({ message: 'No se pudo verificar el token de Google' });
  }
}

// =============== Perfil ===============
export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: (req as any).userId } });
  if (!user) return res.sendStatus(404);
  return res.json({
    id: user.id,
    email: user.email,
    name: user.name ?? undefined,
    picture: user.picture ?? undefined,
    role: user.role ?? 'USER',
    plan: (user.plan as 'BASIC' | 'PLUS') ?? 'BASIC',
  });
}

// =============== Forgot / Reset ===============
export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body as { email: string };
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) return res.json({ ok: true });

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 1000 * 60 * 30);
  await prisma.passwordResetToken.create({ data: { token, userId: user.id, expiresAt: expires } });

  const link = `${env.FRONTEND_URL}/reset-password?token=${token}`;
  sendPasswordResetEmail(user.email, link).catch(() => {});
  return res.json({ ok: true });
}

export async function resetPassword(req: Request, res: Response) {
  const { token, newPassword } = req.body as { token: string; newPassword: string };
  const row = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!row || row.usedAt || row.expiresAt < new Date())
    return res.status(400).json({ message: 'Token inválido o expirado' });

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.$transaction([
    prisma.user.update({ where: { id: row.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
  ]);
  return res.json({ ok: true });
}

// =============== Verify ===============
export async function verifyEmail(req: Request, res: Response) {
  const { token } = req.body as { token: string };
  const row = await prisma.emailVerifyToken.findUnique({ where: { token } });
  if (!row || row.usedAt || row.expiresAt < new Date()) {
    return res.status(400).json({ message: 'Token inválido o expirado' });
  }
  await prisma.$transaction([
    prisma.user.update({ where: { id: row.userId }, data: { emailVerifiedAt: new Date() } }),
    prisma.emailVerifyToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
  ]);
  return res.json({ ok: true });
}

export async function resendVerify(req: Request, res: Response) {
  const { email } = req.body as { email: string };
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.json({ ok: true });
  if (user.emailVerifiedAt) return res.json({ ok: true });

  await prisma.emailVerifyToken.updateMany({
    where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
    data: { expiresAt: new Date() },
  });

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);
  await prisma.emailVerifyToken.create({ data: { token, userId: user.id, expiresAt: expires } });

  const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;
  sendVerifyEmail(user.email, verifyUrl).catch(() => {});
  return res.json({ ok: true });
}
