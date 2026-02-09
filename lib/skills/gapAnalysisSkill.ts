import { callOpenAIJSON } from "@/lib/llm/openai";
import { skillTaxonomy } from "../skillTaxonomy";
import type { GapAnalysisOutput, Skill, SkillMatchingOutput } from "../types";

const HIGH_WEIGHT_THRESHOLD = 4;

type MissingSkillRaw = {
  category?: unknown;
  suggestions?: unknown;
};

type GapAnalysisRaw = {
  missingSkills?: unknown;
  summary?: unknown;
};

const isGapAnalysisRaw = (data: unknown): data is GapAnalysisRaw => {
  return Boolean(data) && typeof data === "object";
};

const sanitizeSuggestions = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  if (typeof value === "string") {
    return value
      .split(/[\n,;/]+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  return [];
};

export const gapAnalysisSkill: Skill<SkillMatchingOutput, GapAnalysisOutput> = {
  name: "Gap Analysis Skill",
  description: "LLM detect high-priority missing skills by category and summarize gaps.",
  async run(input: SkillMatchingOutput): Promise<GapAnalysisOutput> {
    const highWeightTaxonomy = skillTaxonomy.filter((skill) => skill.weight >= HIGH_WEIGHT_THRESHOLD);

    const llmOutput = await callOpenAIJSON<GapAnalysisRaw>({
      messages: [
        {
          role: "system",
          content:
            "You are Gap Analysis Skill. Find high-priority missing capabilities based on provided taxonomy and matched skills. Return JSON with missingSkills grouped by category and a concise summary."
        },
        {
          role: "user",
          content: JSON.stringify({
            highWeightTaxonomy,
            matchedSkills: input.matchedSkills,
            output_schema: {
              missingSkills: [
                {
                  category: "string",
                  suggestions: ["string"]
                }
              ],
              summary: "string"
            }
          })
        }
      ],
      validate: isGapAnalysisRaw
    });

    const rawMissing = Array.isArray(llmOutput.missingSkills)
      ? (llmOutput.missingSkills as MissingSkillRaw[])
      : [];

    const allowedByCategory = highWeightTaxonomy.reduce<Record<string, Map<string, string>>>((acc, skill) => {
      if (!acc[skill.category]) {
        acc[skill.category] = new Map<string, string>();
      }
      acc[skill.category].set(skill.name.toLowerCase(), skill.name);
      return acc;
    }, {});

    const missingSkills = rawMissing
      .map((group) => {
        const category = typeof group.category === "string" ? group.category.trim() : "";
        if (!category) {
          return null;
        }

        const allowed = allowedByCategory[category];
        if (!allowed) {
          return null;
        }

        const suggestions = sanitizeSuggestions(group.suggestions)
          .map((name) => allowed.get(name.toLowerCase()))
          .filter((name): name is string => Boolean(name));

        if (suggestions.length === 0) {
          return null;
        }

        return {
          category,
          suggestions: Array.from(new Set(suggestions))
        };
      })
      .filter((group): group is NonNullable<typeof group> => group !== null);

    const summary =
      typeof llmOutput.summary === "string" && llmOutput.summary.trim().length > 0
        ? llmOutput.summary.trim()
        : `Detected ${missingSkills.length} categories with high-priority capability gaps.`;

    return {
      missingSkills,
      summary
    };
  }
};
