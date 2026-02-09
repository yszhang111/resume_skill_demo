import { NextRequest, NextResponse } from "next/server";
import { jdFetchSkill } from "@/lib/skills/jdFetchSkill";

type ExtractJDRequestBody = {
  url?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ExtractJDRequestBody;
    const url = body.url?.trim() ?? "";

    if (!url) {
      return NextResponse.json({ error: "url is required." }, { status: 400 });
    }

    const result = await jdFetchSkill.run({ url });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const isClientError =
      message.includes("Invalid URL") ||
      message.includes("Only http/https") ||
      message.includes("too short");
    return NextResponse.json(
      {
        error: "JD extraction failed.",
        detail: message
      },
      { status: isClientError ? 400 : 500 }
    );
  }
}
