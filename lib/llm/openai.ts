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
