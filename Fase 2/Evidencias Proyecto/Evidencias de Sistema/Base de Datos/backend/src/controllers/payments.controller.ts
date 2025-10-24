// src/controllers/payments.controller.ts
import type { Request, Response } from "express";
import { prisma } from "../services/prisma.ts";
import { webpayInitPlus, webpayCommitPlus } from "../services/transbank.ts";
import { env } from "../env.ts";

// Precio/upgrade por defecto
const PLUS_PRICE_CLP = 4990;

/**
 * POST /api/payments/plus/init
 * Body: { amount?: number, finalUrl?: string }
 * Respuesta: { token, url, buyOrder }
 *
 * - Crea transacción en TBK con return_url apuntando a /plus/commit
 * - Si llega finalUrl en el body, se adjunta como ?final=... para que el commit
 *   redirija dinámicamente (web o app).
 */
export async function initPlusPayment(req: Request, res: Response) {
  try {
    // Este endpoint sí requiere usuario autenticado (lo llama tu app/web)
    const userId = (req as any).userId as string | undefined;
    if (!userId) return res.status(401).json({ message: "No autorizado" });

    const body = (req.body ?? {}) as { amount?: number; finalUrl?: string };
    const amount = Math.max(1, Math.floor(Number(body.amount ?? PLUS_PRICE_CLP)));

    // return_url (donde Transbank hará POST con token_ws)
    // Enlazamos finalUrl como query para que el commit sepa a dónde redirigir.
    const baseReturn = `http://localhost:${env.PORT}/api/payments/plus/commit`;
    const returnUrl = body.finalUrl
      ? `${baseReturn}?final=${encodeURIComponent(body.finalUrl)}`
      : baseReturn;

    // Llama a tu servicio de TBK. Asegúrate de soportar returnUrl ahí.
    // Debe devolver { buyOrder, sessionId, token, url }
    const { buyOrder, sessionId, token, url } = await webpayInitPlus({
      userId,
      amount,
      returnUrl, // <--- override dinámico del return_url
    } as any);

    // Persistimos el INIT (útil para casar commit->user)
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
    console.error("[payments:initPlusPayment] error:", e);
    return res.status(500).json({ message: "No fue posible iniciar el pago." });
  }
}

/**
 * POST /api/payments/plus/commit
 * Body/Query: { token_ws: string } (lo envía Transbank al return_url)
 *
 * - NO debe llevar authGuard (lo llama TBK sin JWT).
 * - Hace commit en TBK, actualiza plan del usuario a PLUS y redirige:
 *     OK     -> finalUrl ? `...&paid=1` : `${env.TBK_FINAL_URL}?paid=1`
 *     Error  -> finalUrl ? `...&error=1` : `${env.TBK_FINAL_URL}?error=1`
 */
export async function commitPlusPayment(req: Request, res: Response) {
  try {
    // token_ws puede llegar por body (POST) o query
    const token_ws =
      String(((req.body as any)?.token_ws ?? (req.query as any)?.token_ws) || "").trim();
    if (!token_ws) return res.status(400).json({ message: "token_ws requerido" });

    // 1) Confirmar con TBK
    const commit = await webpayCommitPlus(token_ws);

    // 2) Ubicar el pago por token para obtener userId
    const payment = await prisma.payment.findFirst({ where: { tbkToken: token_ws } });

    // Si no existiera por alguna razón, creamos uno mínimo (edge case)
    const ensurePayment = async () => {
      if (payment) return payment;
      return prisma.payment.create({
        data: {
          userId: commit.session_id ?? "unknown",
          buyOrder: commit.buy_order ?? `NH-${Date.now()}`,
          sessionId: commit.session_id ?? `sess-${Date.now()}`,
          amount: Math.floor(Number(commit.amount || PLUS_PRICE_CLP)),
          tbkToken: token_ws,
          status: "INIT",
          raw: JSON.stringify(commit),
        },
      });
    };
    const payRow = await ensurePayment();

    // 3) Evaluar autorización
    const authorized =
      (commit as any)?.response_code === 0 ||
      String((commit as any)?.status ?? "").toUpperCase() === "AUTHORIZED";

    if (!authorized) {
      await prisma.payment.updateMany({
        where: { tbkToken: token_ws },
        data: { status: (commit as any)?.status ?? "FAILED", raw: JSON.stringify(commit) },
      });

      const backFinal =
        (req.query?.final as string | undefined) || env.TBK_FINAL_URL;
      const finalErr = backFinal + (backFinal.includes("?") ? "&" : "?") + "error=1";
      return res.redirect(finalErr);
    }

    // 4) Marcar pago y subir plan del usuario a PLUS
    await prisma.$transaction([
      prisma.payment.updateMany({
        where: { tbkToken: token_ws },
        data: { status: "AUTHORIZED", raw: JSON.stringify(commit) },
      }),
      // Sube plan solo si el userId es válido (cuando llegó desde tu app/web)
      ...(payRow.userId && payRow.userId !== "unknown"
        ? [
            prisma.user.update({
              where: { id: payRow.userId },
              data: { plan: "PLUS", membershipUpdatedAt: new Date() },
            }),
          ]
        : []),
    ]);

    // 5) Redirección final
    const backFinal = (req.query?.final as string | undefined) || env.TBK_FINAL_URL;
    const finalOk = backFinal + (backFinal.includes("?") ? "&" : "?") + "paid=1";
    return res.redirect(finalOk);
  } catch (e: any) {
    console.error("[payments:commitPlusPayment] error:", e);
    const backFinal = (req.query?.final as string | undefined) || env.TBK_FINAL_URL;
    const finalErr = backFinal + (backFinal.includes("?") ? "&" : "?") + "error=1";
    return res.redirect(finalErr);
  }
}
