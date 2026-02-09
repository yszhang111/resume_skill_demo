import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { AnalysisResult } from "@/lib/types";

type AnalysisRow = {
  id: string;
  jd_text: string;
  score: number;
  created_at: string;
  result_json: AnalysisResult;
};

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from("analyses")
      .select("id, jd_text, score, created_at, result_json")
      .eq("id", id)
      .single();

    if (error) {
      const status = error.code === "PGRST116" ? 404 : 500;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ record: data as AnalysisRow });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
