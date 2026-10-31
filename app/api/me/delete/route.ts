import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { currentUser, SESSION_COOKIE } from "@/lib/auth";
import { verifyPassword } from "@/lib/auth-crypto";
import { limitKey } from "@/lib/client-ip";
import { consumeLimits } from "@/lib/rate-limit";
import { DELETE_CONFIRMATION, deletionBlocked } from "@/lib/account";
// Deletes the account with its profile, sessions, saved items and feedback
// (cascade). Shared market data stays; validation runs keep no user link.
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Войдите" }, { status: 401 });
  const body = z
    .object({ password: z.string().min(1).max(128), confirm: z.string().max(40) })
    .strict()
    .safeParse(await request.json().catch(() => null));
  if (
    !body.success ||
    body.data.confirm.trim().toLowerCase() !== DELETE_CONFIRMATION
  )
    return NextResponse.json(
      { error: `Введите пароль и слово «${DELETE_CONFIRMATION}» для подтверждения.` },
      { status: 400 },
    );
  if (
    !(await consumeLimits([
      { key: limitKey("delete-user", user.id), max: 5, windowMs: 15 * 60000 },
    ]))
  )
    return NextResponse.json(
      { error: "Слишком много попыток. Повторите через 15 минут." },
      { status: 429 },
    );
  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true, isAdmin: true },
  });
  if (!row || !(await verifyPassword(body.data.password, row.passwordHash)))
    return NextResponse.json({ error: "Пароль указан неверно." }, { status: 403 });
  if (
    deletionBlocked(row.isAdmin, await prisma.user.count({ where: { isAdmin: true } }))
  )
    return NextResponse.json(
      {
        error:
          "Это единственный администратор. Назначьте другого администратора, прежде чем удалять аккаунт.",
      },
      { status: 409 },
    );
  await prisma.user.delete({ where: { id: user.id } });
  (await cookies()).delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
