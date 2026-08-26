"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { UploadZone } from "@/components/upload/UploadZone";
import { ProcessingModal } from "@/components/upload/ProcessingModal";
import { compressDataUrl } from "@/lib/pdf";
import { buildDemoResult } from "@/lib/demo-data";
import { useAppStore } from "@/lib/store";

export function UploadPage() {
  const router = useRouter();
  const {
    questionPaper,
    answerSheet,
    setQuestionPaper,
    setAnswerSheet,
    setResult,
    setProgress,
    progress,
    setSelectedQuestionId,
  } = useAppStore();
  const [error, setError] = useState<string | null>(null);

  const ready = Boolean(questionPaper && answerSheet);
  const busy =
    progress.stage !== "idle" &&
    progress.stage !== "done" &&
    progress.stage !== "error";

  async function startMapping() {
    if (!questionPaper || !answerSheet) return;
    setError(null);
    setProgress({
      stage: "converting",
      message: "Compressing pages for AI analysis…",
      percent: 8,
    });

    try {
      const qp = await Promise.all(
        questionPaper.pages.map((p) => compressDataUrl(p))
      );
      const as = await Promise.all(
        answerSheet.pages.map((p) => compressDataUrl(p))
      );

      setProgress({
        stage: "extracting_questions",
        message: "Sending documents to Gemini…",
        percent: 20,
      });

      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionPaperPages: qp,
          answerSheetPages: as,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Processing failed");

      setProgress({
        stage: "done",
        message: "Assessment ready",
        percent: 100,
      });
      setResult(data.result);
      setSelectedQuestionId(data.result.mappings[0]?.questionId ?? null);

      // Persist for refresh
      try {
        sessionStorage.setItem(
          "veda_assessment",
          JSON.stringify(data.result)
        );
      } catch {
        /* ignore quota */
      }

      setTimeout(() => {
        setProgress({ stage: "idle", message: "", percent: 0 });
        router.push("/assessment");
      }, 400);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      setError(message);
      setProgress({ stage: "error", message, percent: 0 });
      setTimeout(
        () => setProgress({ stage: "idle", message: "", percent: 0 }),
        2500
      );
    }
  }

  async function loadDemo() {
    setProgress({
      stage: "extracting_questions",
      message: "Loading demo assessment…",
      percent: 40,
    });
    await new Promise((r) => setTimeout(r, 600));
    const result = buildDemoResult();
    setResult(result);
    setSelectedQuestionId(result.mappings[1]?.questionId ?? result.mappings[0]?.questionId);
    try {
      sessionStorage.setItem("veda_assessment", JSON.stringify(result));
    } catch {
      /* ignore */
    }
    setProgress({ stage: "done", message: "Demo ready", percent: 100 });
    setTimeout(() => {
      setProgress({ stage: "idle", message: "", percent: 0 });
      router.push("/assessment");
    }, 300);
  }

  async function loadSampleFiles() {
    setProgress({
      stage: "converting",
      message: "Loading sample papers…",
      percent: 10,
    });
    try {
      const [qpBlob, asBlob] = await Promise.all([
        fetch("/sample-question-paper.png").then((r) => r.blob()),
        fetch("/samplequestionans.png").then((r) => r.blob()),
      ]);
      const qpFile = new File([qpBlob], "sample-question-paper.png", {
        type: "image/png",
      });
      const asFile = new File([asBlob], "sample-answer-sheet.png", {
        type: "image/png",
      });

      const { fileToPages } = await import("@/lib/pdf");
      const [qp, as] = await Promise.all([
        fileToPages(qpFile),
        fileToPages(asFile),
      ]);
      setQuestionPaper(qp);
      setAnswerSheet(as);
      setProgress({ stage: "idle", message: "", percent: 0 });
    } catch {
      setProgress({
        stage: "error",
        message: "Failed to load sample files",
        percent: 0,
      });
      setTimeout(
        () => setProgress({ stage: "idle", message: "", percent: 0 }),
        1500
      );
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex flex-1 flex-col items-center overflow-auto px-6 py-10">
          <div className="animate-fade-up flex w-full max-w-3xl flex-col items-center text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Upload{" "}
              <span className="rounded-lg bg-accent px-2 py-0.5 text-white">
                Question Paper &amp; Answer Sheets
              </span>
            </h1>
            <p className="mt-3 text-sm text-muted sm:text-base">
              Upload both files to get started.
            </p>

            <div className="relative my-8">
              <div className="absolute inset-0 rounded-full bg-accent/20 blur-2xl" />
              <div className="relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-full bg-gradient-to-b from-orange-100 to-orange-50 ring-4 ring-white shadow-lg">
                <Image
                  src="/girl.svg"
                  alt="Teacher"
                  width={120}
                  height={120}
                  className="object-contain"
                  priority
                />
              </div>
              <span className="absolute -left-2 top-6 h-8 w-8 rounded-full bg-white shadow-md ring-1 ring-orange-100" />
              <span className="absolute -right-1 top-10 h-7 w-7 rounded-full bg-white shadow-md ring-1 ring-orange-100" />
              <span className="absolute bottom-2 -left-4 h-6 w-6 rounded-full bg-white shadow-md ring-1 ring-orange-100" />
            </div>

            <div className="flex w-full flex-col items-center justify-center gap-5 sm:flex-row">
              <UploadZone
                label="Upload Question Paper"
                file={questionPaper}
                onFile={setQuestionPaper}
              />
              <UploadZone
                label="Upload Answer Sheet"
                file={answerSheet}
                onFile={setAnswerSheet}
              />
            </div>

            <button
              type="button"
              disabled={!ready || busy}
              onClick={() => void startMapping()}
              className={`mt-8 inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-semibold transition ${
                ready && !busy
                  ? "bg-[#2a2a2a] text-white hover:bg-black"
                  : "cursor-not-allowed bg-zinc-200 text-zinc-400"
              }`}
            >
              Start Mapping
              <ArrowRight className="h-4 w-4" />
            </button>

            <p className="mt-3 max-w-md text-xs text-muted">
              Once both files are uploaded, you&apos;ll be able to map answers
              with questions.
            </p>

            {error && (
              <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => void loadSampleFiles()}
                className="rounded-full border border-border bg-white px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Load sample files
              </button>
              <button
                type="button"
                onClick={() => void loadDemo()}
                className="rounded-full border border-accent/40 bg-accent-soft px-4 py-2 text-xs font-medium text-accent-text hover:bg-orange-100"
              >
                View demo mapping (no API)
              </button>
            </div>
          </div>
        </main>
      </div>
      <ProcessingModal progress={progress} />
    </div>
  );
}
