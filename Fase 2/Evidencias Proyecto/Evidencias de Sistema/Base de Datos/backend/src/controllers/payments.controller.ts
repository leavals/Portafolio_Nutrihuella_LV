// src/controllers/payments.controller.ts
import type { Request, Response } from "express";
import { prisma } from "../services/prisma.ts";
import { webpayInitPlus, webpayCommitPlus } from "../services/transbank.ts";
import { env } from "../env.ts";

// Monto fijo de upgrade (puedes moverlo a ENV si quieres)
const PLUS_PRICE_CLP = 4990;

// Uniformador simple de errores
function limitError(res: Response, status: number, payload: any) {
  return res.status(status).json(payload);
}

/**
 * POST /api/payments/plus/init
 * Body opcional: { amount?: number }
 * Respuesta: { token, url, buyOrder }
 */
export async function initPlusPayment(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string | undefined;
    if (!userId) return res.status(401).json({ message: "No autorizado" });

    const amount = Math.max(1, Math.floor(Number((req.body as any)?.amount ?? PLUS_PRICE_CLP)));

    // 1) Crear en TBK
    const { buyOrder, sessionId, token, url } = await webpayInitPlus({ userId, amount });

    // 2) Persistir Payment INIT
    await prisma.payment.create({
      data: {
        userId,
        buyOrder,
        sessionId,
        amount,
        tbkToken: token,
        status: "INIT",
        raw: null,
      },
    });

    return res.json({ token, url, buyOrder });
  } catch (e: any) {
    console.error("initPlusPayment error:", e);
    return res.status(500).json({ message: "No fue posible iniciar el pago." });
  }
}

/**
 * POST /api/payments/plus/commit
 * Body: { token_ws: string }  // parámetro que envía Webpay al return_url
 * Si es OK -> user.plan = "PLUS"
 */
export async function commitPlusPayment(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string | undefined;
    if (!userId) return res.status(401).json({ message: "No autorizado" });

    const token_ws = String((req.body as any)?.token_ws || "").trim();
    if (!token_ws) return res.status(400).json({ message: "token_ws requerido" });

    // Confirmar con TBK
    const commit = await webpayCommitPlus(token_ws);

    // Buscar Payment por token
    const payment = await prisma.payment.findFirst({ where: { tbkToken: token_ws } });
    if (!payment) {
      // A veces el usuario llega con token y la fila no existe (edge). Creamos una.
      await prisma.payment.create({
        data: {
          userId,
          buyOrder: commit.buy_order ?? `NH-${Date.now()}`,
          sessionId: commit.session_id ?? `${userId}-${Date.now()}`,
          amount: Math.floor(Number(commit.amount || PLUS_PRICE_CLP)),
          tbkToken: token_ws,
          status: "INIT",
          raw: JSON.stringify(commit),
        },
      });
    }

    const authorized =
      (commit as any)?.response_code === 0 ||
      (commit as any)?.status?.toUpperCase() === "AUTHORIZED";

    if (!authorized) {
      await prisma.payment.updateMany({
        where: { tbkToken: token_ws },
        data: { status: (commit as any)?.status ?? "FAILED", raw: JSON.stringify(commit) },
      });

      return res.status(400).json({
        message: "Transacción no autorizada",
        code: "PAYMENT_NOT_AUTHORIZED",
        commit,
      });
    }

    // Marcar pago como AUTHORIZED y subir a PLUS
    await prisma.$transaction([
      prisma.payment.updateMany({
        where: { tbkToken: token_ws },
        data: { status: "AUTHORIZED", raw: JSON.stringify(commit) },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { plan: "PLUS", membershipUpdatedAt: new Date() },
      }),
    ]);

    // URL final a la que puede navegar el frontend
    return res.json({
      ok: true,
      plan: "PLUS",
      finalUrl: env.TBK_FINAL_URL,
      commit,
    });
  } catch (e: any) {
    console.error("commitPlusPayment error:", e);
    return res.status(500).json({ message: "No fue posible confirmar el pago." });
  }
}
