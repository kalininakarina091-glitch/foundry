import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth-crypto";
import { allowAuthAttempt, createSession } from "@/lib/auth";
const schema = z
  .object({
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((s) => s.toLowerCase()),
    password: z.string().min(1).max(128),
  })
  .strict();
const dummy = "scrypt-v1$00000000000000000000000000000000$" + "0".repeat(128);
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Некорректные данные входа." },
      { status: 400 },
    );
  if (!(await allowAuthAttempt(parsed.data.email)))
    return NextResponse.json(
      { error: "Слишком много попыток. Повторите через 15 минут." },
      { status: 429 },
    );
  try {
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      include: { profile: true },
    });
    const valid = await verifyPassword(
      parsed.data.password,
      user?.passwordHash || dummy,
    );
    if (!user || !valid)
      return NextResponse.json(
        { error: "Неверный email или пароль." },
        { status: 401 },
      );
    await createSession(user.id, request);
    return NextResponse.json({
      next:
        user.profile?.onboardingCompleted || user.profile?.onboardingSkipped
          ? "/opportunities?view=for-you"
          : "/welcome",
    });
  } catch {
    return NextResponse.json(
      { error: "Вход временно недоступен." },
      { status: 503 },
    );
  }
}
