"use client";

import { m, useReducedMotion } from "motion/react";
import {
  ArrowRightIcon,
  AtIcon,
  SquaresFourIcon,
  StackIcon,
  type Icon,
} from "@phosphor-icons/react";
import { topics, type Topic } from "../../../data/site";
import { topicMeta } from "./topicMeta";

const ICONS: Record<string, Icon> = {
  works: SquaresFourIcon,
  skills: StackIcon,
  contact: AtIcon,
};

/**
 * Unmatched input used to answer with bare pills carrying the same words as the
 * sidebar: no indication of what any of them held, and a third control shape on
 * a page that already had rows. These are the same rows as the work list, so the
 * page speaks one idiom and each option states what is behind it.
 */
export function TopicChoices({ onSend }: { onSend: (text: string) => void }) {
  const reduce = useReducedMotion();

  return (
    <ul className="w-full max-w-xl">
      {topics.map((topic: Topic, i) => {
        const Mark = ICONS[topic.id];

        return (
          <m.li
            key={topic.id}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.45,
              delay: i * 0.05,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <button
              type="button"
              onClick={() => onSend(topic.label)}
              className="group/pick flex w-full items-center gap-3.5 border-t border-ink-800 py-3.5 text-left transition-colors duration-300 hover:border-ink-400 focus-visible:border-ink-100"
            >
              <Mark
                size={17}
                aria-hidden="true"
                className="shrink-0 text-ink-400 transition-colors duration-300 group-hover/pick:text-ink-100"
              />

              <span className="min-w-0 flex-1">
                <span className="block text-[15px] text-ink-100 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/pick:translate-x-1">
                  {topic.label}
                </span>
                <span className="mt-0.5 block font-mono text-[11px] tracking-[0.08em] text-ink-400">
                  {topicMeta(topic.id)}
                </span>
              </span>

              <ArrowRightIcon
                size={14}
                aria-hidden="true"
                className="shrink-0 text-ink-600 transition-all duration-300 group-hover/pick:translate-x-0.5 group-hover/pick:text-ink-100"
              />
            </button>
          </m.li>
        );
      })}
    </ul>
  );
}
