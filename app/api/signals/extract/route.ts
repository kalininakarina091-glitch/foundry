import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractSignals } from "@/lib/ai";

export async function POST(request: Request) {
  const body = await request.json();

  const rawItem = await prisma.rawItem.findUnique({
    where: { id: body.rawItemId },
    include: { source: true },
  });

  if (!rawItem) {
    return NextResponse.json({ error: "RawItem не найден" }, { status: 404 });
  }

  // Проверяем, есть ли уже сигнал для этого rawItem
  const existingSignal = await prisma.signal.findFirst({
    where: { rawItemId: rawItem.id },
  });

  if (existingSignal) {
    return NextResponse.json({
      skipped: true,
      message: "Сигнал уже существует",
    });
  }

  try {
    const extraction = await extractSignals({
      title: rawItem.title,
      content: rawItem.content,
      sourceType: rawItem.source.type,
    });

    if (!extraction.is_relevant) {
      return NextResponse.json({
        is_relevant: false,
        message: "Не является бизнес-сигналом",
      });
    }

    const signal = await prisma.signal.create({
      data: {
        rawItemId: rawItem.id,
        type: extraction.signal_type || "trend",
        title: extraction.problem || rawItem.title,
        description: extraction.pain_point || rawItem.content,
        pain: extraction.pain_point,
        customer: extraction.customer,
        industry: extraction.industry,
        strength: extraction.strength,
      },
    });

    return NextResponse.json({
      is_relevant: true,
      signal,
    });
  } catch (error) {
    console.error("Extraction error:", error);
    return NextResponse.json(
      { error: "Ошибка извлечения сигнала" },
      { status: 500 },
    );
  }
}
