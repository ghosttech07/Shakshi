"use client";

import { emphasis } from "@shakshi/shared/cms/types";
import { motion, useScroll, useTransform } from "framer-motion";
import { useReducedMotion } from "@/lib/motion";
import { Fragment, useRef, type ReactNode } from "react";
import { EASE } from "@shakshi/shared/utils";

type RevealProps = {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article" | "span" | "p" | "h2" | "h3";
  /** Studio preview marker (see components/cms/text). */
  "data-cms-field"?: string;
};

/** The house fade-and-rise: slow, soft, once. */
export function Reveal({ children, delay = 0, y = 28, className, as = "div", "data-cms-field": field }: RevealProps) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      data-cms-field={field}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: reduce ? 0.4 : 1.1, delay, ease: EASE }}
    >
      {children}
    </Tag>
  );
}

/** Words drift in one after another. */
export function RevealText({ text, className, delay = 0, emClassName }: { text: string; className?: string; delay?: number; emClassName?: string }) {
  const reduce = useReducedMotion();
  // `*words*` are set in italics (see the studio's emphasis convention).
  const words = emphasis(text).flatMap((c) => c.text.split(" ").filter(Boolean).map((w) => ({ w, em: c.em })));
  return (
    <span className={className} aria-label={text.replace(/\*/g, "")}>
      {words.map(({ w, em }, i) => (
        <Fragment key={i}>
          <span aria-hidden className="inline-block overflow-hidden pb-[0.12em] align-bottom">
            <motion.span
              className="inline-block"
              initial={reduce ? { opacity: 0 } : { y: "105%", opacity: 0 }}
              whileInView={{ y: "0%", opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: reduce ? 0.3 : 1.1, delay: delay + i * 0.07, ease: EASE }}
            >
              {em ? <em className={emClassName}>{w}</em> : w}
            </motion.span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  );
}

/** Gentle vertical parallax for imagery. */
export function Parallax({ children, amount = 60, className }: { children: ReactNode; amount?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-amount, amount]);
  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }} className="absolute inset-[-12%_0]">
        {children}
      </motion.div>
    </div>
  );
}
