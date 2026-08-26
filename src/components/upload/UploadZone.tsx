"use client";

import { useCallback, useRef, useState } from "react";
import { FileUp, X } from "lucide-react";
import { fileToPages, formatBytes, validateFile } from "@/lib/pdf";
import type { UploadedFileMeta } from "@/lib/types";

type UploadZoneProps = {
  label: string;
  file: UploadedFileMeta | null;
  onFile: (file: UploadedFileMeta | null) => void;
};

export function UploadZone({ label, file, onFile }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    async (f: File | null) => {
      if (!f) return;
      const validation = validateFile(f);
      if (validation) {
        setError(validation);
        return;
      }
      setError(null);
      setBusy(true);
      try {
        const meta = await fileToPages(f);
        onFile(meta);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to read file");
      } finally {
        setBusy(false);
      }
    },
    [onFile]
  );

  if (file) {
    return (
      <div className="relative flex h-[140px] w-full max-w-[280px] items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white px-4">
        <button
          type="button"
          onClick={() => onFile(null)}
          className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          aria-label="Remove file"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <div className="flex w-full items-center gap-3">
          <div className="flex h-12 w-10 shrink-0 items-center justify-center rounded-md bg-red-50 text-[10px] font-bold text-red-600 ring-1 ring-red-100">
            PDF
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {file.name.replace(/\.[^.]+$/, "")}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {formatBytes(file.size)} · {file.pageCount}{" "}
              {file.pageCount === 1 ? "Page" : "Pages"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files?.[0];
        void handleFile(f ?? null);
      }}
      className={`flex h-[140px] w-full max-w-[280px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed bg-white px-4 transition ${
        dragOver
          ? "border-accent bg-accent-soft"
          : "border-zinc-300 hover:border-zinc-400"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
      />
      {busy ? (
        <div className="animate-pulse-soft text-sm text-muted">Reading…</div>
      ) : (
        <>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-50 text-zinc-500">
            <FileUp className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="mt-1 text-xs text-muted">Max 10MB</p>
          {error && (
            <p className="mt-2 text-center text-xs text-red-500">{error}</p>
          )}
        </>
      )}
    </div>
  );
}
