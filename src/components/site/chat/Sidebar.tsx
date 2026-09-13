"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import {
  GithubLogoIcon,
  NotePencilIcon,
  TwitterLogoIcon,
  XIcon,
} from "@phosphor-icons/react";
import { links, site, topics, type Topic } from "../../../data/site";

const EASE = [0.16, 1, 0.3, 1] as const;

type Props = {
  activeTopicId: string | null;
  onPick: (topic: Topic) => void;
  onReset: () => void;
  open: boolean;
  onClose: () => void;
};

function Panel({
  activeTopicId,
  onPick,
  onReset,
  onClose,
}: Omit<Props, "open">) {
  return (
    <div className="flex h-full w-[260px] flex-col border-r border-ink-800 bg-ink-900">
      <div className="flex items-center justify-between gap-2 px-3 py-3">
        <span className="flex min-w-0 items-center gap-2">
          <img
            src="/avatar.jpg"
            alt=""
            width={24}
            height={24}
            className="size-6 shrink-0 rounded-full"
          />
          <span className="truncate font-sans text-sm text-ink-200">
            {site.domain}
          </span>
        </span>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close sidebar"
          className="grid size-8 place-items-center rounded-lg text-ink-400 transition-colors duration-200 hover:bg-ink-800 hover:text-ink-100 lg:hidden"
        >
          <XIcon size={16} />
        </button>
      </div>

      <div className="px-2">
        <button
          type="button"
          onClick={onReset}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-ink-200 transition-colors duration-200 hover:bg-ink-800 active:translate-y-[1px]"
        >
          <NotePencilIcon size={16} className="shrink-0 text-ink-300" />
          New chat
        </button>
      </div>

      <nav className="mt-4 min-h-0 flex-1 overflow-y-auto px-2">
        <p className="px-2.5 pb-1.5 font-mono text-[10px] tracking-[0.18em] text-ink-400 uppercase">
          topics
        </p>
        <ul>
          {topics.map((topic) => {
            const active = topic.id === activeTopicId;
            return (
              <li key={topic.id}>
                <button
                  type="button"
                  onClick={() => onPick(topic)}
                  aria-current={active ? "true" : undefined}
                  className={`w-full truncate rounded-lg px-2.5 py-2 text-left text-sm transition-colors duration-200 ${
                    active
                      ? "bg-ink-800 text-ink-100"
                      : "text-ink-300 hover:bg-ink-850 hover:text-ink-100"
                  }`}
                >
                  {topic.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex items-center gap-1 border-t border-ink-800 px-3 py-2.5">
        {[
          { href: links.github, Icon: GithubLogoIcon, label: "GitHub" },
          { href: links.twitter, Icon: TwitterLogoIcon, label: "Twitter" },
        ].map(({ href, Icon, label }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={label}
            className="grid size-8 place-items-center rounded-lg text-ink-400 transition-colors duration-200 hover:bg-ink-800 hover:text-ink-100"
          >
            <Icon size={16} />
          </a>
        ))}
      </div>
    </div>
  );
}

export function Sidebar({ open, onClose, ...rest }: Props) {
  const reduce = useReducedMotion();
  const drawerRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const drawer = drawerRef.current;
    drawer?.querySelector<HTMLElement>("button")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !drawer) return;
      const items = drawer.querySelectorAll<HTMLElement>(
        "button, a[href]",
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      restoreRef.current?.focus();
      restoreRef.current = null;
    };
  }, [open, onClose]);

  return (
    <>
      <div className="hidden lg:block">
        <Panel {...rest} onClose={onClose} />
      </div>

      {/* Off-canvas below lg, where a 260px rail would eat most of the screen. */}
      <AnimatePresence>
        {open ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <m.button
              type="button"
              aria-label="Close sidebar"
              onClick={onClose}
              className="absolute inset-0 bg-ink-950/70"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.25 }}
            />
            <m.div
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Topics"
              className="absolute inset-y-0 left-0"
              initial={reduce ? false : { x: "-100%" }}
              animate={{ x: 0 }}
              exit={reduce ? undefined : { x: "-100%" }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <Panel {...rest} onClose={onClose} />
            </m.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
