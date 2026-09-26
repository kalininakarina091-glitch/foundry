import { prisma } from "@/lib/db";

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-zа-я0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractCustomer(text: string): string | null {
  const patterns = [
    /freelancer/i,
    /smb/i,
    /small business/i,
    /startup/i,
    /developer/i,
    /agency/i,
    /dentist/i,
    /clinic/i,
    /healthcare/i,
    /enterprise/i,
    /indie hacker/i,
    /solo founder/i,
  ];

  for (const pattern of patterns) {
    if (pattern.test(text)) {
      return pattern.source.replace(/\\/g, "").toLowerCase();
    }
  }
  return null;
}

export async function normalizeAllSignals(): Promise<{
  total: number;
  normalized: number;
  duplicates: number;
}> {
  const signals = await prisma.signal.findMany({
    where: { normalizedProblem: null },
  });

  let normalized = 0;
  let duplicates = 0;

  for (const signal of signals) {
    const problem = normalizeText(signal.title || signal.description || "");
    const customer =
      signal.customer ||
      extractCustomer(signal.title || signal.description || "");

    // Проверяем на дубликат
    const existing = await prisma.signal.findFirst({
      where: {
        normalizedProblem: problem,
        id: { not: signal.id },
      },
    });

    if (existing) {
      await prisma.signal.update({
        where: { id: signal.id },
        data: {
          normalizedProblem: problem,
          normalizedCustomer: customer,
          duplicateOf: existing.id,
        },
      });
      duplicates++;
    } else {
      await prisma.signal.update({
        where: { id: signal.id },
        data: {
          normalizedProblem: problem,
          normalizedCustomer: customer,
        },
      });
      normalized++;
    }
  }

  return { total: signals.length, normalized, duplicates };
}
