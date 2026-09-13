"use client";

import { useEffect, useState } from "react";
import { m, useReducedMotion } from "motion/react";

/**
 * Offsetting each cell by its distance from the middle row makes the lit front
 * read as a chevron travelling outward rather than a row blinking in step. The
 * cycle is deliberately shorter than a full sweep so two fronts overlap, which
 * is what stops it looking like a progress bar that never fills.
 */
const CHEVRON = Array.from({ length: 9 }, (_, i) => {
  const row = Math.floor(i / 3);
  const col = i % 3;
  return (col + Math.abs(row - 1)) * 90;
});

const CYCLE_MS = 650;

function LoaderGrid() {
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 grid-cols-[repeat(3,4px)] gap-[1.5px]"
    >
      {CHEVRON.map((delay, i) => (
        <span
          key={i}
          className="size-[4px] rounded-[1px] bg-ink-100 opacity-15"
          style={{
            animation: `pixel-on ${CYCLE_MS}ms ease-in-out ${delay}ms infinite`,
          }}
        />
      ))}
    </span>
  );
}

/** Counts its own ticks instead of reading a clock: the value only ever needs to
 *  advance by a tenth, never to match wall time. */
function useElapsed() {
  const [tenths, setTenths] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTenths((t) => t + 1), 100);
    return () => clearInterval(id);
  }, []);

  return `${(tenths / 10).toFixed(1)}s`;
}

export function Thinking() {
  const elapsed = useElapsed();

  return (
    <div role="status" className="flex w-fit items-center gap-2.5">
      <LoaderGrid />
      <span className="label-shimmer text-[13px] font-medium">Thinking</span>
      <span className="font-mono text-[12px] text-ink-400 tabular-nums">
        {elapsed}
      </span>
    </div>
  );
}

/**
 * These name work the page genuinely does (resolving a topic against its own
 * data), so they never imply a backend that isn't there.
 */
export function ToolChips({ tools }: { tools: string[] }) {
  const reduce = useReducedMotion();

  return (
    <ul className="flex flex-wrap gap-1.5">
      {tools.map((tool, i) => (
        <m.li
          key={tool}
          className="flex items-center gap-1.5 rounded-[3px] border border-ink-700 bg-ink-850 px-2 py-1 font-mono text-[10.5px] text-ink-300"
          initial={reduce ? false : { opacity: 0, y: 4, filter: "blur(3px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{
            duration: 0.35,
            delay: i * 0.12,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <span
            className="size-[5px] rounded-full bg-ink-400"
            aria-hidden="true"
          />
          {tool}
        </m.li>
      ))}
    </ul>
  );
}
