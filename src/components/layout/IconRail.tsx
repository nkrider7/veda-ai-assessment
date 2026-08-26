"use client";

import {
  Clock3,
  FileStack,
  Folder,
  Grid2x2,
  Home,
  Search,
  Upload,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function IconRail() {
  return (
    <aside className="flex h-full w-[64px] shrink-0 flex-col items-center gap-4 bg-[#1f1f1f] py-4 text-zinc-400">
      <Link href="/" className="mb-2">
        <Image
          src="/myvedaai_logo.jpeg"
          alt="VedaAI"
          width={28}
          height={28}
          className="rounded-md"
        />
      </Link>
      <RailIcon icon={Home} href="/" />
      <RailIcon icon={Upload} active />
      <RailIcon icon={Grid2x2} />
      <RailIcon icon={Search} />
      <RailIcon icon={FileStack} />
      <RailIcon icon={Folder} />
      <RailIcon icon={Clock3} />
      <div className="mt-auto flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-white">
        DPS
      </div>
    </aside>
  );
}

function RailIcon({
  icon: Icon,
  active,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
  href?: string;
}) {
  const className = `flex h-10 w-10 items-center justify-center rounded-xl transition ${
    active
      ? "bg-accent text-white"
      : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
  }`;

  if (href) {
    return (
      <Link href={href} className={className}>
        <Icon className="h-4 w-4" />
      </Link>
    );
  }

  return (
    <button type="button" className={className}>
      <Icon className="h-4 w-4" />
    </button>
  );
}
