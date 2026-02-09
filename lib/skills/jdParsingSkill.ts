import type { JDParsingInput, ParsedJD, Skill } from "../types";

const normalizeText = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s#+./-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const jdParsingSkill: Skill<JDParsingInput, ParsedJD> = {
  name: "JD Parsing Skill",
  description: "Consume shared LLM bundle and produce normalized JD text with token list.",
  async run(input: JDParsingInput): Promise<ParsedJD> {
    const normalizedText = normalizeText(input.bundle.normalizedText || input.jdText);
    const tokens =
      input.bundle.tokens.length > 0
        ? input.bundle.tokens.map((token) => token.trim()).filter((token) => token.length > 0)
        : normalizedText.split(" ").filter((token) => token.length > 0);

    return {
      normalizedText,
      tokens
    };
  }
};
