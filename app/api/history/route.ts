import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type HistoryRow = {
  id: string;
  jd_text: string;
  score: number;
  created_at: string;
};

export async function GET(req: NextRequest) {
  try {
    const limitParam = req.nextUrl.searchParams.get("limit") ?? "20";
    const parsedLimit = Number.parseInt(limitParam, 10);
    const limit = Number.isNaN(parsedLimit) ? 20 : Math.max(1, Math.min(100, parsedLimit));

    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from("analyses")
      .select("id, jd_text, score, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = ((data ?? []) as HistoryRow[]).map((row) => ({
      ...row,
      jd_preview: row.jd_text.slice(0, 160)
    }));

    return NextResponse.json({ records: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
