import type { Request, Response } from 'express';
import path from 'node:path';
import bcrypt from 'bcrypt';
import { prisma } from '../services/prisma.js';

// Estructura de usuario pública estándar
function publicUser(u: any) {
  return {
    id: u.id,
    email: u.email,
    name: u.name ?? undefined,
    picture: u.picture ?? undefined,
  };
}

/** GET /api/users/me (alias de /api/auth/me, pero incluye picture) */
export async function getMe(req: Request, res: Response) {
  const id = (req as any).userId as string | undefined;
  if (!id) return res.status(401).json({ message: 'No autenticado' });

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.sendStatus(404);
  return res.json(publicUser(user));
}

/** PATCH /api/users/me - Actualiza name y/o picture (acepta JSON o multipart) */
export async function updateMe(req: Request, res: Response) {
  const id = (req as any).userId as string | undefined;
  if (!id) return res.status(401).json({ message: 'No autenticado' });

  const body = (req.body ?? {}) as { name?: string; picture?: string };
  let pictureUrl: string | undefined = body.picture;

  // Si vino archivo via upload.single('picture'), priorizamos el archivo
  const file = (req as any).file as Express.Multer.File | undefined;
  if (file) {
    pictureUrl = `/uploads/${path.basename(file.filename)}`;
  }

  const data: any = {};
  if (typeof body.name === 'string') data.name = body.name.trim();
  if (typeof pictureUrl === 'string') data.picture = pictureUrl;

  if (Object.keys(data).length === 0) {
    const current = await prisma.user.findUnique({ where: { id } });
    return res.json(publicUser(current));
  }

  const updated = await prisma.user.update({ where: { id }, data });
  return res.json(publicUser(updated));
}

/** POST /api/users/change-password */
export async function changePassword(req: Request, res: Response) {
  const id = (req as any).userId as string | undefined;
  if (!id) return res.status(401).json({ message: 'No autenticado' });

  const { currentPassword = '', newPassword } = req.body as { currentPassword?: string; newPassword: string };

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.sendStatus(404);

  // Confirmado: DB usa passwordHash (no 'password')
  if (user.passwordHash) {
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) return res.status(400).json({ message: 'Contraseña actual incorrecta' });
  } else {
    // Cuenta sin password previa (p.ej. Google). Permitimos inicializar con currentPassword vacío.
    if (currentPassword && currentPassword.length > 0) {
      return res.status(400).json({ message: 'La cuenta no tiene contraseña previa; deje currentPassword vacío para establecer una nueva.' });
    }
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id }, data: { passwordHash: newHash } });

  return res.json({ ok: true });
}

export default { getMe, updateMe, changePassword };
