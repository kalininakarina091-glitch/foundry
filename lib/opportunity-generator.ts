import type { Prisma } from "@prisma/client";

export interface GeneratedOpportunity {
  title: string;
  problem: string;
  target_customer: string;
  why_now: string;
  market_gap: string;
  opportunity_type: string;
  confidence: number;
  supporting_signals: number;
  source_count: number;
}

async function generateJSON(
  prompt: string,
): Promise<Omit<GeneratedOpportunity, "supporting_signals" | "source_count">> {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct",
        messages: [{ role: "user", content: prompt }],
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`OpenRouter error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "";
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
  return JSON.parse(cleaned);
}

export async function generateOpportunityFromCluster(
  clusterName: string,
  signals: Prisma.SignalGetPayload<{
    include: { rawItem: { include: { source: true } } };
  }>[],
): Promise<GeneratedOpportunity> {
  const signalTexts = signals
    .map((s) => `- ${s.title || s.description || ""}`)
    .join("\n");
  const sources = new Set(signals.map((s) => s.rawItem?.source?.name)).size;
  const types = new Set(signals.map((s) => s.type));

  const prompt = `
Ты — бизнес-аналитик. На основе повторяющихся рыночных сигналов создай бизнес-возможность.
Верни ТОЛЬКО валидный JSON (без markdown).

КЛАСТЕР: ${clusterName}
Количество сигналов: ${signals.length}
Источников: ${sources}
Типы сигналов: ${Array.from(types).join(", ")}

СИГНАЛЫ:
${signalTexts}

Верни JSON:
- title: короткое название возможности (на русском)
- problem: какую проблему решает (на русском)
- target_customer: кто целевой клиент (на русском)
- why_now: почему сейчас (на русском)
- market_gap: какой пробел на рынке (на русском)
- opportunity_type: "saas" | "service" | "tool" | "automation"
- confidence: число 0.0-1.0 (уверенность в том, что это реальная возможность)
`;

  const result = await generateJSON(prompt);

  return {
    ...result,
    supporting_signals: signals.length,
    source_count: sources,
  };
}
