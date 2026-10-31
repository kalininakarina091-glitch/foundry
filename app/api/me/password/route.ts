import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { currentUser, endOtherSessions } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/auth-crypto";
import { limitKey } from "@/lib/client-ip";
import { consumeLimits } from "@/lib/rate-limit";
import { passwordSchema, PASSWORD_RULE } from "@/lib/account";
export async function PUT(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Войдите" }, { status: 401 });
  const body = z
    .object({ current: z.string().min(1).max(128), next: passwordSchema })
    .strict()
    .safeParse(await request.json().catch(() => null));
  if (!body.success)
    return NextResponse.json({ error: PASSWORD_RULE }, { status: 400 });
  if (
    !(await consumeLimits([
      { key: limitKey("password-user", user.id), max: 5, windowMs: 15 * 60000 },
    ]))
  )
    return NextResponse.json(
      { error: "Слишком много попыток. Повторите через 15 минут." },
      { status: 429 },
    );
  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!row || !(await verifyPassword(body.data.current, row.passwordHash)))
    return NextResponse.json(
      { error: "Текущий пароль указан неверно." },
      { status: 403 },
    );
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(body.data.next) },
  });
  // A changed password ends access everywhere except this device.
  return NextResponse.json({ ok: true, revoked: await endOtherSessions(user.id) });
}
