"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Home,
  Users,
  ClipboardList,
  FileText,
  Library,
  Settings,
  Sparkles,
} from "lucide-react";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/", label: "My Classroom", icon: Users },
  { href: "/", label: "Assignments", icon: ClipboardList },
  { href: "/", label: "Exams", icon: FileText, activeKey: "exams" },
  { href: "/", label: "My Library", icon: Library },
];

export function Sidebar() {
  const pathname = usePathname();
  const isExams =
    pathname === "/" ||
    pathname.startsWith("/assessment") ||
    pathname.startsWith("/exams");

  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col border-r border-border bg-white px-4 py-5">
      <Link href="/" className="mb-6 flex items-center gap-2.5 px-1">
        <Image
          src="/myvedaai_logo.jpeg"
          alt="VedaAI"
          width={32}
          height={32}
          className="rounded-md"
        />
        <span className="text-lg font-semibold tracking-tight text-foreground">
          VedaAI
        </span>
      </Link>

      <button
        type="button"
        className="mb-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#2a2a2a] px-4 py-2.5 text-sm font-medium text-white shadow-[0_0_0_1px_rgba(255,138,76,0.35),0_0_18px_rgba(255,138,76,0.25)] transition hover:bg-black"
      >
        <Sparkles className="h-4 w-4 text-accent" />
        AI Teacher&apos;s Toolkit
      </button>

      <nav className="flex flex-1 flex-col gap-1">
        {nav.map((item) => {
          const active = item.activeKey === "exams" ? isExams : false;
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-zinc-100 font-semibold text-foreground"
                  : "font-medium text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>

        <div className="flex items-center gap-3 rounded-2xl bg-zinc-100 px-3 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xs font-bold text-zinc-700 shadow-sm">
            DPS
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-foreground">
              Delhi Public School
            </p>
            <p className="truncate text-[11px] text-muted">
              Bokaro Steel City
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
