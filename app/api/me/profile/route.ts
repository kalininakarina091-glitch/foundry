import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  profileSchema,
  decodeProfile,
  encodeProfile,
  completeProfile,
} from "@/lib/personal-profile";
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Войдите" }, { status: 401 });
  return NextResponse.json(
    decodeProfile(
      await prisma.userProfile.findUnique({ where: { userId: user.id } }),
    ),
  );
}
export async function PUT(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Войдите" }, { status: 401 });
  const p = profileSchema.safeParse(await request.json().catch(() => null));
  if (!p.success || (p.data.onboardingCompleted && !completeProfile(p.data)))
    return NextResponse.json(
      { error: "Заполните обязательные разделы профиля." },
      { status: 400 },
    );
  const data = encodeProfile({
    ...p.data,
    onboardingSkipped: p.data.onboardingCompleted
      ? false
      : p.data.onboardingSkipped,
  });
  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data },
    update: data,
  });
  return NextResponse.json(p.data);
}
