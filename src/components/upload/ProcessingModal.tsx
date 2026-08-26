"use client";

import { Loader2 } from "lucide-react";
import type { ProcessProgress } from "@/lib/types";

const stages = [
  { key: "converting", label: "Preparing documents" },
  { key: "extracting_questions", label: "Extracting questions" },
  { key: "extracting_answers", label: "Mapping answer regions" },
  { key: "grading", label: "Grading & AI feedback" },
  { key: "done", label: "Done" },
];

export function ProcessingModal({ progress }: { progress: ProcessProgress }) {
  if (progress.stage === "idle") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md animate-fade-up rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-soft">
            <Loader2 className="h-5 w-5 animate-spin-slow text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Processing assessment</h3>
            <p className="text-sm text-muted">{progress.message}</p>
          </div>
        </div>

        <div className="mb-4 h-2 overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${progress.percent}%` }}
          />
        </div>

        <ul className="space-y-2">
          {stages.map((s) => {
            const order = stages.findIndex((x) => x.key === progress.stage);
            const idx = stages.findIndex((x) => x.key === s.key);
            const done = idx < order || progress.stage === "done";
            const active = s.key === progress.stage;
            return (
              <li
                key={s.key}
                className={`flex items-center gap-2 text-sm ${
                  active
                    ? "font-semibold text-foreground"
                    : done
                      ? "text-success"
                      : "text-zinc-400"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    active
                      ? "bg-accent animate-pulse-soft"
                      : done
                        ? "bg-success"
                        : "bg-zinc-200"
                  }`}
                />
                {s.label}
              </li>
            );
          })}
        </ul>

        {progress.stage === "error" && (
          <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
            {progress.message}
          </p>
        )}
      </div>
    </div>
  );
}
