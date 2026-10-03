import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth-constants";
import { sameOrigin, configuredAppOrigin } from "@/lib/app-origin";
import { isNetlifyDeployment, DATABASE_DEPLOYMENT_MESSAGE } from "@/lib/deployment";
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (
    !configuredAppOrigin() &&
    !["localhost", "127.0.0.1", "[::1]"].includes(request.nextUrl.hostname)
  )
    return NextResponse.json(
      { error: "Задайте APP_ORIGIN для этого окружения." },
      { status: 503 },
    );
  const mutation = !["GET", "HEAD", "OPTIONS"].includes(request.method);
  if (mutation && !sameOrigin(request))
    return NextResponse.json(
      { error: "Запрос с другого сайта запрещён." },
      { status: 403 },
    );
  // A successful preview build does not make build-time SQLite durable.
  // Keep public account screens available; fail closed for database operations
  // until an external provider is separately approved and implemented.
  if (isNetlifyDeployment() && !["/", "/login", "/signup"].includes(path))
    return NextResponse.json(
      { error: DATABASE_DEPLOYMENT_MESSAGE },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  const publicRoute = [
    "/",
    "/login",
    "/signup",
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/session",
  ].includes(path);
  if (publicRoute) return NextResponse.next();
  // Native Prisma engines cannot run in Netlify Node.js Middleware. Resolve
  // the opaque session in a regular Node route; do not trust cookie presence.
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  let user: { isAdmin: boolean } | null = null;
  if (token && /^[A-Za-z0-9_-]{43}$/.test(token)) {
    try {
      const result = await fetch(
        new URL("/api/auth/session", configuredAppOrigin() || request.url),
        {
          headers: { Cookie: `${SESSION_COOKIE}=${token}` },
          cache: "no-store",
          redirect: "error",
          signal: AbortSignal.timeout(10000),
        },
      );
      if (!result.ok) throw new Error("Session lookup unavailable");
      const session = await result.json();
      if (session.authenticated === true)
        user = { isAdmin: session.isAdmin === true };
    } catch {
      return NextResponse.json(
        { error: "Проверка сессии временно недоступна." },
        { status: 503 },
      );
    }
  }
  if (!user)
    return path.startsWith("/api/")
      ? NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 })
      : NextResponse.redirect(new URL("/login", request.url));
  if (
    mutation &&
    path.startsWith("/api/") &&
    !path.startsWith("/api/me") &&
    !path.startsWith("/api/auth/") &&
    path !== "/api/validate" &&
    !user.isAdmin
  )
    return NextResponse.json(
      { error: "Изменение рыночного pipeline доступно только администратору." },
      { status: 403 },
    );
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|woff2)$).*)",
  ],
};
