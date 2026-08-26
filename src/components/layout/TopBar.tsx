"use client";

import {
  ArrowLeft,
  Bell,
  ChevronDown,
  CircleHelp,
  FolderOpen,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";

type TopBarProps = {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
};

export function TopBar({
  title = "Exams",
  showBack = true,
  onBack,
}: TopBarProps) {
  const router = useRouter();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-white px-5">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            type="button"
            onClick={() => (onBack ? onBack() : router.back())}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-zinc-600 hover:bg-zinc-50"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <FolderOpen className="h-4 w-4 text-zinc-500" />
          {title}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <IconButton label="Help">
          <CircleHelp className="h-4 w-4" />
        </IconButton>
        <IconButton label="Notifications">
          <span className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent" />
          </span>
        </IconButton>
        <IconButton label="AI">
          <Sparkles className="h-4 w-4" />
        </IconButton>

        <button
          type="button"
          className="ml-1 flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-2.5 hover:bg-zinc-50"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-orange-300 to-rose-400 text-[11px] font-bold text-white">
            MR
          </span>
          <span className="hidden text-sm font-medium sm:inline">
            Madhur Rastogi
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
        </button>
      </div>
    </header>
  );
}

function IconButton({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100"
    >
      {children}
    </button>
  );
}
