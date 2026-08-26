import { NextRequest, NextResponse } from "next/server";
import { runFullAssessment } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const questionPaperPages = body.questionPaperPages as string[] | undefined;
    const answerSheetPages = body.answerSheetPages as string[] | undefined;

    if (!questionPaperPages?.length || !answerSheetPages?.length) {
      return NextResponse.json(
        { error: "Both question paper and answer sheet pages are required." },
        { status: 400 }
      );
    }

    if (questionPaperPages.length > 12 || answerSheetPages.length > 12) {
      return NextResponse.json(
        { error: "Too many pages (max 12 per document)." },
        { status: 400 }
      );
    }

    const result = await runFullAssessment({
      questionPaperPages,
      answerSheetPages,
    });

    return NextResponse.json({ result });
  } catch (err) {
    console.error("Process error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to process assessment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
