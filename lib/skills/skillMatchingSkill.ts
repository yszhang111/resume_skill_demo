import { skillTaxonomy } from "../skillTaxonomy";
import type { MatchedSkill, Skill, SkillMatchingInput, SkillMatchingOutput } from "../types";

const taxonomyByName = new Map(skillTaxonomy.map((skill) => [skill.name.toLowerCase(), skill]));

export const skillMatchingSkill: Skill<SkillMatchingInput, SkillMatchingOutput> = {
  name: "Skill Matching Skill",
  description: "Map shared LLM matched skills into canonical taxonomy-constrained matches.",
  async run(input: SkillMatchingInput): Promise<SkillMatchingOutput> {
    const matchedSkills = input.bundle.matchedSkills
      .map((item) => {
        const canonical = taxonomyByName.get(item.name.toLowerCase());
        if (!canonical) {
          return null;
        }

        const keywordSet = new Set(canonical.keywords.map((keyword) => keyword.toLowerCase()));
        const evidence = item.evidence
          .map((value) => value.trim())
          .filter((value) => value.length > 0)
          .filter((value) => keywordSet.has(value.toLowerCase()))
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
