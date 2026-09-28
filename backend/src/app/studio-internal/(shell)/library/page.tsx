import Link from "next/link";
import { requireStudio } from "@/lib/server/studio";
import { getArticles } from "@/lib/server/catalog";
import { Badge, PageHead, TableWrap, when } from "@/components/studio/ui";
import { NewArticleForm } from "@/components/studio/NewArticleForm";

export const metadata = { title: "Sleep Library" };

export default async function LibraryPage() {
  const base = await requireStudio();
  const articles = await getArticles({ all: true });
  const now = new Date().toISOString();
  return (
    <>
      <PageHead eyebrow="Website" title="Sleep Library" intro="The articles on your Sleep Library page. Write a new one, or click one to edit it." actions={<NewArticleForm base={base} />} />
      <TableWrap>
        <table className="table min-w-[720px]">
          <thead>
            <tr>
              <th>Essay</th>
              <th>Category</th>
              <th>Author</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((a) => (
              <tr key={a.slug}>
                <td>
                  <Link href={`${base}/library/${a.slug}`} className="font-semibold text-gold-ink hover:underline">
                    {a.title}
                  </Link>
                  <span className="block text-xs text-stone">{a.readMins} min read</span>
                </td>
                <td className="text-stone">{a.category}</td>
                <td className="text-stone">{a.author}</td>
                <td className="whitespace-nowrap text-stone">{when(`${a.date}T12:00:00+05:30`, false)}</td>
                <td>{!a.published ? <Badge tone="warn">Draft</Badge> : a.publishAt && a.publishAt > now ? <Badge tone="gold">Scheduled {when(a.publishAt, false)}</Badge> : <Badge tone="ok">Live</Badge>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </>
  );
}
