import { NextResponse } from "next/server";
import { z } from "zod";
import { extractRawItem } from "@/lib/extraction";
export async function POST(request: Request) {
  const body = z
    .object({ rawItemId: z.string().min(1).max(200) })
    .safeParse(await request.json().catch(() => null));
  if (!body.success)
    return NextResponse.json({ error: "Укажите rawItemId" }, { status: 400 });
  if (!process.env.OPENROUTER_API_KEY)
    return NextResponse.json(
      { error: "AI-провайдер не настроен" },
      { status: 503 },
    );
  const { status, ...result } = await extractRawItem(body.data.rawItemId);
  return NextResponse.json(result, { status });
}
