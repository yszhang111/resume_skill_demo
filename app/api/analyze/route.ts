import { NextRequest, NextResponse } from "next/server";
import { runSkillDrivenAnalysis } from "@/lib/orchestrator";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { AnalysisResult } from "@/lib/types";

type AnalyzeRequestBody = {
  jdText?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AnalyzeRequestBody;
    const jdText = body.jdText?.trim() ?? "";

    if (jdText.length < 20) {
      return NextResponse.json(
        { error: "jdText is required and must be at least 20 characters." },
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
      ...result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
