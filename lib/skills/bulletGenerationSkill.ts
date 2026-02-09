import { callOpenAIJSON } from "@/lib/llm/openai";
import type { BulletGenerationInput, Skill } from "../types";

type BulletRaw = {
  bullets?: unknown;
};

const isBulletRaw = (data: unknown): data is BulletRaw => {
  return Boolean(data) && typeof data === "object";
};

const sanitizeBullets = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  if (typeof value === "string") {
    return value
      .split(/\n+/)
      .map((item) => item.replace(/^-\s*/, "").trim())
      .filter((item) => item.length > 0);
  }

  return [];
};

export const bulletGenerationSkill: Skill<BulletGenerationInput, string[]> = {
  name: "Bullet Generation Skill",
  description: "LLM generate 3-5 engineering resume bullets from matched and gap context.",
  async run(input: BulletGenerationInput): Promise<string[]> {
    const output = await callOpenAIJSON<BulletRaw>({
      messages: [
        {
          role: "system",
          content:
            "You are Bullet Generation Skill. Generate 3-5 concise, engineering-focused resume bullets. Emphasize platform, pipeline, system design, and measurable impact. Return JSON only."
        },
        {
          role: "user",
          content: JSON.stringify({
            context: input,
            output_schema: {
              bullets: ["string"]
            },
            constraints: [
              "Each bullet is one sentence.",
              "No generic fluff.",
              "Keep 3 to 5 bullets total."
            ]
          })
        }
      ],
      validate: isBulletRaw
    });

    const bullets = Array.from(new Set(sanitizeBullets(output.bullets))).slice(0, 5);

    if (bullets.length < 3) {
      throw new Error("Bullet Generation Skill returned fewer than 3 valid bullets.");
    }

    return bullets;
  }
};
