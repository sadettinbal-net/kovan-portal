"use client";

import { useOnlineCount } from "@/contexts/OnlineContext";

export default function ActiveUsers() {
  const count = useOnlineCount();

  if (count === null) return null;

  return (
    <span className="flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
      <span>{count} kişi online</span>
    </span>
  );
}
