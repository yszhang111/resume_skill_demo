# PROJECT_PROMPT_FULL.md
# Skill‑First / Agent‑Style TypeScript 全栈 Demo（Next.js + Supabase，无登录）

> 这是【完整版 · 最终版】Prompt。
> 内容明显多于任何简化版，用于驱动 AI **完整生成一个 Skill‑Driven 系统**。
> 如果你看到的内容和之前“几乎一样”，说明你下载的不是这一版。

---

## 0. 项目一句话定义（给 AI 的总目标）

你要实现的不是“JD 分析工具”，而是一个：

**以 Skill 为一等公民、通过 Skill Orchestration 完成业务目标的执行型系统（Skill‑Driven Execution System）**。

系统是否成功的唯一标准：
> 如果移除任意一个核心 Skill，系统就无法完成完整分析流程。

---

## 1. 总体业务流程（必须严格实现）

```
User Input (JD Text)
        ↓
Skill Orchestrator
        ↓
┌─────────────────────────────┐
│  JD Parsing Skill            │
│  Skill Matching Skill        │
│  Gap Analysis Skill          │
│  Bullet Generation Skill     │
└─────────────────────────────┘
        ↓
Result Builder
        ↓
Persist to Supabase
        ↓
UI Rendering + History Replay
```

⚠️ **禁止跳过 Orchestrator 直接在 API 中写业务逻辑**。

---

## 2. 技术硬约束（违反即失败）

- TypeScript（strict = true）
- Next.js App Router（单 repo）
- Supabase Postgres（无登录、无 Auth）
- 前端禁止直连 Supabase
- 所有 DB 操作只能在 `app/api/**`
- 不使用 Prisma / SQLite
- 本地一条命令：`pnpm dev`
- 所有代码必须可运行

---

## 3. Skill 的系统级定义（核心）

### 3.1 Skill 的本质

Skill ≠ 标签  
Skill ≠ 关键词集合  

**Skill = 可执行能力单元（Executable Capability）**

### 3.2 Skill 接口（必须原样实现）

```ts
export interface Skill<I, O> {
  name: string;
  description: string;
  run(input: I): O;
}
```

约束：
- 单一职责
- 无副作用
- 不访问 DB
- 不依赖 UI
- 可独立测试

---

## 4. 必须实现的 4 个核心 Skills（详细版）

### 4.1 JD Parsing Skill

- 文件：`lib/skills/jdParsingSkill.ts`
- 职责：
  - 文本 normalize
  - 去标点 / 小写
  - 生成 token 列表
- 输出必须包含：
  - normalizedText
  - tokens

---

### 4.2 Skill Matching Skill

- 文件：`lib/skills/skillMatchingSkill.ts`
- 使用 `skillTaxonomy`
- 职责：
  - 遍历 taxonomy
  - 关键词命中
  - 记录 evidence
- 输出：
  - matchedSkills[]
  - 每个 skill 的命中关键词

---

### 4.3 Gap Analysis Skill

- 文件：`lib/skills/gapAnalysisSkill.ts`
- 职责：
  - 找出未命中的高权重 skills
  - 按 category 分组
- 输出：
  - missingSkills by category
  - gap summary

---

### 4.4 Bullet Generation Skill

- 文件：`lib/skills/bulletGenerationSkill.ts`
- 职责：
  - 基于 matched + gap
  - 使用模板生成 3–5 条 bullets
- 强约束：
  - 不调用外部 LLM
  - 模板必须体现工程感（平台 / pipeline / 系统）

---

## 5. Skill Orchestrator（系统大脑）

- 文件：`lib/orchestrator.ts`
- 职责：
  - 定义执行顺序
  - 管理 context
  - 汇总结果

示例结构（仅示意，需完整实现）：

```ts
const context = {};

context.parsed = jdParsingSkill.run(jdText);
context.matched = skillMatchingSkill.run(context.parsed);
context.gaps = gapAnalysisSkill.run(context.matched);
context.bullets = bulletGenerationSkill.run(context);

return buildAnalysisResult(context);
```

---

## 6. Skills Taxonomy（不是 Skill）

- 文件：`lib/skillTaxonomy.ts`
- 至少 6 大类：
  - Backend Engineering
  - Frontend Engineering
  - Data Engineering
  - AI / LLM
  - System / Infra
  - Experiment / AB Test

每个 skill：
```ts
{
  name: string;
  category: string;
  keywords: string[];
  weight: number;
}
```

---

## 7. AnalysisResult（统一数据契约）

```ts
export type AnalysisResult = {
  score: number;
  summary: string;
  executedSkills: {
    name: string;
    description: string;
  }[];
  categoryScores: {
    category: string;
    score: number;
  }[];
  matchedSkills: {
    category: string;
    name: string;
    weight: number;
    evidence: string[];
  }[];
  missingSkills: {
    category: string;
    suggestions: string[];
  }[];
  bullets: string[];
};
```

---

## 8. API 必须体现 Skill 调度

### POST /api/analyze
- 调用 orchestrator
- 返回 AnalysisResult
- 写入 Supabase

### GET /api/history
- 返回最近 N 条

### GET /api/history/[id]
- 返回完整 AnalysisResult

---

## 9. Supabase（无登录）

### 表：analyses
- id uuid PK
- jd_text text
- result_json jsonb
- score int
- created_at timestamptz

必须提供：`supabase.sql`

---

## 10. 前端（Skills 必须“被看见”）

首页必须展示：
- Skill 执行列表（按顺序）
- 每个 Skill 的职责说明
- 命中证据
- Gap skills
- Bullets（Copy）
- 分类图表

History：
- 列表页
- 详情页（完整 Skill 执行结果）

---

## 11. 项目结构（最终版）

```
app/
  page.tsx
  history/page.tsx
  history/[id]/page.tsx
  api/
    analyze/route.ts
    history/route.ts
    history/[id]/route.ts

lib/
  skills/
    jdParsingSkill.ts
    skillMatchingSkill.ts
    gapAnalysisSkill.ts
    bulletGenerationSkill.ts
  orchestrator.ts
  skillTaxonomy.ts
  supabase/server.ts
  types.ts

supabase.sql
README.md
```

---

## 12. 交付顺序（AI 必须逐步输出完整文件）

1. 项目初始化
2. Supabase SQL
3. Skill 接口 + Skills 实现
4. Orchestrator
5. API routes
6. 前端页面
7. README

---

## 13. 最终验收规则

> 删除 `lib/skills` 目录，系统必须无法运行。

否则视为失败。
