"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useMemo, useState } from "react";
import type { AnswerMapping, AssessmentResult } from "@/lib/types";

type QuestionPanelProps = {
  result: AssessmentResult;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

function scoreClass(m: AnswerMapping) {
  if (m.status === "unanswered") return "score-bad";
  if (m.score === null) return "score-partial";
  if (m.score >= m.maxMarks) return "score-good";
  if (m.score === 0) return "score-bad";
  return "score-partial";
}

export function QuestionPanel({
  result,
  selectedId,
  onSelect,
}: QuestionPanelProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [expandAll, setExpandAll] = useState(false);

  const byId = useMemo(() => {
    const map = new Map(result.questions.map((q) => [q.id, q]));
    return map;
  }, [result.questions]);

  function toggleExpand(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleExpandAll() {
    const next = !expandAll;
    setExpandAll(next);
    const all: Record<string, boolean> = {};
    result.mappings.forEach((m) => {
      all[m.questionId] = next;
    });
    setExpanded(all);
  }

  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">
          Extracted Questions{" "}
          <span className="font-normal text-muted">(from question paper)</span>
        </h2>
        <button
          type="button"
          onClick={handleExpandAll}
          className="text-xs font-medium text-zinc-600 hover:text-foreground"
        >
          {expandAll ? "Collapse All" : "Expand All"}
        </button>
      </div>

      <div className="border-b border-border bg-zinc-50 px-5 py-3">
        <div className="flex flex-wrap gap-3 text-xs">
          <Stat
            label="Score"
            value={`${result.summary.totalScore}/${result.summary.maxScore}`}
          />
          <Stat label="Answered" value={String(result.summary.answered)} />
          <Stat label="Unanswered" value={String(result.summary.unanswered)} />
          {result.summary.unmatched > 0 && (
            <Stat label="Unmatched" value={String(result.summary.unmatched)} />
          )}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          {result.summary.overallFeedback}
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {result.mappings.map((m) => {
          const q = byId.get(m.questionId);
          if (!q) return null;
          const selected = selectedId === m.questionId;
          const isOpen = expanded[m.questionId];

          return (
            <article
              key={m.questionId}
              onClick={() => onSelect(m.questionId)}
              className={`cursor-pointer rounded-2xl border bg-white p-4 transition ${
                selected
                  ? "border-accent shadow-[0_0_0_1px_rgba(255,138,76,0.35)]"
                  : "border-border hover:border-zinc-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2a2a2a] text-xs font-semibold text-white">
                  {q.number}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug text-foreground">
                    {q.text}
                  </p>
                  {m.status === "unanswered" && (
                    <p className="mt-1 text-xs font-medium text-orange-600">
                      Unanswered
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${scoreClass(m)}`}
                  >
                    {m.score ?? 0}/{m.maxMarks}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => toggleExpand(m.questionId, e)}
                    className="text-zinc-400 hover:text-foreground"
                    aria-label="Toggle feedback"
                  >
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="mt-3 rounded-xl bg-accent-soft px-3 py-2.5 text-left">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-accent-text">
                    AI Feedback
                  </p>
                  <p className="text-sm leading-relaxed text-foreground/90">
                    {m.feedback || "No feedback available."}
                  </p>
                  {m.transcribedAnswer && (
                    <p className="mt-2 border-t border-orange-200/60 pt-2 text-xs text-zinc-600">
                      <span className="font-semibold">Extracted answer: </span>
                      {m.transcribedAnswer.slice(0, 280)}
                      {m.transcribedAnswer.length > 280 ? "…" : ""}
                    </p>
                  )}
                </div>
              )}
            </article>
          );
        })}

        {result.unmatchedAnswers.length > 0 && (
          <div className="rounded-2xl border border-dashed border-orange-300 bg-orange-50/50 p-4">
            <h3 className="text-sm font-semibold text-orange-800">
              Unmatched writing
            </h3>
            <p className="mt-1 text-xs text-orange-700">
              These regions could not be linked to any extracted question.
            </p>
            <ul className="mt-3 space-y-2">
              {result.unmatchedAnswers.map((u) => (
                <li
                  key={u.id}
                  className="rounded-xl bg-white px-3 py-2 text-xs text-zinc-700"
                >
                  {u.transcribedText.slice(0, 200)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 ring-1 ring-border">
      <span className="text-muted">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </span>
  );
}
