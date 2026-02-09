"use client";

import Link from "next/link";
import { useState } from "react";
import AnalysisResultView from "@/components/AnalysisResultView";
import type { AnalysisResult } from "@/lib/types";

type AnalyzeApiResponse = AnalysisResult & {
  analysisId: string;
  createdAt: string;
};

type ErrorResponse = {
  error?: string;
  detail?: string;
};

const REQUEST_TIMEOUT_MS = 20000;

export default function HomePage() {
  const [jdText, setJdText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    let timeout: ReturnType<typeof setTimeout> | null = null;

    try {
      const controller = new AbortController();
      timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ jdText }),
        signal: controller.signal
      });

      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }

      const rawBody = await res.text();
      let parsed: (Partial<AnalyzeApiResponse> & ErrorResponse) | null = null;
      try {
        parsed = JSON.parse(rawBody) as Partial<AnalyzeApiResponse> & ErrorResponse;
      } catch {
        parsed = null;
      }

      if (!parsed) {
        throw new Error(`Analyze API returned non-JSON response (HTTP ${res.status}).`);
      }

      if (!res.ok || !parsed.analysisId || typeof parsed.score !== "number") {
        const message = parsed.detail ? `${parsed.error ?? "Analyze request failed."} ${parsed.detail}` : parsed.error;
        throw new Error(message ?? "Analyze request failed.");
      }

      setResult({
        score: parsed.score,
        summary: parsed.summary ?? "",
        executedSkills: parsed.executedSkills ?? [],
        categoryScores: parsed.categoryScores ?? [],
        matchedSkills: parsed.matchedSkills ?? [],
        missingSkills: parsed.missingSkills ?? [],
        bullets: parsed.bullets ?? []
      });
      setAnalysisId(parsed.analysisId);
    } catch (requestError) {
      const message =
        requestError instanceof DOMException && requestError.name === "AbortError"
          ? `Analyze request timed out after ${REQUEST_TIMEOUT_MS / 1000}s.`
          : requestError instanceof Error
            ? requestError.message
            : "Unknown error";
      setError(message);
      setResult(null);
      setAnalysisId(null);
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <header className="hero">
        <p className="kicker">Skill-Driven Execution System</p>
        <h1>Resume Skill Analyzer</h1>
        <p>
          Paste a Job Description to run JD Parsing, Skill Matching, Gap Analysis, and Bullet Generation
          through the orchestrator.
        </p>
        <div className="hero-actions">
          <Link href="/history" className="secondary-btn">
            Open History
          </Link>
        </div>
      </header>

      <section className="input-panel">
        <label htmlFor="jd-input">JD Text</label>
        <textarea
          id="jd-input"
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          placeholder="Paste full JD text here..."
          rows={10}
        />
        <button className="primary-btn" onClick={runAnalysis} disabled={loading || jdText.trim().length < 20}>
          {loading ? "Running..." : "Run Skill Analysis"}
        </button>
        {error ? <p className="error">{error}</p> : null}
        {analysisId ? (
          <p className="meta">
            Analysis saved. View details at <Link href={`/history/${analysisId}`}>/history/{analysisId}</Link>
          </p>
        ) : null}
      </section>

      {result ? <AnalysisResultView result={result} /> : null}
    </main>
  );
}
