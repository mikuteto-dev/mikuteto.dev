"use client";

import { m, useReducedMotion } from "motion/react";
import type { SkillGroup } from "../../data/site";

/**
 * Sixteen brand palettes at once would overrun the page's locked neutral scheme,
 * so colour is held back until hover and becomes a response instead of noise.
 * A mark on its own also names nothing, hence the label for assistive tech and
 * the one that surfaces on hover.
 */
export function Skills({ groups }: { groups: SkillGroup[] }) {
  const reduce = useReducedMotion();

  return (
    <dl className="grid gap-0">
      {groups.map((group, i) => (
        <m.div
          key={group.label}
          className="grid grid-cols-1 gap-2 border-t border-ink-800 py-4 md:grid-cols-[10rem_1fr] md:gap-6"
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: i * 0.06,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <dt className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-400">
            {group.label}
          </dt>

          <dd className="m-0">
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-4">
              {group.items.map((icon) => (
                <li
                  key={icon.title}
                  className="group/mark relative [@media(hover:none)]:flex [@media(hover:none)]:flex-col [@media(hover:none)]:items-center [@media(hover:none)]:gap-1.5"
                >
                  <svg
                    role="img"
                    aria-label={icon.title}
                    viewBox="0 0 24 24"
                    className="size-[22px] fill-ink-300 transition-colors duration-300 ease-out group-hover/mark:fill-[var(--brand)]"
                    style={{ ["--brand" as string]: `#${icon.hex}` }}
                  >
                    <path d={icon.path} />
                  </svg>

                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute top-full left-1/2 z-20 mt-2 -translate-x-1/2 rounded-[3px] border border-ink-700 bg-ink-850 px-1.5 py-0.5 font-mono text-[10px] whitespace-nowrap text-ink-200 opacity-0 transition-opacity duration-200 group-hover/mark:opacity-100 [@media(hover:none)]:static [@media(hover:none)]:mt-0 [@media(hover:none)]:translate-x-0 [@media(hover:none)]:opacity-100"
                  >
                    {icon.title}
                  </span>
                </li>
              ))}
            </ul>
          </dd>
        </m.div>
      ))}
    </dl>
  );
}
