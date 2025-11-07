// src/services/analytics.ts
import { prisma } from './prisma.ts';

export async function trackEvent(
  userId: string,
  type: string,
  meta?: Record<string, any> & { device?: string; city?: string; commune?: string; petId?: string }
) {
  try {
    await prisma.analyticsEvent.create({
      data: {
        userId,
        type,
        device: meta?.device,
        city: meta?.city,
        commune: meta?.commune,
        petId: meta?.petId,
        meta: meta ? JSON.stringify(meta) : null,
      },
    });
  } catch {
    // no bloquear flujo por analítica
  }
}
