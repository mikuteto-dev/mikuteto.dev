"use client";

import { m, useReducedMotion } from "motion/react";
import { ArrowUpRightIcon } from "@phosphor-icons/react";
import type { Work } from "../../data/site";

/**
 * A repository list is a list. The previous asymmetric grid varied span, type
 * scale and card height at once, so nothing shared a baseline or a left edge and
 * the result read as misaligned rather than composed. Asymmetry needs an
 * underlying grid to play against; with five items there isn't one to build.
 *
 * Every row is identical, so the eye can scan names down a single edge, and the
 * only thing that varies is the language mark, which is real information.
 */
export function WorkGrid({ works }: { works: Work[] }) {
  const reduce = useReducedMotion();

  return (
    <ul className="w-full">
      {works.map((work, i) => {
        const meta = work.stack + (work.updated ? ` · ${work.updated}` : "");

        return (
          <m.li
            key={work.name}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: i * 0.05,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <a
              href={work.href}
              target="_blank"
              rel="noreferrer noopener"
              className="group/row flex items-center gap-3.5 border-t border-ink-800 py-4 transition-colors duration-300 hover:border-ink-400 focus-visible:border-ink-100"
            >
              {work.icon ? (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-[18px] shrink-0 fill-ink-400 transition-colors duration-300 group-hover/row:fill-[var(--brand)]"
                  style={{ ["--brand" as string]: `#${work.icon.hex}` }}
                >
                  <path d={work.icon.path} />
                </svg>
              ) : (
                <span className="size-[18px] shrink-0" aria-hidden="true" />
              )}

              {/* The name is the content, so it never truncates. Below sm the
                  meta drops under it rather than competing for the same line. */}
              <span className="min-w-0 flex-1">
                <span className="block text-[17px] text-ink-100 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/row:translate-x-1">
                  {work.name}
                </span>
                <span className="mt-1 block font-mono text-[11px] tracking-[0.1em] text-ink-400 tabular-nums sm:hidden">
                  {meta}
                </span>
              </span>

              <span className="hidden shrink-0 font-mono text-[11px] tracking-[0.1em] text-ink-400 tabular-nums sm:block">
                {meta}
              </span>

              <ArrowUpRightIcon
                size={14}
                aria-hidden="true"
                className="shrink-0 text-ink-600 transition-colors duration-300 group-hover/row:text-ink-100"
              />
            </a>
          </m.li>
        );
      })}
    </ul>
  );
}
