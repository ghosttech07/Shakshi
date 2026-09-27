import Link from "next/link";
import { requireStudio } from "@/lib/server/studio";
import { listPages } from "@/lib/server/content";
import { Badge, PageHead, TableWrap, when } from "@/components/studio/ui";
import { NewPageForm } from "@/components/studio/NewPageForm";

export const metadata = { title: "Pages" };

export default async function PagesList() {
  const base = await requireStudio();
  const pages = (await listPages()).sort((a, b) => Number(b.system) - Number(a.system) || a.slug.localeCompare(b.slug));
  return (
    <>
      <PageHead eyebrow="Content" title="Pages" intro="Every page is a stack of sections. Edit words and images, reorder or add sections, and preview on any screen size before publishing." actions={<NewPageForm base={base} />} />
      <TableWrap>
        <table className="table min-w-[640px]">
          <thead>
            <tr>
              <th>Page</th>
              <th>Address</th>
              <th>Status</th>
              <th>Last published</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr key={p.key}>
                <td>
                  <Link href={`${base}/pages/${encodeURIComponent(p.key)}`} className="font-semibold text-gold-ink hover:underline">
                    {p.title}
                  </Link>
                  {!p.system && <span className="ml-2 text-xs text-stone">custom</span>}
                </td>
                <td className="font-mono text-xs text-stone">/{p.slug}</td>
                <td>{!p.published ? <Badge tone="warn">Draft only</Badge> : p.changed ? <Badge tone="gold">Unpublished changes</Badge> : <Badge tone="ok">Live</Badge>}</td>
                <td className="text-stone">{p.publishedAt ? when(p.publishedAt) : p.system ? "Original content" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </>
  );
}
