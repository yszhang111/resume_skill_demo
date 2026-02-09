import { NextRequest, NextResponse } from "next/server";
import { runSkillDrivenAnalysis } from "@/lib/orchestrator";
import { jdFetchSkill } from "@/lib/skills/jdFetchSkill";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { AnalysisResult } from "@/lib/types";

type AnalyzeRequestBody = {
  jdText?: string;
  jdUrl?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AnalyzeRequestBody;
    let jdText = body.jdText?.trim() ?? "";
    let sourceUrl: string | null = null;

    if (jdText.length < 20 && body.jdUrl?.trim()) {
      try {
        const extracted = await jdFetchSkill.run({ url: body.jdUrl.trim() });
        jdText = extracted.jdText;
        sourceUrl = extracted.sourceUrl;
      } catch (fetchError) {
        const detail = fetchError instanceof Error ? fetchError.message : "Unknown JD fetch error";
        return NextResponse.json(
          {
            error: "JD URL extraction failed.",
            detail
          },
          { status: 400 }
        );
      }
    }

    if (jdText.length < 20) {
      return NextResponse.json(
        { error: "jdText is required (>=20 chars), or provide a valid jdUrl." },
        { status: 400 }
      );
    }

    let result: AnalysisResult;
    try {
      result = await runSkillDrivenAnalysis(jdText);
    } catch (skillError) {
      const message = skillError instanceof Error ? skillError.message : "Unknown skill execution error";
      return NextResponse.json(
        {
          error: "Skill orchestration failed.",
          detail: message
        },
        { status: 502 }
      );
    }

    let supabase: ReturnType<typeof getSupabaseServerClient>;
    try {
      supabase = getSupabaseServerClient();
    } catch (supabaseClientError) {
      const message =
        supabaseClientError instanceof Error ? supabaseClientError.message : "Supabase client init failed";
      return NextResponse.json(
        {
          error: "Supabase client initialization failed.",
          detail: message
        },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from("analyses")
      .insert({
        jd_text: jdText,
        result_json: result,
        score: result.score
      })
      .select("id, created_at")
      .single();

    if (error) {
      return NextResponse.json(
        {
          error: "Database insert failed.",
          detail: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      analysisId: data.id,
      createdAt: data.created_at,
      sourceUrl,
      ...result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
