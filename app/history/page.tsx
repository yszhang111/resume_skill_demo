"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type HistoryRecord = {
  id: string;
  score: number;
  created_at: string;
  jd_preview: string;
};

type HistoryApiResponse = {
  records: HistoryRecord[];
};

export default function HistoryPage() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch("/api/history?limit=30");
        const data = (await res.json()) as HistoryApiResponse & { error?: string };

        if (!res.ok || !data.records) {
          throw new Error(data.error ?? "Failed to load history.");
        }

        setRecords(data.records);
      } catch (requestError) {
        const message = requestError instanceof Error ? requestError.message : "Unknown error";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void loadHistory();
  }, []);

  return (
    <main className="container narrow">
      <header className="hero small">
        <p className="kicker">History Replay</p>
        <h1>Analysis History</h1>
        <p>
          <Link href="/" className="secondary-btn inline">
            Back to Home
          </Link>
        </p>
      </header>

      {loading ? <p>Loading...</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <section className="history-list">
        {records.map((record) => (
          <article className="card" key={record.id}>
            <div className="card-header-row">
              <h3>{record.score} / 100</h3>
              <span className="meta">{new Date(record.created_at).toLocaleString()}</span>
            </div>
            <p>{record.jd_preview}...</p>
            <Link href={`/history/${record.id}`} className="primary-btn inline">
              Open Detail
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
