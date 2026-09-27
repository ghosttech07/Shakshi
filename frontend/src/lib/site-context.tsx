"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_SITE } from "@shakshi/shared/cms/defaults";
import type { SiteConfig } from "@shakshi/shared/cms/types";
import { DEFAULT_QUIZ, type QuizConfig } from "@shakshi/shared/quiz";

const Ctx = createContext<SiteConfig>(DEFAULT_SITE);
const QuizCtx = createContext<QuizConfig>(DEFAULT_QUIZ);

/** Global, editable site content (brand, navigation, footer, contact, theme, commerce rules, popups) and the quiz. */
export function SiteProvider({ site, quiz, children }: { site: SiteConfig; quiz: QuizConfig; children: ReactNode }) {
  return (
    <Ctx.Provider value={site}>
      <QuizCtx.Provider value={quiz}>{children}</QuizCtx.Provider>
    </Ctx.Provider>
  );
}

export const useSite = () => useContext(Ctx);
export const useQuizConfig = () => useContext(QuizCtx);

/** Scheduled content (announcements, popups) is live between its optional start and end dates. */
export const isLive = (x: { start?: string; end?: string }, now = new Date()) => (!x.start || new Date(x.start) <= now) && (!x.end || new Date(x.end) >= now);
