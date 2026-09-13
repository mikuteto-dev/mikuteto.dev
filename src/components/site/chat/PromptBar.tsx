"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { ArrowUpIcon, CaretDownIcon, CheckIcon } from "@phosphor-icons/react";
import { topics } from "../../../data/site";
import { topicMeta } from "./topicMeta";

/**
 * 15px text at leading 1.6 makes a 24px line box, so the collapsed height is
 * exactly one line: any other value leaves the text top-aligned inside a taller
 * box and it stops agreeing with the controls beside it. The cap is four lines.
 */
const MIN_H = 24;
const MAX_H = 96;
/** Send button, and the gaps flanking the control cluster. */
const SEND_W = 28;
const GAPS = 16;

type Props = {
  busy: boolean;
  onSend: (text: string) => void;
  activeTopicId: string | null;
};

const POP = {
  initial: { opacity: 0, y: 6, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.16, ease: [0.16, 1, 0.3, 1] },
} as const;

/** Both popovers open upward off the composer and share everything but their
 *  anchor edge, so only that is passed in. */
function Menu({
  anchor,
  listbox,
  id,
  children,
}: {
  anchor: string;
  listbox?: boolean;
  id?: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <m.ul
      id={id}
      role={listbox ? "listbox" : undefined}
      className={`absolute bottom-full z-40 mb-2 overflow-hidden rounded-xl border border-ink-700 bg-ink-850 p-1 shadow-[0_16px_48px_rgba(0,0,0,0.5)] ${anchor}`}
      initial={reduce ? false : POP.initial}
      animate={POP.animate}
      exit={reduce ? undefined : POP.initial}
      transition={POP.transition}
    >
      {children}
    </m.ul>
  );
}

