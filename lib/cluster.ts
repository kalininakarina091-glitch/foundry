import { prisma } from "@/lib/db";

interface Cluster {
  name: string;
  problem: string;
  customer: string | null;
  signalCount: number;
  sourceCount: number;
  firstDetected: Date;
  latestDetected: Date;
  signalTypes: string[];
  industries: string[];
  averageStrength: number;
}

function similarity(a: string, b: string): number {
  const wordsA = new Set(a.split(" ").filter((w) => w.length > 3));
  const wordsB = new Set(b.split(" ").filter((w) => w.length > 3));

  let intersection = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) intersection++;
  }

  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : intersection / union;
}

export async function clusterSignals(): Promise<Cluster[]> {
  const signals = await prisma.signal.findMany({
    where: {
      duplicateOf: null, // только не дубликаты
    },
    include: {
      rawItem: {
        include: { source: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const clusters: Cluster[] = [];
  const used = new Set<string>();

  for (const signal of signals) {
    if (used.has(signal.id)) continue;

    const problem = signal.normalizedProblem || signal.title || "";
    const clusterSignals = signals.filter(
      (s) =>
        !used.has(s.id) &&
        similarity(problem, s.normalizedProblem || s.title || "") > 0.15,
    );

    if (clusterSignals.length < 2) continue; // минимум 2 сигнала для кластера

    const sources = new Set(clusterSignals.map((s) => s.rawItem.source.name));
    const types = new Set(clusterSignals.map((s) => s.type));
    const industries = new Set(
      clusterSignals.filter((s) => s.industry).map((s) => s.industry!),
    );
    const strengths = clusterSignals.map((s) => s.strength);
    const dates = clusterSignals.map((s) => s.createdAt);

    clusters.push({
      name: clusterSignals[0].title || "Unnamed cluster",
      problem,
      customer: clusterSignals[0].customer,
      signalCount: clusterSignals.length,
      sourceCount: sources.size,
      firstDetected: new Date(Math.min(...dates.map((d) => d.getTime()))),
      latestDetected: new Date(Math.max(...dates.map((d) => d.getTime()))),
      signalTypes: Array.from(types),
      industries: Array.from(industries),
      averageStrength: strengths.reduce((a, b) => a + b, 0) / strengths.length,
    });

    clusterSignals.forEach((s) => used.add(s.id));
  }

  return clusters.sort((a, b) => b.signalCount - a.signalCount);
}
