import { TAXONOMY_CATEGORIES, skillTaxonomy } from "./skillTaxonomy";
import { bulletGenerationSkill } from "./skills/bulletGenerationSkill";
import { gapAnalysisSkill } from "./skills/gapAnalysisSkill";
import { jdParsingSkill } from "./skills/jdParsingSkill";
import { skillMatchingSkill } from "./skills/skillMatchingSkill";
import type { AnalysisResult } from "./types";

const clampScore = (score: number): number => {
  if (score < 0) {
    return 0;
  }
  if (score > 100) {
    return 100;
  }
  return Math.round(score);
};

const buildCategoryScores = (matchedSkills: AnalysisResult["matchedSkills"]) => {
  return TAXONOMY_CATEGORIES.map((category) => {
    const categoryWeightTotal = skillTaxonomy
      .filter((skill) => skill.category === category)
      .reduce((sum, skill) => sum + skill.weight, 0);

    const matchedWeightTotal = matchedSkills
      .filter((skill) => skill.category === category)
      .reduce((sum, skill) => sum + skill.weight, 0);

    const ratio = categoryWeightTotal === 0 ? 0 : (matchedWeightTotal / categoryWeightTotal) * 100;

    return {
      category,
      score: clampScore(ratio)
    };
  });
};

const buildSummary = (
  score: number,
  matchedCount: number,
  missingCategoryCount: number,
  gapSummary: string
): string => {
  return `JD coverage score ${score}/100 with ${matchedCount} matched skills across taxonomy. ${gapSummary} Missing categories: ${missingCategoryCount}.`;
};

export const runSkillDrivenAnalysis = async (jdText: string): Promise<AnalysisResult> => {
  const context: {
    parsed: Awaited<ReturnType<typeof jdParsingSkill.run>>;
    matched: Awaited<ReturnType<typeof skillMatchingSkill.run>>;
    gaps: Awaited<ReturnType<typeof gapAnalysisSkill.run>>;
    bullets: Awaited<ReturnType<typeof bulletGenerationSkill.run>>;
  } = {
    parsed: { normalizedText: "", tokens: [] },
    matched: { matchedSkills: [] },
    gaps: { missingSkills: [], summary: "" },
    bullets: []
  };

  try {
    context.parsed = await jdParsingSkill.run(jdText);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`[${jdParsingSkill.name}] ${message}`);
  }

  try {
    context.matched = await skillMatchingSkill.run(context.parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`[${skillMatchingSkill.name}] ${message}`);
  }

  try {
    context.gaps = await gapAnalysisSkill.run(context.matched);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`[${gapAnalysisSkill.name}] ${message}`);
  }

  try {
    context.bullets = await bulletGenerationSkill.run({
      parsed: context.parsed,
      matched: context.matched,
      gaps: context.gaps
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`[${bulletGenerationSkill.name}] ${message}`);
  }

  const totalWeight = skillTaxonomy.reduce((sum, skill) => sum + skill.weight, 0);
  const matchedWeight = context.matched.matchedSkills.reduce((sum, skill) => sum + skill.weight, 0);
  const score = clampScore(totalWeight === 0 ? 0 : (matchedWeight / totalWeight) * 100);

  const result: AnalysisResult = {
    score,
    summary: buildSummary(
      score,
      context.matched.matchedSkills.length,
      context.gaps.missingSkills.length,
      context.gaps.summary
    ),
    executedSkills: [
      {
        name: jdParsingSkill.name,
        description: jdParsingSkill.description
      },
      {
        name: skillMatchingSkill.name,
        description: skillMatchingSkill.description
      },
      {
        name: gapAnalysisSkill.name,
        description: gapAnalysisSkill.description
      },
      {
        name: bulletGenerationSkill.name,
        description: bulletGenerationSkill.description
      }
    ],
    categoryScores: buildCategoryScores(context.matched.matchedSkills),
    matchedSkills: context.matched.matchedSkills,
    missingSkills: context.gaps.missingSkills,
    bullets: context.bullets
  };

  return result;
};
