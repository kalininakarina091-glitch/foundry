import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth-crypto";
import { allowAuthAttempt, createSession } from "@/lib/auth";
const schema = z
  .object({
    name: z.string().trim().min(1).max(80),
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((s) => s.toLowerCase()),
    password: z.string().min(12).max(128),
  })
  .strict();
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      {
        error: "Укажите имя, корректный email и пароль длиной 12–128 символов.",
      },
      { status: 400 },
    );
  const { name, email, password } = parsed.data;
  if (!(await allowAuthAttempt(email)))
    return NextResponse.json(
      { error: "Слишком много попыток. Повторите через 15 минут." },
      { status: 429 },
    );
  try {
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, profile: { create: {} } },
      select: { id: true },
    });
    await createSession(user.id, request);
    return NextResponse.json({ next: "/welcome" }, { status: 201 });
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002")
      return NextResponse.json(
        { error: "Регистрация недоступна для этого email. Попробуйте войти." },
        { status: 409 },
      );
    return NextResponse.json(
      { error: "Не удалось создать аккаунт. Повторите попытку." },
      { status: 503 },
    );
  }
}
