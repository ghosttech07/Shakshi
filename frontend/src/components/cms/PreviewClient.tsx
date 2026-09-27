"use client";

import { useEffect, useState } from "react";
import type { Article } from "@shakshi/shared/articles";
import type { PageDoc } from "@shakshi/shared/cms/types";
import { RenderSections } from "./RenderSections";

type Incoming = { type: "shakshi:preview"; page: PageDoc } | { type: "shakshi:focus"; sectionId: string; field?: string };

export function PreviewClient({ origin, articles }: { origin: string; articles: Article[] }) {
  const [page, setPage] = useState<PageDoc | null>(null);

  useEffect(() => {
    if (window.parent === window) return;
    const onMessage = (e: MessageEvent<Incoming>) => {
      if (e.origin !== origin || !e.data || typeof e.data !== "object") return;
      if (e.data.type === "shakshi:preview") setPage(e.data.page);
      if (e.data.type === "shakshi:focus") {
        const sel = `[data-cms-section="${CSS.escape(e.data.sectionId)}"]`;
        const el = (e.data.field && document.querySelector(`${sel} [data-cms-field="${CSS.escape(e.data.field)}"]`)) || document.querySelector(sel);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        el?.classList.add("cms-flash");
        setTimeout(() => el?.classList.remove("cms-flash"), 1200);
      }
    };
    addEventListener("message", onMessage);
    window.parent.postMessage({ type: "shakshi:preview-ready" }, origin);

    // Click to edit: tell the studio which section (and field) was clicked, instead of following links.
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const section = target.closest<HTMLElement>("[data-cms-section]");
      if (!section) return;
      e.preventDefault();
      e.stopPropagation();
      const field = target.closest<HTMLElement>("[data-cms-field]");
      window.parent.postMessage({ type: "shakshi:select", sectionId: section.dataset.cmsSection, field: field && section.contains(field) ? field.dataset.cmsField : undefined }, origin);
    };
    document.addEventListener("click", onClick, true);
    return () => {
      removeEventListener("message", onMessage);
      document.removeEventListener("click", onClick, true);
    };
  }, [origin]);

  if (!page) {
    return (
      <div className="grid min-h-[70vh] place-items-center pt-24 text-center">
        <p className="eyebrow text-stone">Open this page from the studio to see a live preview.</p>
      </div>
    );
  }
  return (
    <div className="cms-preview">
      <RenderSections key={page.slug} sections={page.sections} ctx={{ articles }} edit />
    </div>
  );
}