function MenuRow({
  primary,
  meta,
  mono,
  id,
  selected,
  highlighted,
  onClick,
}: {
  primary: string;
  meta: string;
  mono?: boolean;
  id?: string;
  selected?: boolean;
  highlighted?: boolean;
  onClick: () => void;
}) {
  return (
    <li
      id={id}
      role="option"
      aria-selected={selected ?? highlighted ?? false}
    >
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors duration-150 hover:bg-ink-800 ${highlighted ? "bg-ink-800" : ""}`}
      >
        <span className="min-w-0 flex-1">
          <span
            className={`block text-ink-100 ${mono ? "font-mono text-[13px]" : "text-[14px]"}`}
          >
            {primary}
          </span>
          <span className="mt-0.5 block font-mono text-[10.5px] text-ink-400">
            {meta}
          </span>
        </span>
        {selected ? (
          <CheckIcon
            size={13}
            weight="bold"
            className="mt-1 shrink-0 text-ink-100"
          />
        ) : null}
      </button>
    </li>
  );
}

export function PromptBar({ busy, onSend, activeTopicId }: Props) {
  const [draft, setDraft] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const hadFocus = useRef(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const pickerRef = useRef<HTMLButtonElement>(null);

  const slash = draft.startsWith("/");
  const matches = slash
    ? topics.filter((t) =>
        t.label.toLowerCase().startsWith(draft.slice(1).toLowerCase()),
      )
    : [];
  const slashOpen = slash && matches.length > 0;
  const active = topics.find((t) => t.id === activeTopicId) ?? null;

  /**
   * The input shares a line with the controls until the text would actually
   * reach them, then takes a row of its own. Measured against a mirror of the
   * draft rather than a character count, because the answer depends on the
   * rendered glyphs and on how wide the controls happen to be.
   */
  useLayoutEffect(() => {
    const input = inputRef.current;
    const controls = controlsRef.current;
    const measure = measureRef.current;
    const picker = pickerRef.current;
    if (!input || !controls || !measure || !picker) return;

    const reserved = SEND_W + picker.offsetWidth + GAPS;
    const inline = controls.clientWidth - reserved;
    const needsRow = draft.includes("\n") || measure.offsetWidth + 8 > inline;
    if (needsRow !== expanded) setExpanded(needsRow);

    input.style.height = "0px";
    const content = input.scrollHeight;
    const next = `${Math.min(Math.max(content, MIN_H), MAX_H)}px`;
    if (input.style.height !== next) input.style.height = next;
    const overflow = content > MAX_H ? "auto" : "hidden";
    if (input.style.overflowY !== overflow) input.style.overflowY = overflow;
  }, [draft, expanded]);

  useEffect(() => {
    if (!pickerOpen) return;
    const away = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node))
        setPickerOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [pickerOpen]);

  const submit = () => {
    const value = draft.trim();
    if (!value || busy) return;
    hadFocus.current = document.activeElement === inputRef.current;
    setDraft("");
    onSend(value);
  };

  const pick = (label: string) => {
    hadFocus.current = document.activeElement === inputRef.current;
    setDraft("");
    setPickerOpen(false);
    onSend(label);
  };

  useEffect(() => {
    if (busy || !hadFocus.current) return;
    hadFocus.current = false;
    inputRef.current?.focus();
  }, [busy]);

  const field = (
    <textarea
      ref={inputRef}
      rows={1}
      value={draft}
      disabled={busy}
      onChange={(e) => {
        setDraft(e.target.value);
        setHighlighted(0);
      }}
      onKeyDown={(e) => {
        if (slashOpen && e.key === "ArrowDown") {
          e.preventDefault();
          setHighlighted((h) => (h + 1) % matches.length);
          return;
        }
        if (slashOpen && e.key === "ArrowUp") {
          e.preventDefault();
          setHighlighted((h) => (h - 1 + matches.length) % matches.length);
          return;
        }
        if (e.key === "Escape") setPickerOpen(false);
        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
          e.preventDefault();
          if (slashOpen) pick(matches[Math.min(highlighted, matches.length - 1)].label);
          else submit();
        }
      }}
      placeholder="Ask anything, or / to jump"
      aria-label="Ask anything"
      role="combobox"
      aria-expanded={slashOpen}
      aria-controls="slash-menu"
      aria-autocomplete="list"
      aria-activedescendant={
        slashOpen ? `slash-opt-${matches[Math.min(highlighted, matches.length - 1)].id}` : undefined
      }
      // block, because an inline-block textarea sits on a text baseline and the
      // line box adds descender space under it, pushing the field off centre.
      className="field block w-full resize-none bg-transparent text-[15px] leading-[1.6] text-ink-100 outline-none placeholder:text-ink-400 disabled:opacity-50"
      style={{ height: MIN_H }}
    />
  );

  return (
    <div ref={rootRef} className="relative w-full">
      {/* Mirrors the draft off-screen purely to measure its rendered width. */}
      <span
        ref={measureRef}
        aria-hidden="true"
        className="pointer-events-none invisible absolute -top-96 left-0 whitespace-pre text-[15px]"
      >
        {draft || " "}
      </span>

      <AnimatePresence>
        {slashOpen ? (
          <Menu
            id="slash-menu"
            listbox
            anchor="left-0 w-[min(22rem,90vw)] origin-bottom-left"
          >
            {matches.map((topic, i) => (
              <MenuRow
                key={topic.id}
                id={`slash-opt-${topic.id}`}
                primary={`/${topic.label.toLowerCase()}`}
                meta={topicMeta(topic.id)}
                mono
                highlighted={i === highlighted}
                onClick={() => pick(topic.label)}
              />
            ))}
          </Menu>
        ) : null}
      </AnimatePresence>

      <div
        ref={controlsRef}
        className="rounded-[22px] border border-ink-700 bg-ink-850 px-3 py-2.5 transition-colors duration-200 focus-within:border-ink-400"
      >
        {expanded ? <div className="mb-2">{field}</div> : null}

        <div className="flex items-center gap-2">
          {expanded ? null : <div className="min-w-0 flex-1">{field}</div>}

          <div className="relative shrink-0">
            <button
              ref={pickerRef}
              type="button"
              disabled={busy}
              aria-haspopup="listbox"
              aria-expanded={pickerOpen}
              onClick={() => setPickerOpen((o) => !o)}
              className="flex items-center gap-1 rounded-full border border-ink-700 px-2.5 py-1 text-[12px] text-ink-300 transition-colors duration-200 hover:border-ink-400 hover:text-ink-100 disabled:opacity-40"
            >
              {active ? active.label : "Topics"}
              <CaretDownIcon
                size={11}
                weight="bold"
                aria-hidden="true"
                className={`transition-transform duration-200 ${pickerOpen ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {pickerOpen ? (
                <Menu
                  listbox
                  anchor="right-0 w-[min(20rem,80vw)] origin-bottom-right"
                >
                  {topics.map((topic) => (
                    <MenuRow
                      key={topic.id}
                      primary={topic.label}
                      meta={topicMeta(topic.id)}
                      selected={topic.id === activeTopicId}
                      onClick={() => pick(topic.label)}
                    />
                  ))}
                </Menu>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Once the field takes its own row the controls lose the stretch the
              field was providing, so the send button needs its own push to stay
              on the right edge where it sits in the collapsed state. */}
          {expanded ? <div className="flex-1" /> : null}

          <button
            type="button"
            onClick={() => submit()}
            disabled={draft.trim().length === 0 || busy}
            aria-label="Send"
            className="grid size-7 shrink-0 place-items-center rounded-full bg-ink-100 text-ink-950 transition-[opacity,transform] duration-200 hover:opacity-90 active:scale-[0.94] disabled:bg-ink-700 disabled:text-ink-400"
          >
            <ArrowUpIcon size={15} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
}
