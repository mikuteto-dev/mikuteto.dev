"use client";

import { AnimatePresence, m, useReducedMotion } from "motion/react";
import {
  GithubLogoIcon,
  TwitterLogoIcon,
  DiscordLogoIcon,
  CheckIcon,
  CopyIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import { useCopyToClipboard } from "../interior/copy-button";

const ICON = { size: 18 } as const;

const row =
  "group flex items-center gap-3 border-t border-ink-700 py-5 text-left transition-colors duration-300 ease-out hover:border-ink-300 focus-visible:border-ink-100";
const label =
  "font-sans text-lg text-ink-200 transition-colors duration-300 group-hover:text-ink-100 md:text-xl";

type Props = {
  github: string;
  twitter: string;
  discord: string;
};

/**
 * A Discord handle you cannot click is a dead end, so the row exists to hand the
 * name over. The clipboard hook is interior's: it falls back to execCommand where
 * navigator.clipboard is unavailable, restores whatever the visitor had selected,
 * and reports failure rather than silently doing nothing.
 */
function DiscordRow({ username }: { username: string }) {
  const reduce = useReducedMotion();
  const { copy, status } = useCopyToClipboard({ timeout: 1800 });

  return (
    <button
      type="button"
      onClick={() => copy(username)}
      aria-label={`Copy Discord handle ${username}`}
      className={`${row} w-full justify-between active:translate-y-[1px]`}
    >
      <span className="flex items-center gap-3">
        <DiscordLogoIcon
          {...ICON}
          className="text-ink-400 transition-colors duration-300 group-hover:text-ink-100"
        />
        <span className={label}>{username}</span>
      </span>

      {/* Fixed width: the label swaps between three states, and letting the row
          resize under the cursor is the jump this whole set exists to avoid. */}
      <span className="relative flex h-5 w-24 items-center justify-end">
        <AnimatePresence initial={false} mode="wait">
          <m.span
            key={status}
            className={`flex items-center gap-1.5 font-mono text-[10.5px] tracking-[0.18em] uppercase ${
              status === "idle"
                ? "text-ink-400 transition-colors duration-300 group-hover:text-ink-100"
                : "text-ink-100"
            }`}
            initial={reduce ? false : { opacity: 0, y: 4, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={
              reduce ? undefined : { opacity: 0, y: -4, filter: "blur(3px)" }
            }
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {status === "copied" ? (
              <CheckIcon size={13} weight="bold" />
            ) : status === "error" ? (
              <WarningIcon size={13} weight="bold" />
            ) : (
              <CopyIcon size={13} />
            )}
            {status === "copied"
              ? "copied"
              : status === "error"
                ? "failed"
                : "copy"}
          </m.span>
        </AnimatePresence>
      </span>
      <span aria-live="polite" className="sr-only">
        {status === "copied"
          ? "Copied"
          : status === "error"
            ? "Copy failed"
            : ""}
      </span>
    </button>
  );
}

export function Contact({ github, twitter, discord }: Props) {
  return (
    <div className="grid gap-0">
      <a
        href={github}
        target="_blank"
        rel="noreferrer noopener"
        className={row}
      >
        <GithubLogoIcon
          {...ICON}
          className="text-ink-400 transition-colors duration-300 group-hover:text-ink-100"
        />
        <span className={label}>{github.replace(/^https?:\/\//, "")}</span>
      </a>

      <a
        href={twitter}
        target="_blank"
        rel="noreferrer noopener"
        className={row}
      >
        <TwitterLogoIcon
          {...ICON}
          className="text-ink-400 transition-colors duration-300 group-hover:text-ink-100"
        />
        <span className={label}>{twitter.replace(/^https?:\/\//, "")}</span>
      </a>

      <DiscordRow username={discord} />
    </div>
  );
}
