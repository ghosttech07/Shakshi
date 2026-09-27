import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStudio } from "@/lib/server/studio";
import { getArticles } from "@/lib/server/catalog";
import { editorContext } from "@/lib/server/studio-data";
import { blocksToHtml } from "@shakshi/shared/articles";
import { PageHead } from "@/components/studio/ui";
import { ArticleEditor } from "@/components/studio/ArticleEditor";

export const metadata = { title: "Edit essay" };

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const base = await requireStudio();
  const slug = decodeURIComponent((await params).slug);
  const [articles, ctx] = await Promise.all([getArticles({ all: true }), editorContext()]);
  const a = articles.find((x) => x.slug === slug);
  if (!a) notFound();
  // Essays written before the studio start from their original text.
  const article = { ...a, html: a.html ?? blocksToHtml(a.body), related: a.related ?? [] };
  return (
    <>
      <p className="mb-3 text-sm">
        <Link href={`${base}/library`} className="text-stone hover:text-ink">
          ← Sleep Library
        </Link>
      </p>
      <PageHead eyebrow={`/sleep-library/${slug}`} title={a.title} />
      <ArticleEditor article={article} ctx={ctx} base={base} frontend={process.env.FRONTEND_URL ?? "http://localhost:3000"} />
    </>
  );
}
