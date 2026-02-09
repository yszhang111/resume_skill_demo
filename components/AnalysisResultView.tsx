"use client";

import type { AnalysisResult } from "@/lib/types";

type AnalysisResultViewProps = {
  result: AnalysisResult;
};

const ScoreBar = ({ label, score }: { label: string; score: number }) => (
  <div className="score-item">
    <div className="score-label-row">
      <span>{label}</span>
      <span>{score}%</span>
    </div>
    <div className="score-track">
      <div className="score-fill" style={{ width: `${score}%` }} />
    </div>
  </div>
);

export default function AnalysisResultView({ result }: AnalysisResultViewProps) {
  const copyBullets = async () => {
    const text = result.bullets.map((bullet) => `- ${bullet}`).join("\n");
    await navigator.clipboard.writeText(text);
  };

  return (
    <section className="result-panel">
      <div className="result-header">
        <h2>Analysis Result</h2>
        <span className="score-chip">Overall Score: {result.score}</span>
      </div>

      <p className="summary">{result.summary}</p>

      <div className="grid two-col">
        <article className="card">
          <h3>Skill Execution Order</h3>
          <ol className="clean-list ordered">
            {result.executedSkills.map((skill) => (
              <li key={skill.name}>
                <strong>{skill.name}</strong>
                <p>{skill.description}</p>
              </li>
            ))}
          </ol>
        </article>

        <article className="card">
          <h3>Category Scores</h3>
          <div className="score-list">
            {result.categoryScores.map((item) => (
              <ScoreBar key={item.category} label={item.category} score={item.score} />
            ))}
          </div>
        </article>
      </div>

      <div className="grid two-col">
        <article className="card">
          <h3>Matched Skills With Evidence</h3>
          <ul className="clean-list">
            {result.matchedSkills.map((skill) => (
              <li key={`${skill.category}-${skill.name}`}>
                <p>
                  <strong>{skill.name}</strong> ({skill.category}) - weight {skill.weight}
                </p>
                <p className="meta">Evidence: {skill.evidence.join(", ")}</p>
              </li>
            ))}
          </ul>
        </article>

        <article className="card">
          <h3>Gap Skills</h3>
          {result.missingSkills.length === 0 ? (
            <p className="meta">No high-priority gaps found.</p>
          ) : (
            <ul className="clean-list">
              {result.missingSkills.map((group) => (
                <li key={group.category}>
                  <p>
                    <strong>{group.category}</strong>
                  </p>
                  <p className="meta">{group.suggestions.join(" / ")}</p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>

      <article className="card">
        <div className="card-header-row">
          <h3>Generated Resume Bullets</h3>
          <button className="secondary-btn" onClick={copyBullets} type="button">
            Copy Bullets
          </button>
        </div>
        <ul className="clean-list bullets">
          {result.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </article>
    </section>
  );
}
