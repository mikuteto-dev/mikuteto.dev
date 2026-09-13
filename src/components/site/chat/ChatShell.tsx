"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  AnimatePresence,
  LazyMotion,
  domAnimation,
  m,
  useReducedMotion,
} from "motion/react";
import { SidebarSimpleIcon } from "@phosphor-icons/react";
import { DisplacedIdentity } from "./DisplacedIdentity";
import { WorkGrid } from "../WorkGrid";
import { Contact } from "../Contact";
import { Skills } from "../Skills";
import { useStreamingText } from "../../interior/streaming-text";
import { PromptBar } from "./PromptBar";
import { Sidebar } from "./Sidebar";
import { TopicChoices } from "./TopicChoices";
import { Thinking, ToolChips } from "./Thinking";
import {
  fallback,
  links,
  site,
  skills,
  topics,
  works,
  type Answer,
  type Topic,
} from "../../../data/site";

type Message =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; answer: Answer };

const EASE = [0.16, 1, 0.3, 1] as const;

/** Long enough for the pending state to register as a beat rather than a flash. */
const THINK_MS = 1300;

const PIN_PX = 64;
const ASCII_WORD = /[a-z0-9]/i;

function match(input: string): Topic | null {
  const q = input.toLowerCase();
  const hit = (k: string) => {
    const key = k.toLowerCase();
    if (!ASCII_WORD.test(key)) return q.includes(key);
    return new RegExp(
      `\\b${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
    ).test(q);
  };
  return topics.find((t) => t.match.some(hit)) ?? null;
}

/**
 * Owns the pending delay itself so it is measured from the moment the loader is
 * on screen. Timing it from the send instead let the idle view's exit eat most
 * of the wait, and the loader flashed for a fraction of its duration.
 */
function PendingRow({ onSettled }: { onSettled: () => void }) {
  const reduce = useReducedMotion();

  useEffect(() => {
    const id = setTimeout(onSettled, reduce ? 0 : THINK_MS);
    return () => clearTimeout(id);
  }, [onSettled, reduce]);

  return (
    <li className="flex gap-4">
      <span className="size-7 shrink-0" aria-hidden="true" />
      <Thinking />
    </li>
  );
}

function AssistantMessage({
  answer,
  onSend,
}: {
  answer: Answer;
  onSend: (text: string) => void;
}) {
  const reduce = useReducedMotion();
  const full = answer.lines.join("\n");
  // Streams by word rather than by character, so a word never half-appears and
  // pushes the line to rewrap while it is being read.
  const { visible: shown, status } = useStreamingText({ text: full });
  const done = status === "done";

  return (
    <div className="flex gap-4">
      <img
        src="/avatar.jpg"
        alt=""
        width={28}
        height={28}
        className="mt-0.5 size-7 shrink-0 rounded-full"
      />

      <div className="min-w-0 flex-1 space-y-4">
        {answer.tools?.length ? <ToolChips tools={answer.tools} /> : null}

        {answer.lines.length > 0 ? (
          <div className="space-y-1.5 text-[15px] leading-[1.85] text-ink-100">
            {shown.split("\n").map((line, i) => (
              <p key={i}>
                {line}
                {!done && i === shown.split("\n").length - 1 ? (
                  <span className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.16em] bg-ink-300 align-baseline motion-safe:animate-pulse" />
                ) : null}
              </p>
            ))}
          </div>
        ) : null}

        <AnimatePresence>
          {done && answer.block ? (
            <m.div
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: EASE }}
              className="pt-1"
            >
              {answer.block === "works" ? <WorkGrid works={works} /> : null}
              {answer.block === "skills" ? <Skills groups={skills} /> : null}
              {answer.block === "contact" ? (
                <div className="max-w-xl">
                  <Contact
                    github={links.github}
                    twitter={links.twitter}
                    discord={links.discord}
                  />
                </div>
              ) : null}
              {answer.block === "topics" ? (
                <TopicChoices onSend={onSend} />
              ) : null}
            </m.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function ChatShell() {
  const reduce = useReducedMotion();
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState<{ id: string; answer: Answer } | null>(
    null,
  );
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);

  const started = messages.length > 0;
  const busy = pending !== null;

  useLayoutEffect(() => {
    if (!started) return;
    pinned.current = true;
    endRef.current?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "end",
    });
  }, [messages, pending, started, reduce]);

  useEffect(() => {
    if (!started) return;
    const scroller = scrollRef.current;
    const list = scroller?.querySelector("ol");
    if (!scroller || !list) return;

    const onScroll = () => {
      pinned.current =
        scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight <
        PIN_PX;
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(() => {
      if (pinned.current) scroller.scrollTop = scroller.scrollHeight;
    });
    ro.observe(list);

    return () => {
      scroller.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [started]);

  const send = (text: string) => {
    if (busy) return;
    const topic = match(text);
    const answer = topic ? topic.answer : fallback;
    const id = `${messages.length}-${text.length}`;

    setActiveTopicId(topic?.id ?? null);
    setMessages((prev) => [...prev, { id: `u-${id}`, role: "user", text }]);
    setPending({ id, answer });
  };

  const settle = useCallback(() => {
    setPending((current) => {
      if (!current) return null;
      setMessages((prev) => [
        ...prev,
        { id: `a-${current.id}`, role: "assistant", answer: current.answer },
      ]);
      return null;
    });
  }, []);

  const reset = () => {
    setMessages([]);
    setPending(null);
    setActiveTopicId(null);
    setNavOpen(false);
  };

  const closeNav = useCallback(() => setNavOpen(false), []);

  return (
    /* domAnimation covers everything used here: enter/exit, variants and tap.
       The default `motion` export also drags in drag, pan and layout projection,
       which nothing on this page asks for. `strict` turns a missed `motion.*`
       into a build-time error instead of a silent return to the full bundle. */
    <LazyMotion features={domAnimation} strict>
      <div className="flex h-[100dvh] overflow-hidden">
        <Sidebar
          activeTopicId={activeTopicId}
          onPick={(topic) => {
            setNavOpen(false);
            send(topic.label);
          }}
          onReset={reset}
          open={navOpen}
          onClose={closeNav}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Present at every width: without it the desktop pane had no top edge
            at all, which is a large part of why the screen read as unfinished. */}
          <header className="relative z-40 flex h-12 shrink-0 items-center gap-1 border-b border-ink-800 px-2">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              aria-label="Open sidebar"
              className="grid size-9 shrink-0 place-items-center rounded-lg text-ink-300 transition-colors duration-200 hover:bg-ink-800 hover:text-ink-100 lg:hidden"
            >
              <SidebarSimpleIcon size={18} />
            </button>

            <span className="truncate px-1 text-sm text-ink-200 lg:hidden">
              {site.domain}
            </span>
          </header>

          <AnimatePresence mode="wait" initial={false}>
            {started ? (
              <m.div
                key="chat"
                className="flex min-h-0 flex-1 flex-col"
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, ease: EASE }}
              >
                <div
                  ref={scrollRef}
                  className="min-h-0 flex-1 overflow-y-auto"
                >
                  <ol className="mx-auto w-full max-w-[768px] space-y-9 px-4 py-8 md:px-6">
                    {messages.map((message) => (
                      <li key={message.id}>
                        {message.role === "user" ? (
                          <m.div
                            className="flex justify-end"
                            initial={reduce ? false : { opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, ease: EASE }}
                          >
                            <p className="max-w-[80%] rounded-[20px] bg-ink-800 px-4 py-2.5 text-[15px] leading-[1.7] text-ink-100">
                              {message.text}
                            </p>
                          </m.div>
                        ) : (
                          <AssistantMessage
                            answer={message.answer}
                            onSend={send}
                          />
                        )}
                      </li>
                    ))}

                    {pending ? <PendingRow onSettled={settle} /> : null}
                  </ol>
                  <div ref={endRef} />
                </div>
              </m.div>
            ) : (
              <m.div
                key="idle"
                className="relative min-h-0 flex-1"
                exit={reduce ? undefined : { opacity: 0 }}
                transition={{ duration: 0.35, ease: EASE }}
              >
                <div className="relative flex h-full w-full flex-col">
                  <div
                    aria-hidden="true"
                    className="home-glow pointer-events-none absolute inset-0"
                  />

                  {/* Only the identity is displaced. Wrapping the composer too fed
                    it through the html-in-canvas capture, so on a browser with the
                    flag the home input sheared under the cursor while the same bar
                    in the conversation stayed crisp.

                    Height comes from being a flex child, not from the children:
                    in native mode Displacement moves them inside the canvas and
                    paints absolutely, so its own box measures zero. */}
                  <DisplacedIdentity className="relative min-h-0 w-full flex-1">
                    <m.div
                      className="flex h-full w-full flex-col items-center justify-center gap-6 px-4 md:px-8"
                      initial={reduce ? false : { opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, ease: EASE }}
                    >
                      {/* Sized to carry the screen. At 56px it read as a favicon
                        stranded in the middle of a desktop viewport. */}
                      <img
                        src="/avatar.jpg"
                        alt=""
                        width={96}
                        height={96}
                        className="size-20 rounded-full ring-1 ring-ink-700 md:size-24"
                      />
                      <h1 className="text-center text-[2.25rem] leading-none font-medium tracking-[-0.045em] text-ink-100 md:text-[3rem]">
                        {site.handle}
                      </h1>
                    </m.div>
                  </DisplacedIdentity>
                </div>
              </m.div>
            )}
          </AnimatePresence>

          {/* One composer for both views: keeping it outside the swap preserves
            textarea focus across the idle → chat transition. */}
          <m.div
            className="relative shrink-0 px-4 pb-4 md:px-6"
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease: EASE }}
          >
            <div className="mx-auto w-full max-w-[768px]">
              <PromptBar
                busy={busy}
                onSend={send}
                activeTopicId={activeTopicId}
              />
            </div>
          </m.div>
        </div>
      </div>
    </LazyMotion>
  );
}
