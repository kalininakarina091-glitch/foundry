import { NextResponse, type NextRequest } from "next/server";
import { sessionUser, SESSION_COOKIE } from "@/lib/auth";
import { sameOrigin } from "@/lib/auth-crypto";
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (
    !process.env.APP_ORIGIN &&
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
  const publicRoute = [
    "/",
    "/login",
    "/signup",
    "/api/auth/login",
    "/api/auth/register",
  ].includes(path);
  if (publicRoute) return NextResponse.next();
  const user = await sessionUser(request.cookies.get(SESSION_COOKIE)?.value);
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
