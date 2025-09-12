// Registro / Login / Google Sign-In / Perfil / Forgot-Reset
import type { Request, Response } from 'express';
import { prisma } from '../services/prisma.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../env.js';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'node:crypto';

const googleClient = env.GOOGLE_CLIENT_ID ? new OAuth2Client(env.GOOGLE_CLIENT_ID) : null;
const sign = (id: string) => jwt.sign({ sub: id }, env.JWT_SECRET, { expiresIn: '7d' });

export async function register(req: Request, res: Response) {
  try {
    const { email, password, name } = req.body as { email: string; password: string; name?: string; };
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ message: 'Email ya registrado' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, name, passwordHash } });
    return res.status(201).json({ token: sign(user.id), user: { id: user.id, email: user.email, name: user.name ?? undefined } });
  } catch (e) {
    console.error('register error', e);
    return res.status(500).json({ message: 'Error al registrar' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) return res.status(401).json({ message: 'Credenciales inválidas' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Credenciales inválidas' });
    return res.json({ token: sign(user.id), user: { id: user.id, email: user.email, name: user.name ?? undefined } });
  } catch (e) {
    console.error('login error', e);
    return res.status(500).json({ message: 'Error al iniciar sesión' });
  }
}

export async function googleLogin(req: Request, res: Response) {
  try {
    if (!googleClient || !env.GOOGLE_CLIENT_ID) return res.status(503).json({ message: 'Google Sign-In no está configurado' });
    const { idToken } = req.body as { idToken: string };
    const ticket = await googleClient.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.email) return res.status(401).json({ message: 'Token inválido' });

    const email = payload.email!, googleId = payload.sub!, name = payload.name ?? undefined;
    let user = await prisma.user.findFirst({ where: { OR: [{ email }, { googleId }] } });
    if (!user) user = await prisma.user.create({ data: { email, googleId, name } });
    else if (!user.googleId) user = await prisma.user.update({ where: { id: user.id }, data: { googleId } });

    return res.json({ token: sign(user.id), user: { id: user.id, email: user.email, name: user.name ?? undefined } });
  } catch (e) {
    console.error('googleLogin error', e);
    return res.status(401).json({ message: 'No se pudo verificar el token de Google' });
  }
}

export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: (req as any).userId } });
  if (!user) return res.sendStatus(404);
  return res.json({ id: user.id, email: user.email, name: user.name ?? undefined });
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body as { email: string };
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) return res.json({ ok: true });
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 1000 * 60 * 30);
  await prisma.passwordResetToken.create({ data: { token, userId: user.id, expiresAt: expires } });
  return res.json({ ok: true, tokenDev: token, expiresAt: expires });
}

export async function resetPassword(req: Request, res: Response) {
  const { token, newPassword } = req.body as { token: string; newPassword: string };
  const row = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!row || row.usedAt || row.expiresAt < new Date()) return res.status(400).json({ message: 'Token inválido o expirado' });
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.$transaction([
    prisma.user.update({ where: { id: row.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
  ]);
  return res.json({ ok: true });
}
