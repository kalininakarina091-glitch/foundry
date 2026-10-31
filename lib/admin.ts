import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
/**
 * Route-level administrator check for pipeline and admin mutations. Proxy
 * already refuses non-admins; routes check again so a proxy change or bypass
 * cannot open shared-data writes or paid AI calls. Returns a response to send
 * when access is denied, otherwise null.
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  if (!user.isAdmin)
    return NextResponse.json(
      { error: "Изменение рыночного pipeline доступно только администратору." },
      { status: 403 },
    );
  return null;
}
