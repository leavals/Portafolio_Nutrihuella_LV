// src/controllers/auth.controller.ts
// -------------------------------------------------------------
// Controladores de autenticación: registro, login, Google Sign-In y perfil
// Requisitos previos:
//  - Prisma configurado con el modelo User (email único, passwordHash opcional, googleId opcional).
//  - Variables en .env del backend: JWT_SECRET, GOOGLE_CLIENT_ID (opcional).
//  - Las rutas usan Zod para validar el body (ver auth.routes.ts).
// -------------------------------------------------------------

import type { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../env.js';
import { OAuth2Client } from 'google-auth-library';

// Si existe GOOGLE_CLIENT_ID, instanciamos el cliente de Google.
// En entornos sin Google (p.ej. pruebas locales), el endpoint devolverá 503.
const googleClient = env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(env.GOOGLE_CLIENT_ID)
  : null;

// Firmar nuestro JWT de aplicación (7 días); el "sub" es el id del usuario.
const sign = (id: string) =>
  jwt.sign({ sub: id }, env.JWT_SECRET as string, { expiresIn: '7d' });

/**
 * POST /api/auth/register
 * Registra un usuario local con email/contraseña.
 * Devuelve JWT + datos básicos del usuario.
 */
export async function register(req: Request, res: Response) {
  try {
    const { email, password, name } = req.body as {
      email: string;
      password: string;
      name?: string;
    };

    // Email único
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ message: 'Email ya registrado' });

    // Hash seguro
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, passwordHash, name },
    });

    return res.status(201).json({
      token: sign(user.id),
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (e) {
    console.error('register error:', e);
    return res.status(500).json({ message: 'Error al registrar' });
  }
}

/**
 * POST /api/auth/login
 * Login local con email/contraseña.
 * Devuelve JWT + datos básicos del usuario.
 */
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Credenciales inválidas' });

    return res.json({
      token: sign(user.id),
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (e) {
    console.error('login error:', e);
    return res.status(500).json({ message: 'Error al iniciar sesión' });
  }
}

/**
 * POST /api/auth/google
 * Recibe { idToken } (Google Identity Services).
 * Verifica el token contra el GOOGLE_CLIENT_ID configurado.
 * Crea o enlaza el usuario y devuelve JWT + datos básicos.
 */
export async function googleLogin(req: Request, res: Response) {
  try {
    if (!googleClient || !env.GOOGLE_CLIENT_ID) {
      return res
        .status(503)
        .json({ message: 'Google Sign-In no está configurado en el servidor' });
    }

    const { idToken } = req.body as { idToken?: string };
    if (!idToken) {
      return res.status(400).json({ message: 'Falta idToken' });
    }

    // Verificación del ID Token emitido por Google
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID, // ¡Debe coincidir con el del frontend!
    });

    const payload = ticket.getPayload();
    if (!payload?.email) {
      console.error('googleLogin: payload vacío o sin email');
      return res.status(401).json({ message: 'Token inválido' });
    }

    const email = payload.email!;
    const googleId = payload.sub!; // identificador único de Google
    const name = payload.name ?? undefined;

    // Buscamos por email o por googleId para enlazar cuentas
    let user = await prisma.user.findFirst({
      where: { OR: [{ email }, { googleId }] },
    });

    if (!user) {
      user = await prisma.user.create({ data: { email, googleId, name } });
    } else if (!user.googleId) {
      // Si el usuario existía por email pero aún no estaba enlazado a Google, lo enlazamos
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId },
      });
    }

    return res.json({
      token: sign(user.id),
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (e: any) {
    console.error('googleLogin error:', e?.message || e);
    return res.status(401).json({ message: 'No se pudo verificar el token de Google' });
  }
}

/**
 * GET /api/auth/me
 * Devuelve el perfil mínimo del usuario autenticado.
 * Requiere middleware authGuard que coloca req.userId.
 */
export async function me(req: Request, res: Response) {
  const userId = (req as any).userId as string | undefined;
  if (!userId) return res.sendStatus(401);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.sendStatus(404);

  return res.json({ id: user.id, email: user.email, name: user.name });
}
