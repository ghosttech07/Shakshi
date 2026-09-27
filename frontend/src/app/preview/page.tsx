import type { Metadata } from "next";
import { getArticles } from "@/lib/data";
import { PreviewClient } from "@/components/cms/PreviewClient";

// The studio's live preview. It renders only what the studio sends it (never stored drafts),
// and only accepts messages from the studio's own origin.
export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };

export default async function PreviewPage() {
  const origin = process.env.STUDIO_ORIGIN ?? new URL(process.env.API_URL ?? "http://localhost:4000").origin;
  return <PreviewClient origin={origin} articles={await getArticles()} />;
}
