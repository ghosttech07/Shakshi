import { notFound } from "next/navigation";
import { requireStudio } from "@/lib/server/studio";
import { getPageRow } from "@/lib/server/content";
import { editorContext } from "@/lib/server/studio-data";
import { PageEditor } from "@/components/studio/PageEditor";

export const metadata = { title: "Edit page" };

export default async function EditPage({ params }: { params: Promise<{ key: string }> }) {
  const base = await requireStudio();
  const key = decodeURIComponent((await params).key);
  const [row, ctx] = await Promise.all([getPageRow(key), editorContext()]);
  if (!row) notFound();
  return <PageEditor pageKey={key} initial={row} frontend={process.env.FRONTEND_URL ?? "http://localhost:3000"} base={base} ctx={ctx} />;
}
