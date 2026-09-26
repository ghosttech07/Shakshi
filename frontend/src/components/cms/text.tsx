import { emphasis } from "@shakshi/shared/cms/types";

/**
 * Helpers shared by every section renderer. No "use client": they work in server-rendered pages
 * and inside the studio's live preview alike.
 */

/** In the studio preview, marks an element with the field it shows, so a click can open that field. */
export type FieldFn = (path: string) => { "data-cms-field"?: string };
export const fieldFn = (edit?: boolean): FieldFn => (path) => (edit ? { "data-cms-field": path } : {});

/** Short text with `*accent*` words set in italics. */
export function Emph({ text, emClassName }: { text: string; emClassName?: string }) {
  return (
    <>
      {emphasis(text).map((c, i) =>
        c.em ? (
          <em key={i} className={emClassName}>
            {c.text}
          </em>
        ) : (
          <span key={i}>{c.text}</span>
        )
      )}
    </>
  );
}

export const plain = (text: unknown) => String(text ?? "").replace(/\*/g, "");

export const lines = (text: unknown) =>
  String(text ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

/** Typed accessors for loosely-typed section data. */
export const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
export const num = (v: unknown, fallback = 0) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
export const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

/** Unsplash sources in content are bare photo URLs; the image loader adds sizing. */
export const hasText = (v: unknown) => typeof v === "string" && v.trim().length > 0;
