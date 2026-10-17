import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parsePreferences } from "@/lib/preferences";
const patchSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    email: z.string().email().optional(),
    about: z.string().max(200).optional(),
    catalogLayout: z.enum(["grid", "list"]).optional(),
    catalogSort: z.enum(["score", "evidence", "recent"]).optional(),
    pageSize: z.union([z.literal(6), z.literal(12), z.literal(24)]).optional(),
    compact: z.boolean().optional(),
    showDescriptions: z.boolean().optional(),
  })
  .strict();
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Войдите" }, { status: 401 });
  const p = await prisma.userProfile.findUnique({ where: { userId: user.id } });
  return NextResponse.json({
    ...parsePreferences(p?.preferences || "{}"),
    name: user.name,
    email: user.email,
    about: p?.about || "",
  });
}
export async function PATCH(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Войдите" }, { status: 401 });
  const p = patchSchema.safeParse(await request.json().catch(() => null));
  if (!p.success || (p.data.email && p.data.email !== user.email))
    return NextResponse.json(
      {
        error:
          "Некорректные настройки. Изменение email пока не поддерживается.",
      },
      { status: 400 },
    );
  const row = await prisma.userProfile.findUnique({
    where: { userId: user.id },
  });
  const { name, email: unusedEmail, about, ...ui } = p.data;
  void unusedEmail;
  const preferences = JSON.stringify({
    ...parsePreferences(row?.preferences || "{}"),
    ...ui,
    name: "",
    email: "",
    about: "",
  });
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { ...(name ? { name } : {}) },
    }),
    prisma.userProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, preferences, about: about || "" },
      update: { preferences, ...(about === undefined ? {} : { about }) },
    }),
  ]);
  return GET();
}
