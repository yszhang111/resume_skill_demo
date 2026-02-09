import type { BulletGenerationInput, Skill } from "../types";

const sanitizeBullets = (bullets: string[]): string[] =>
  Array.from(new Set(bullets.map((item) => item.trim()).filter((item) => item.length > 0))).slice(0, 5);

const buildFallbackBullets = (input: BulletGenerationInput): string[] => {
  const topMatched = input.matched.matchedSkills.slice(0, 2).map((item) => item.name).join(", ");
  const topGaps = input.gaps.missingSkills
    .slice(0, 1)
    .flatMap((item) => item.suggestions)
    .slice(0, 2)
    .join("/");

  return [
    `Built a skill-driven analysis pipeline aligned to JD signals across ${topMatched || "core engineering"} domains.`,
    "Implemented orchestrated skill execution and persisted structured analysis results for history replay.",
    `Identified high-priority capability gaps ${topGaps ? `including ${topGaps}` : "for follow-up roadmap planning"} to improve role fit.`
  ];
};

export const bulletGenerationSkill: Skill<BulletGenerationInput, string[]> = {
  name: "Bullet Generation Skill",
  description: "Generate final resume bullets from shared LLM bundle with deterministic fallback safeguards.",
  async run(input: BulletGenerationInput): Promise<string[]> {
    const bullets = sanitizeBullets(input.bundle.bullets);
    if (bullets.length >= 3) {
      return bullets;
    }

    return buildFallbackBullets(input);
  }
};
