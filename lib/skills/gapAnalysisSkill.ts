import { skillTaxonomy } from "../skillTaxonomy";
import type { GapAnalysisInput, GapAnalysisOutput, Skill } from "../types";

const HIGH_WEIGHT_THRESHOLD = 4;

export const gapAnalysisSkill: Skill<GapAnalysisInput, GapAnalysisOutput> = {
  name: "Gap Analysis Skill",
  description: "Derive high-priority category gaps from shared LLM bundle and canonical taxonomy.",
  async run(input: GapAnalysisInput): Promise<GapAnalysisOutput> {
    const highWeightTaxonomy = skillTaxonomy.filter((skill) => skill.weight >= HIGH_WEIGHT_THRESHOLD);

    const allowedByCategory = highWeightTaxonomy.reduce<Record<string, Map<string, string>>>((acc, skill) => {
      if (!acc[skill.category]) {
        acc[skill.category] = new Map<string, string>();
      }
      acc[skill.category].set(skill.name.toLowerCase(), skill.name);
      return acc;
    }, {});

    const missingFromBundle = input.bundle.missingSkills
      .map((group) => {
        const allowed = allowedByCategory[group.category];
        if (!allowed) {
          return null;
        }

        const suggestions = group.suggestions
          .map((suggestion) => allowed.get(suggestion.toLowerCase()))
          .filter((suggestion): suggestion is string => Boolean(suggestion));

        if (suggestions.length === 0) {
          return null;
        }

        return {
          category: group.category,
          suggestions: Array.from(new Set(suggestions))
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const matchedNames = new Set(input.matched.matchedSkills.map((skill) => skill.name));
    const fallbackMissing = highWeightTaxonomy
      .filter((skill) => !matchedNames.has(skill.name))
      .reduce<Record<string, string[]>>((acc, skill) => {
        if (!acc[skill.category]) {
          acc[skill.category] = [];
        }
        acc[skill.category].push(skill.name);
        return acc;
      }, {});

    const fallbackGroups = Object.entries(fallbackMissing).map(([category, suggestions]) => ({
      category,
      suggestions
    }));

    const missingSkills = missingFromBundle.length > 0 ? missingFromBundle : fallbackGroups;

    const summary =
      input.bundle.summary.trim().length > 0
        ? input.bundle.summary.trim()
        : `Detected ${missingSkills.length} categories with high-priority capability gaps.`;

    return {
      missingSkills,
      summary
    };
  }
};
