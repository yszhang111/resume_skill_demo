"use client";

import Link from "next/link";
import { useState } from "react";
import AnalysisResultView from "@/components/AnalysisResultView";
import type { AnalysisResult } from "@/lib/types";

type AnalyzeApiResponse = AnalysisResult & {
  analysisId: string;
  createdAt: string;
};

export default function HomePage() {
  const [jdText, setJdText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ jdText })
      });

      const data = (await res.json()) as Partial<AnalyzeApiResponse> & { error?: string };

      if (!res.ok || !data.analysisId || typeof data.score !== "number") {
        throw new Error(data.error ?? "Analyze request failed.");
      }

      setResult({
        score: data.score,
        summary: data.summary ?? "",
        executedSkills: data.executedSkills ?? [],
        categoryScores: data.categoryScores ?? [],
        matchedSkills: data.matchedSkills ?? [],
        missingSkills: data.missingSkills ?? [],
        bullets: data.bullets ?? []
      });
      setAnalysisId(data.analysisId);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Unknown error";
      setError(message);
      setResult(null);
      setAnalysisId(null);
    } finally {
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
