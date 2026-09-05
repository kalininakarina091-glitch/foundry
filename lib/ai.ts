import { generateObject } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { z } from "zod";

const groq = createOpenAICompatible({
  name: "groq",
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

export const OpportunityAnalysisSchema = z.object({
  summary: z.string(),
  why_now: z.string(),
  target_customer: z.string(),
  pain_level: z.number().min(1).max(10),
  competition: z.number().min(1).max(10),
  monetization: z.number().min(1).max(10),
  risks: z.array(z.string()),
  recommendation: z.enum(["build", "validate", "skip"]),
});

export type OpportunityAnalysis = z.infer<typeof OpportunityAnalysisSchema>;

export async function analyzeOpportunity(input: {
  problem: string;
  signals: string[];
  evidence: string[];
  market: string;
  competition: string;
}): Promise<OpportunityAnalysis> {
  const { object } = await generateObject({
    model: groq("openai/gpt-oss-20b"),
    schema: OpportunityAnalysisSchema,
    prompt: `
You are a business analyst evaluating a potential business opportunity.
Return your analysis as a valid JSON object.

PROBLEM:
${input.problem}

SIGNALS:
${input.signals.map((s) => `- ${s}`).join("\n")}

EVIDENCE:
${input.evidence.map((e) => `- ${e}`).join("\n")}

MARKET:
${input.market}

COMPETITION:
${input.competition}

Return JSON with:
- summary: 2-3 sentence overview
- why_now: why this opportunity is relevant right now
- target_customer: who would pay for this
- pain_level: number 1-10
- competition: number 1-10
- monetization: number 1-10
- risks: array of strings
- recommendation: "build" | "validate" | "skip"
`,
  });

  return object;
}

export const ValidationReportSchema = z.object({
  verdict: z.enum(["promising", "uncertain", "not_recommended"]),
  confidence: z.number().min(0).max(100),
  positive_evidence: z.array(z.string()),
  negative_evidence: z.array(z.string()),
  biggest_risk: z.string(),
  why_not: z.string(),
  recommendation: z.string(),
});

export type ValidationReport = z.infer<typeof ValidationReportSchema>;

export async function validateOpportunity(input: {
  problem: string;
  target_customer: string;
  signals: string[];
  evidence: string[];
  competition: string;
  market: string;
}): Promise<ValidationReport> {
  const { object } = await generateObject({
    model: groq("openai/gpt-oss-20b"),
    schema: ValidationReportSchema,
    prompt: `
You are a rigorous business analyst validating a potential business opportunity.
Return your analysis as a valid JSON object.

Be honest. If the idea is weak, say so. Include negative evidence and reasons NOT to pursue this idea.

PROBLEM:
${input.problem}

TARGET CUSTOMER:
${input.target_customer}

SIGNALS:
${input.signals.map((s) => `- ${s}`).join("\n")}

EVIDENCE:
${input.evidence.map((e) => `- ${e}`).join("\n")}

MARKET:
${input.market}

COMPETITION:
${input.competition}

Return JSON with:
- verdict: "promising" | "uncertain" | "not_recommended"
- confidence: number 0-100
- positive_evidence: array of strings (what supports this idea)
- negative_evidence: array of strings (what works against this idea)
- biggest_risk: string (the single biggest risk)
- why_not: string (honest reasons why this idea might fail)
- recommendation: string (clear next step)
`,
  });

  return object;
}