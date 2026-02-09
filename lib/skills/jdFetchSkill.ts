import type { JDFetchInput, JDFetchOutput, Skill } from "../types";

const DEFAULT_TIMEOUT_MS = 15000;

const decodeEntities = (input: string): string =>
  input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number.parseInt(code, 10)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCharCode(Number.parseInt(code, 16)));

const cleanText = (html: string): string => {
  const stripped = html
    .replace(/<!--([\s\S]*?)-->/g, " ")
    .replace(/<(script|style|noscript|svg|iframe)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|h1|h2|h3|h4|section|div|article)>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  return decodeEntities(stripped)
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .replace(/[ \u00A0]{2,}/g, " ")
    .trim();
};

const extractTitle = (html: string): string | null => {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match?.[1]) {
    return null;
  }

  const title = cleanText(match[1]);
  return title.length > 0 ? title : null;
};

const extractFocusedSections = (html: string): string[] => {
  const pattern =
    /<(section|article|div)[^>]*(job|description|responsibilit|qualif|about|role|requirement|what-youll-do|what-you'll-do)[^>]*>[\s\S]*?<\/\1>/gi;

  const sections: string[] = [];
  for (const match of html.matchAll(pattern)) {
    if (match[0]) {
      sections.push(match[0]);
    }
  }

  return sections;
};

const toValidatedUrl = (input: string): string => {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error("Invalid URL format.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http/https URLs are supported.");
  }

  return url.toString();
};

const extractJDText = (html: string): string => {
  const focusedSections = extractFocusedSections(html);
  const focusedText = cleanText(focusedSections.join("\n"));
  if (focusedText.length >= 180) {
    return focusedText;
  }

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyText = cleanText(bodyMatch?.[1] ?? html);
  return bodyText;
};

export const jdFetchSkill: Skill<JDFetchInput, JDFetchOutput> = {
  name: "JD Fetch Skill",
  description: "Fetch a JD page from URL and extract readable job description text.",
  async run(input: JDFetchInput): Promise<JDFetchOutput> {
    const sourceUrl = toValidatedUrl(input.url.trim());
    const timeoutMs = Number.parseInt(process.env.JD_FETCH_TIMEOUT_MS ?? `${DEFAULT_TIMEOUT_MS}`, 10);

    let response: Response;
    try {
      response = await fetch(sourceUrl, {
        method: "GET",
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8"
        },
        signal: AbortSignal.timeout(Number.isNaN(timeoutMs) ? DEFAULT_TIMEOUT_MS : timeoutMs)
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown fetch error";
      throw new Error(`Failed to fetch JD URL. ${message}`);
    }

    if (!response.ok) {
      throw new Error(`JD URL fetch failed with status ${response.status}.`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    const raw = await response.text();

    const title = /html/i.test(contentType) ? extractTitle(raw) : null;
    const jdText = /html/i.test(contentType) ? extractJDText(raw) : raw.trim();

    if (jdText.length < 120) {
      throw new Error(
        "Extracted JD text is too short. The page may block crawling or require JavaScript rendering."
      );
    }

    return {
      sourceUrl,
      title,
      jdText
    };
  }
};
