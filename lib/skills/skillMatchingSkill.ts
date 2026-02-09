import { callOpenAIJSON } from "@/lib/llm/openai";
import { skillTaxonomy } from "../skillTaxonomy";
import type { MatchedSkill, ParsedJD, Skill, SkillMatchingOutput } from "../types";

type MatchedSkillRaw = {
  category?: unknown;
  name?: unknown;
  evidence?: unknown;
};

type SkillMatchingRaw = {
  matchedSkills?: unknown;
};

const taxonomyByName = new Map(skillTaxonomy.map((skill) => [skill.name.toLowerCase(), skill]));

const isSkillMatchingRaw = (data: unknown): data is SkillMatchingRaw => {
  return Boolean(data) && typeof data === "object";
};

const sanitizeEvidence = (value: unknown): string[] => {
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

export const skillMatchingSkill: Skill<ParsedJD, SkillMatchingOutput> = {
  name: "Skill Matching Skill",
  description: "LLM match taxonomy skills with evidence from parsed JD.",
  async run(input: ParsedJD): Promise<SkillMatchingOutput> {
    const llmOutput = await callOpenAIJSON<SkillMatchingRaw>({
      messages: [
        {
          role: "system",
          content:
            "You are Skill Matching Skill. Select only skills from provided taxonomy that are explicitly supported by the JD. Return JSON { matchedSkills: [...] }. Do not invent skill names/categories. evidence should come from taxonomy keywords."
        },
        {
          role: "user",
          content: JSON.stringify({
            parsedJD: input,
            taxonomy: skillTaxonomy,
            output_schema: {
              matchedSkills: [
                {
                  category: "string",
                  name: "string",
                  evidence: ["string"]
                }
              ]
            }
          })
        }
      ],
      validate: isSkillMatchingRaw
    });

    const rawList = Array.isArray(llmOutput.matchedSkills)
      ? (llmOutput.matchedSkills as MatchedSkillRaw[])
      : [];

    const matchedSkills = rawList
      .map((item) => {
        const name = typeof item.name === "string" ? item.name.trim().toLowerCase() : "";
        const canonical = taxonomyByName.get(name);
        if (!canonical) {
          return null;
        }

        const evidenceCandidates = sanitizeEvidence(item.evidence);
        const keywordSet = new Set(canonical.keywords.map((keyword) => keyword.toLowerCase()));

        const evidence = evidenceCandidates
          .filter((candidate) => keywordSet.has(candidate.toLowerCase()))
          .slice(0, 6);

        if (evidence.length === 0) {
          return null;
        }

        return {
          category: canonical.category,
          name: canonical.name,
          weight: canonical.weight,
          evidence
        } satisfies MatchedSkill;
      })
      .filter((item): item is MatchedSkill => item !== null)
      .filter((item, index, array) => array.findIndex((target) => target.name === item.name) === index);

    return {
      matchedSkills
    };
  }
};
