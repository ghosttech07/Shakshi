"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Fragment, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { EASE, cn } from "@/lib/utils";
import { IconChat, IconClose, IconSend, IconSparkle, IconWhatsApp } from "@/components/ui/Icons";
import { CONTACT } from "@/lib/products";

type Msg = { role: "user" | "assistant"; content: string };

const STARTERS = ["Which mattress suits a side sleeper?", "I sleep hot. What do you recommend?", "How does the 100-night trial work?", "When could it be delivered?"];

const GREETING: Msg = {
  role: "assistant",
  content: "Good evening. I'm your Shakshi Sleep Concierge. Tell me how you like to sleep, and I'll guide you to something extraordinary.",
};

/** Renders the two bits of markdown the concierge uses: **bold** and [links](/path). */
function Rich({ text, onNavigate }: { text: string; onNavigate: () => void }) {
  const parts: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[(.+?)\]\((\/[^\s)]*|https?:\/\/[^\s)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1]) parts.push(<strong key={m.index} className="font-semibold text-pearl">{m[1]}</strong>);
    else if (m[3].startsWith("/"))
      parts.push(
        <Link key={m.index} href={m[3]} onClick={onNavigate} className="text-gold underline decoration-gold/40 underline-offset-4 hover:decoration-gold">
          {m[2]}
        </Link>
      );
    else
      parts.push(
        <a key={m.index} href={m[3]} target="_blank" rel="noopener noreferrer" className="text-gold underline underline-offset-4">
          {m[2]}
        </a>
      );
    last = m.index + m[0].length;
  }
  parts.push(text.slice(last));
  return <>{parts.map((p, i) => <Fragment key={i}>{p}</Fragment>)}</>;
}

export function Concierge() {
  const open = useStore((s) => s.conciergeOpen);
  const setOpen = useStore((s) => s.setConciergeOpen);
  const reduce = useReducedMotion();
  const pathname = usePathname();
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [messages, reduce]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 400);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        fabRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    const history = [...messages, { role: "user" as const, content }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The greeting is ours, not the guest's, so the conversation sent begins with them.
        body: JSON.stringify({ messages: history.slice(1) }),
      });
      if (!res.ok || !res.body) throw new Error(String(res.status));
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages([...history, { role: "assistant", content: acc }]);
      }
    } catch {
      setMessages([
        ...history,
        { role: "assistant", content: `Forgive me, I couldn't connect just now. Our concierges are always a call away on ${CONTACT.phone}, or on WhatsApp.` },
      ]);
    } finally {
      setBusy(false);
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  if (pathname.startsWith("/checkout")) return null;

  return (
    <>
      <motion.button
        ref={fabRef}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="concierge-panel"
        aria-label={open ? "Close Sleep Concierge" : "Open Sleep Concierge chat"}
        className="concierge-fab fixed border border-gold/25 bg-midnight/95 backdrop-blur-xl bottom-5 right-5 z-[70] flex h-14 items-center gap-3 rounded-full pl-4 pr-5 text-pearl shadow-lift transition-[bottom] duration-700 ease-silk sm:bottom-8 sm:right-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 1.2, ease: EASE }}
        whileHover={reduce ? undefined : { y: -3 }}
      >
        <span className="relative grid h-7 w-7 place-items-center rounded-full bg-gold text-midnight">
          {open ? <IconClose size={16} strokeWidth={1.5} /> : <IconChat size={16} strokeWidth={1.4} />}
          {!open && <span className="absolute inset-0 animate-ping rounded-full bg-gold/40 [animation-duration:3s]" aria-hidden />}
        </span>
        <span className="hidden text-[0.7rem] font-semibold uppercase tracking-[0.22em] sm:inline">Sleep Concierge</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.section
            id="concierge-panel"
            role="dialog"
            aria-label="Sleep Concierge"
            data-lenis-prevent
            className="fixed inset-x-3 bottom-24 border border-gold/20 bg-midnight/[0.97] backdrop-blur-xl linen-dark z-[70] flex max-h-[min(640px,calc(100dvh-8rem))] flex-col overflow-hidden rounded-2xl text-pearl shadow-lift sm:inset-x-auto sm:bottom-28 sm:right-8 sm:w-[400px]"
            initial={{ opacity: 0, y: reduce ? 0 : 30, scale: reduce ? 1 : 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduce ? 0 : 20, scale: reduce ? 1 : 0.98 }}
            transition={{ duration: 0.9, ease: EASE }}
            style={{ transformOrigin: "bottom right" }}
          >
            <header className="flex items-center gap-3 border-b border-gold/15 px-5 py-4">
              <span className="grid h-10 w-10 place-items-center rounded-full border border-gold/40 text-gold">
                <IconSparkle size={18} />
              </span>
              <div className="flex-1">
                <p className="font-serif text-xl leading-none">Sleep Concierge</p>
                <p className="mt-1 flex items-center gap-1.5 text-[0.7rem] text-pearl/55">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" /> At your service, day and night
                </p>
              </div>
              <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="Continue on WhatsApp" className="grid h-9 w-9 place-items-center rounded-full hover:bg-pearl/10">
                <IconWhatsApp size={18} />
              </a>
            </header>

            <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5" aria-live="polite">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: EASE }}
                  className={cn("max-w-[88%] text-[0.92rem] leading-relaxed", m.role === "user" ? "ml-auto rounded-2xl rounded-br-sm bg-gold/90 px-4 py-2.5 text-midnight" : "text-pearl/85")}
                >
                  {m.content ? (
                    m.role === "assistant" ? <Rich text={m.content} onNavigate={() => setOpen(false)} /> : m.content
                  ) : (
                    <span className="inline-flex gap-1.5 py-2" aria-label="Concierge is typing">
                      {[0, 1, 2].map((d) => (
                        <motion.span key={d} className="h-1.5 w-1.5 rounded-full bg-gold" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.4, repeat: Infinity, delay: d * 0.2 }} />
                      ))}
                    </span>
                  )}
                </motion.div>
              ))}
              {messages.length === 1 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {STARTERS.map((s) => (
                    <button key={s} onClick={() => send(s)} className="rounded-full border border-gold/30 px-3.5 py-2 text-left text-xs text-pearl/80 transition-colors duration-500 hover:border-gold hover:text-pearl">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={onSubmit} className="flex items-end gap-2 border-t border-gold/15 p-3">
              <label htmlFor="concierge-input" className="sr-only">Message the concierge</label>
              <textarea
                id="concierge-input"
                ref={inputRef}
                rows={1}
                value={input}
                maxLength={1500}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder="Ask about comfort, delivery, the trial…"
                className="max-h-32 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-pearl placeholder:text-pearl/40 focus:outline-none"
              />
              <button type="submit" disabled={busy || !input.trim()} aria-label="Send" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold text-midnight transition-opacity disabled:opacity-40">
                <IconSend size={16} strokeWidth={1.4} />
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
