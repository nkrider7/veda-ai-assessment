"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import type { AnswerMapping, AssessmentResult } from "@/lib/types";

type AnswerSheetViewerProps = {
  result: AssessmentResult;
  selected: AnswerMapping | null;
};

export function AnswerSheetViewer({
  result,
  selected,
}: AnswerSheetViewerProps) {
  const pages = result.answerSheetPages;
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [natural, setNatural] = useState({ w: 1, h: 1 });

  const regionsOnPage = useMemo(() => {
    if (!selected) return [];
    return selected.regions.filter((r) => r.page === page);
  }, [selected, page]);

  // Jump to first page of selected answer
  useEffect(() => {
    if (selected?.regions?.[0]?.page) {
      setPage(selected.regions[0].page);
    }
  }, [selected?.questionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll highlight into view
  useEffect(() => {
    if (!regionsOnPage.length || !containerRef.current) return;
    const el = containerRef.current.querySelector("[data-highlight]");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selected?.questionId, page, regionsOnPage.length]);

  const total = pages.length;

  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold">Answer Sheet</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 rounded-full border border-border px-1 py-0.5 text-sm">
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-zinc-100"
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              aria-label="Zoom out"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[3.5rem] text-center text-xs font-medium">
              {zoom}%
            </span>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-zinc-100"
              onClick={() => setZoom((z) => Math.min(200, z + 10))}
              aria-label="Zoom in"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1 text-sm text-zinc-600">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-zinc-100 disabled:opacity-30"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-medium">
              Page {page} of {total}
            </span>
            <button
              type="button"
              disabled={page >= total}
              onClick={() => setPage((p) => Math.min(total, p + 1))}
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-zinc-100 disabled:opacity-30"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        className="min-h-0 flex-1 overflow-auto bg-zinc-100/80 p-4"
      >
        <div
          className="relative mx-auto origin-top"
          style={{
            width: `${zoom}%`,
            maxWidth: zoom <= 100 ? "720px" : undefined,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={pages[page - 1]}
            alt={`Answer sheet page ${page}`}
            className="w-full rounded-lg bg-white shadow-md"
            onLoad={(e) => {
              const img = e.currentTarget;
              setNatural({ w: img.naturalWidth, h: img.naturalHeight });
            }}
          />

          {regionsOnPage.map((region, idx) => {
            const [ymin, xmin, ymax, xmax] = region.box_2d;
            const top = (ymin / 1000) * 100;
            const left = (xmin / 1000) * 100;
            const height = ((ymax - ymin) / 1000) * 100;
            const width = ((xmax - xmin) / 1000) * 100;

            return (
              <div
                key={`${selected?.questionId}-${idx}`}
                data-highlight
                className="highlight-box pointer-events-none absolute"
                style={{
                  top: `${top}%`,
                  left: `${left}%`,
                  width: `${width}%`,
                  height: `${height}%`,
                }}
              >
                <span className="absolute -left-0.5 -top-6 rounded-md bg-emerald-500 px-2 py-0.5 text-[11px] font-bold text-white shadow">
                  Q{selected?.questionNumber}
                </span>
              </div>
            );
          })}

          {selected?.status === "unanswered" && (
            <div className="absolute inset-x-4 top-4 rounded-xl bg-orange-500/90 px-4 py-3 text-center text-sm font-medium text-white shadow-lg">
              No answer region found for Q{selected.questionNumber}
            </div>
          )}

          {/* keep natural dims referenced to avoid unused lint if needed */}
          <span className="sr-only">
            {natural.w}x{natural.h}
          </span>
        </div>
      </div>
    </section>
  );
}
