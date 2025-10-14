// middleware.ts
import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE = "auth_token";
const PUBLIC_PATHS = ["/", "/login", "/register"];

function isPublicPage(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
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
  const isApi = pathname.startsWith("/api");

  const token = req.cookies.get(AUTH_COOKIE)?.value ?? "";

  // 1) Para API: nunca redirigir; si hay cookie => SIEMPRE setear Authorization
  if (isApi) {
    const headers = new Headers(req.headers);
    if (token) {
      headers.set("authorization", `Bearer ${token}`); // fuerza que llegue
    }
    headers.set("x-auth-injected", "1"); // (debug opcional)
    return NextResponse.next({ request: { headers } });
  }

  // 2) Para páginas públicas
  if (isPublicPage(pathname)) return NextResponse.next();

  // 3) Páginas protegidas
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname + (search || ""));
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.+\\.(?:ico|png|jpg|jpeg|svg|webp|gif|css|js|txt|xml|map)$|_next/|favicon.ico).*)"],
};
