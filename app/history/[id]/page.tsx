"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AnalysisResultView from "@/components/AnalysisResultView";
import type { AnalysisResult } from "@/lib/types";

type DetailRecord = {
  id: string;
  jd_text: string;
  score: number;
  created_at: string;
  result_json: AnalysisResult;
};

type DetailApiResponse = {
  record: DetailRecord;
};

export default function HistoryDetailPage() {
  const params = useParams<{ id: string }>();
  const [record, setRecord] = useState<DetailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = params.id;
    if (!id) {
      setError("Missing analysis id.");
      setLoading(false);
      return;
    }

    const loadDetail = async () => {
      try {
        const res = await fetch(`/api/history/${id}`);
        const data = (await res.json()) as DetailApiResponse & { error?: string };

        if (!res.ok || !data.record) {
          throw new Error(data.error ?? "Failed to load analysis detail.");
        }

        setRecord(data.record);
      } catch (requestError) {
        const message = requestError instanceof Error ? requestError.message : "Unknown error";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void loadDetail();
  }, [params.id]);

  return (
    <main className="container">
      <header className="hero small">
        <p className="kicker">History Detail</p>
        <h1>Analysis Replay</h1>
        <p>
          <Link href="/history" className="secondary-btn inline">
            Back to History
          </Link>
        </p>
      </header>

      {loading ? <p>Loading...</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {record ? (
        <section className="detail-block">
          <article className="card">
            <div className="card-header-row">
              <h3>Original JD</h3>
              <span className="meta">{new Date(record.created_at).toLocaleString()}</span>
            </div>
            <pre className="jd-preview">{record.jd_text}</pre>
          </article>
          <AnalysisResultView result={record.result_json} />
        </section>
      ) : null}
    </main>
  );
}
