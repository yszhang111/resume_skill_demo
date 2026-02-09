export interface Skill<I, O> {
  name: string;
  description: string;
  run(input: I): Promise<O>;
}

export type SkillDefinition = {
  name: string;
  category: string;
  keywords: string[];
  weight: number;
};

export type LLMAnalysisBundle = {
  normalizedText: string;
  tokens: string[];
  matchedSkills: {
    name: string;
    evidence: string[];
  }[];
  missingSkills: {
    category: string;
    suggestions: string[];
  }[];
  summary: string;
  bullets: string[];
};

export type JDFetchInput = {
  url: string;
};

export type JDFetchOutput = {
  sourceUrl: string;
  title: string | null;
  jdText: string;
};

export type ParsedJD = {
  normalizedText: string;
  tokens: string[];
};

export type JDParsingInput = {
  jdText: string;
  bundle: LLMAnalysisBundle;
};

export type MatchedSkill = {
  category: string;
  name: string;
  weight: number;
  evidence: string[];
};

export type SkillMatchingOutput = {
  matchedSkills: MatchedSkill[];
};

export type SkillMatchingInput = {
  parsed: ParsedJD;
  bundle: LLMAnalysisBundle;
};

export type MissingSkillGroup = {
  category: string;
  suggestions: string[];
};

export type GapAnalysisOutput = {
  missingSkills: MissingSkillGroup[];
  summary: string;
};

export type GapAnalysisInput = {
  matched: SkillMatchingOutput;
  bundle: LLMAnalysisBundle;
};

export type BulletGenerationInput = {
  parsed: ParsedJD;
  matched: SkillMatchingOutput;
  gaps: GapAnalysisOutput;
  bundle: LLMAnalysisBundle;
};

export type AnalysisResult = {
  score: number;
  summary: string;
  executedSkills: {
    name: string;
    description: string;
  }[];
  categoryScores: {
    category: string;
    score: number;
  }[];
  matchedSkills: {
    category: string;
    name: string;
    weight: number;
    evidence: string[];
  }[];
  missingSkills: {
    category: string;
    suggestions: string[];
  }[];
  bullets: string[];
};

export type AnalysisRecord = {
  id: string;
  jd_text: string;
  score: number;
  created_at: string;
  result_json: AnalysisResult;
};
