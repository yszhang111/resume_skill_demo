import { callOpenAIJSON } from "@/lib/llm/openai";
import type { ParsedJD, Skill } from "../types";

type ParsedJDRaw = {
  normalizedText?: unknown;
  tokens?: unknown;
};

const isParsedJDRaw = (data: unknown): data is ParsedJDRaw => {
  return Boolean(data) && typeof data === "object";
};

const normalizeText = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s#+./-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const sanitizeTokens = (tokens: unknown, normalizedText: string): string[] => {
  if (Array.isArray(tokens)) {
    const cleaned = tokens
      .filter((token): token is string => typeof token === "string")
      .map((token) => token.trim())
      .filter((token) => token.length > 0);

    if (cleaned.length > 0) {
      return cleaned;
    }
  }

  if (typeof tokens === "string") {
    const fromString = tokens
      .split(/[\s,]+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 0);

    if (fromString.length > 0) {
      return fromString;
    }
  }

  return normalizedText.length > 0 ? normalizedText.split(" ") : [];
};

export const jdParsingSkill: Skill<string, ParsedJD> = {
  name: "JD Parsing Skill",
  description: "LLM-normalize JD text and generate token list.",
  async run(input: string): Promise<ParsedJD> {
    const raw = await callOpenAIJSON<ParsedJDRaw>({
      messages: [
        {
          role: "system",
          content:
            "You are JD Parsing Skill. Return JSON with normalizedText and tokens. normalizedText should be lowercase punctuation-cleaned text. tokens should be tokens from normalizedText."
        },
        {
          role: "user",
          content: JSON.stringify({
            jdText: input,
            output_schema: {
              normalizedText: "string",
              tokens: ["string"]
            }
          })
        }
      ],
      validate: isParsedJDRaw
    });

    const normalizedText = normalizeText(
      typeof raw.normalizedText === "string" && raw.normalizedText.trim().length > 0
        ? raw.normalizedText
        : input
    );

    const tokens = sanitizeTokens(raw.tokens, normalizedText);

    return {
      normalizedText,
      tokens
    };
  }
};
