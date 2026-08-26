"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { IconRail } from "@/components/layout/IconRail";
import { TopBar } from "@/components/layout/TopBar";
import { QuestionPanel } from "@/components/assessment/QuestionPanel";
import { AnswerSheetViewer } from "@/components/assessment/AnswerSheetViewer";
import { useAppStore } from "@/lib/store";
import type { AssessmentResult } from "@/lib/types";

export function AssessmentPage() {
  const router = useRouter();
  const { result, setResult, selectedQuestionId, setSelectedQuestionId } =
    useAppStore();

  useEffect(() => {
    if (result) return;
    try {
      const raw = sessionStorage.getItem("veda_assessment");
      if (raw) {
        const parsed = JSON.parse(raw) as AssessmentResult;
        setResult(parsed);
        setSelectedQuestionId(
          parsed.mappings.find((m) => m.status === "answered")?.questionId ??
            parsed.mappings[0]?.questionId ??
            null
        );
      }
    } catch {
      /* ignore */
    }
  }, [result, setResult, setSelectedQuestionId]);

  const selected = useMemo(
    () => result?.mappings.find((m) => m.questionId === selectedQuestionId) ?? null,
    [result, selectedQuestionId]
  );

  if (!result) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-muted">No assessment loaded yet.</p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-4 rounded-full bg-[#2a2a2a] px-5 py-2 text-sm font-medium text-white"
          >
            Go to upload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <IconRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          title="Exams"
          onBack={() => router.push("/")}
        />
        <main className="grid min-h-0 flex-1 gap-4 p-4 lg:grid-cols-2">
          <QuestionPanel
            result={result}
            selectedId={selectedQuestionId}
            onSelect={setSelectedQuestionId}
          />
          <AnswerSheetViewer result={result} selected={selected} />
        </main>
      </div>
    </div>
  );
}
