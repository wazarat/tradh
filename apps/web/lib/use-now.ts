"use client";

import { useEffect, useState } from "react";

/** A ticking clock (ms) for countdowns and "updated n min ago" labels, without impure reads during render. */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
