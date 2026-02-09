import type { LLMAnalysisBundle, SkillDefinition } from "@/lib/types";

const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";

const stripCodeFence = (content: string): string =>
  content
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

const parseJSON = <T>(content: string): T => {
  const cleaned = stripCodeFence(content);
  return JSON.parse(cleaned) as T;
};

type OpenAIMessage = {
  role: "system" | "user";
  content: string;
};

type CallOpenAIJSONOptions<T> = {
  model?: string;
  temperature?: number;
  messages: OpenAIMessage[];
  validate: (data: unknown) => data is T;
};

const toOpenAIEndpoint = (): string => {
  const baseUrl = (process.env.OPENAI_BASE_URL ?? DEFAULT_OPENAI_BASE_URL).replace(/\/+$/, "");
  return `${baseUrl}/chat/completions`;
};

const formatNetworkError = (error: unknown): string => {
  if (error instanceof Error) {
    const cause = error.cause as { code?: string; message?: string } | undefined;
    const causeCode = cause?.code ? ` (${cause.code})` : "";
    const causeMessage = cause?.message ? `; cause: ${cause.message}` : "";
    return `${error.message}${causeCode}${causeMessage}`;
  }

  return String(error);
};

export const callOpenAIJSON = async <T>({
  model,
  temperature = 0.2,
  messages,
  validate
}: CallOpenAIJSONOptions<T>): Promise<T> => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY. LLM-driven skills require this env var.");
  }

  const chosenModel = model ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const endpoint = toOpenAIEndpoint();
  const timeoutMs = Number.parseInt(process.env.OPENAI_TIMEOUT_MS ?? "30000", 10);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: chosenModel,
        temperature,
        response_format: { type: "json_object" },
        messages
      }),
      signal: AbortSignal.timeout(Number.isNaN(timeoutMs) ? 30000 : timeoutMs)
    });
  } catch (error) {
    throw new Error(
      `OpenAI network request failed for ${endpoint}. ${formatNetworkError(error)}. ` +
        "Check network/proxy/DNS, or set OPENAI_BASE_URL to an accessible endpoint."
    );
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${detail}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string | null;
      };
    }>;
  };

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI response content is empty.");
  }

  let parsed: unknown;
  try {
    parsed = parseJSON<unknown>(content);
  } catch {
    throw new Error("OpenAI response is not valid JSON.");
  }

  if (!validate(parsed)) {
    throw new Error("OpenAI response JSON schema validation failed.");
  }

  return parsed;
};

type LLMBundleRaw = {
  normalizedText?: unknown;
  tokens?: unknown;
  matchedSkills?: unknown;
  missingSkills?: unknown;
  summary?: unknown;
  bullets?: unknown;
};

const isLLMBundleRaw = (data: unknown): data is LLMBundleRaw => Boolean(data) && typeof data === "object";

const normalizeText = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s#+./-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const toStringList = (value: unknown): string[] => {
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

const sanitizeMatchedSkills = (value: unknown): LLMAnalysisBundle["matchedSkills"] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const name = typeof (item as { name?: unknown }).name === "string" ? (item as { name: string }).name : "";
      const evidence = toStringList((item as { evidence?: unknown }).evidence);
      if (!name.trim() || evidence.length === 0) {
        return null;
      }

      return {
        name: name.trim(),
        evidence
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .filter((item, index, array) => array.findIndex((target) => target.name === item.name) === index);
};

const sanitizeMissingSkills = (value: unknown): LLMAnalysisBundle["missingSkills"] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const category =
        typeof (item as { category?: unknown }).category === "string"
          ? (item as { category: string }).category.trim()
          : "";
      const suggestions = toStringList((item as { suggestions?: unknown }).suggestions);
      if (!category || suggestions.length === 0) {
        return null;
      }

      return {
        category,
        suggestions: Array.from(new Set(suggestions))
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
};

const sanitizeBullets = (value: unknown): string[] => {
  return Array.from(new Set(toStringList(value))).slice(0, 5);
};

export const generateLLMAnalysisBundle = async (
  jdText: string,
  taxonomy: SkillDefinition[]
): Promise<LLMAnalysisBundle> => {
  const raw = await callOpenAIJSON<LLMBundleRaw>({
    messages: [
      {
        role: "system",
        content:
          "You are a skill orchestration planner. For the given JD and taxonomy, produce one JSON object with: normalizedText, tokens, matchedSkills(name+evidence), missingSkills(category+suggestions), summary, bullets. Use only taxonomy skill names/categories."
      },
      {
        role: "user",
        content: JSON.stringify({
          jdText,
          taxonomy,
          output_schema: {
            normalizedText: "string",
            tokens: ["string"],
            matchedSkills: [{ name: "string", evidence: ["string"] }],
            missingSkills: [{ category: "string", suggestions: ["string"] }],
            summary: "string",
            bullets: ["string"]
          },
          constraints: [
            "bullets must be 3 to 5 items",
            "summary should be concise",
            "evidence should be keyword-level"
          ]
        })
      }
    ],
    validate: isLLMBundleRaw
  });

  const normalizedText = normalizeText(
    typeof raw.normalizedText === "string" && raw.normalizedText.trim().length > 0
      ? raw.normalizedText
      : jdText
  );

  const tokensFromModel = toStringList(raw.tokens);
  const tokens = tokensFromModel.length > 0 ? tokensFromModel : normalizedText.split(" ").filter(Boolean);

  const summary =
    typeof raw.summary === "string" && raw.summary.trim().length > 0
      ? raw.summary.trim()
      : "Skill analysis completed with LLM-generated orchestration output.";

  const bullets = sanitizeBullets(raw.bullets);
  if (bullets.length < 3) {
    throw new Error("LLM bundle generation failed: bullets fewer than 3.");
  }

  return {
    normalizedText,
    tokens,
    matchedSkills: sanitizeMatchedSkills(raw.matchedSkills),
    missingSkills: sanitizeMissingSkills(raw.missingSkills),
    summary,
    bullets
  };
};
