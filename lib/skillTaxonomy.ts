import type { SkillDefinition } from "./types";

export const skillTaxonomy: SkillDefinition[] = [
  {
    name: "API Design",
    category: "Backend Engineering",
    keywords: ["api", "rest", "graphql", "endpoint", "microservice"],
    weight: 5
  },
  {
    name: "Service Architecture",
    category: "Backend Engineering",
    keywords: ["distributed", "service", "backend", "scalable", "high availability"],
    weight: 4
  },
  {
    name: "React UI Architecture",
    category: "Frontend Engineering",
    keywords: ["react", "next.js", "frontend", "ui", "component"],
    weight: 4
  },
  {
    name: "Performance Optimization",
    category: "Frontend Engineering",
    keywords: ["performance", "web vitals", "lazy loading", "bundle", "rendering"],
    weight: 3
  },
  {
    name: "Data Pipeline",
    category: "Data Engineering",
    keywords: ["etl", "pipeline", "airflow", "batch", "stream"],
    weight: 5
  },
  {
    name: "Data Modeling",
    category: "Data Engineering",
    keywords: ["data model", "warehouse", "schema", "sql", "analytics"],
    weight: 4
  },
  {
    name: "Prompt Engineering",
    category: "AI / LLM",
    keywords: ["prompt", "llm", "agent", "rag", "embedding"],
    weight: 4
  },
  {
    name: "Model Evaluation",
    category: "AI / LLM",
    keywords: ["evaluation", "accuracy", "hallucination", "benchmark", "inference"],
    weight: 3
  },
  {
    name: "Cloud Infrastructure",
    category: "System / Infra",
    keywords: ["aws", "gcp", "kubernetes", "terraform", "observability"],
    weight: 4
  },
  {
    name: "Reliability Engineering",
    category: "System / Infra",
    keywords: ["slo", "sla", "incident", "monitoring", "resilience"],
    weight: 4
  },
  {
    name: "Experiment Design",
    category: "Experiment / AB Test",
    keywords: ["a/b", "experiment", "hypothesis", "metric", "statistical"],
    weight: 4
  },
  {
    name: "Growth Analytics",
    category: "Experiment / AB Test",
    keywords: ["conversion", "retention", "funnel", "cohort", "uplift"],
    weight: 3
  }
];

export const TAXONOMY_CATEGORIES = Array.from(new Set(skillTaxonomy.map((skill) => skill.category)));
