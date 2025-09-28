// middleware.ts
import { NextResponse, type NextRequest } from "next/server";

// Debe coincidir con tu AuthContext/login
const AUTH_COOKIE = "auth_token";

// Solo estas rutas son públicas:
const PUBLIC_PATHS = ["/", "/login", "/register"];

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;

  // Permitir assets/next internals y archivos estáticos
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/images") ||
    /\.(?:ico|png|jpg|jpeg|svg|webp|gif|css|js|txt|xml|map)$/.test(pathname)
  ) return true;

  return false;
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Si es pública, dejar pasar
  if (isPublic(pathname)) return NextResponse.next();

  // Si NO es pública, exigir cookie/token
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname + (search || ""));
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Aplica a todo menos estáticos/internals
  matcher: ["/((?!.+\\.(?:ico|png|jpg|jpeg|svg|webp|gif|css|js|txt|xml|map)$|_next/|favicon.ico).*)"],
};
