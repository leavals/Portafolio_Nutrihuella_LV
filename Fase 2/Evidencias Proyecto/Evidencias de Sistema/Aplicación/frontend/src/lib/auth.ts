// src/lib/auth.ts
import { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret");

// En dev, si la firma falla pero hay token, intentamos decodificar sin verificar
const allowDevFallback = process.env.NODE_ENV !== "production";

export async function requireUser(req: NextRequest) {
  // 1) Header Authorization (inyectado por middleware)
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  // 2) Cookie como respaldo
  const cookieToken = req.cookies.get("auth_token")?.value ?? null;

  const token = bearer || cookieToken;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      id: (payload.sub as string) || "unknown",
      role: (payload as any).role ?? null,
      payload,
    };
  } catch (err) {
    if (!allowDevFallback) return null;
    try {
      // Fallback DEV: decodificar sin verificar firma (NO usar en prod)
      const [, p] = token.split(".");
      const json = Buffer.from(p.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
      const payload = JSON.parse(json);
      return {
        id: payload?.sub ?? "unknown",
        role: payload?.role ?? null,
        payload,
        _devUnverified: true,
      };
    } catch {
      return null;
    }
  }
}
