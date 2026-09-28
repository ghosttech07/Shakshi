import Link from "next/link";
import { requireStudio } from "@/lib/server/studio";
import { getSite, listPages } from "@/lib/server/content";
import { Badge, PageHead, TableWrap, when } from "@/components/studio/ui";
import { NewPageForm } from "@/components/studio/NewPageForm";

export const metadata = { title: "Pages" };

type P = Awaited<ReturnType<typeof listPages>>[number];

export default async function PagesList() {
  const base = await requireStudio();
  const [pages, site] = await Promise.all([listPages(), getSite("draft")]);

  // Pages reachable from the menus or footer come first, then policies, then anything not linked.
  const linked = new Set<string>([""]);
  for (const n of site.nav) {
    if (n.href) linked.add(n.href.replace(/^\//, "").split(/[?#]/)[0]);
    for (const c of n.children ?? []) linked.add(c.href.replace(/^\//, "").split(/[?#]/)[0]);
  }
  for (const col of site.footer.columns) for (const l of col.links) linked.add(l.href.replace(/^\//, "").split(/[?#]/)[0]);

  const groups: { title: string; note: string; rows: P[] }[] = [
    { title: "Main pages", note: "Linked from the menus.", rows: pages.filter((p) => linked.has(p.slug) && !p.slug.startsWith("policies/")) },
    { title: "Policies", note: "Linked from the footer.", rows: pages.filter((p) => p.slug.startsWith("policies/")) },
    { title: "Other pages", note: "These exist but no menu links to them, so visitors rarely find them.", rows: pages.filter((p) => !linked.has(p.slug) && !p.slug.startsWith("policies/")) },
  ].filter((g) => g.rows.length);

  return (
    <>
      <PageHead
        eyebrow="Website"
        title="Pages"
        intro="Click a page to change its words and pictures. You'll see a live preview, and nothing changes on the website until you press Publish."
        actions={<NewPageForm base={base} />}
      />
      <div className="space-y-8">
        {groups.map((g) => (
          <section key={g.title} aria-labelledby={`g-${g.title}`}>
            <h2 id={`g-${g.title}`} className="text-lg">
              {g.title}
            </h2>
            <p className="mb-3 text-sm text-stone">{g.note}</p>
            <TableWrap>
              <table className="table min-w-[560px]">
                <thead>
                  <tr>
                    <th>Page</th>
                    <th>Status</th>
                    <th>Last published</th>
                  </tr>
                </thead>
                <tbody>
                  {g.rows.map((p) => (
                    <tr key={p.key}>
                      <td>
                        <Link href={`${base}/pages/${encodeURIComponent(p.key)}`} className="font-semibold text-gold-ink hover:underline">
                          {p.title}
                        </Link>
                        <span className="block text-xs text-stone">shakshi.in/{p.slug}</span>
                      </td>
                      <td>{!p.published ? <Badge tone="warn">Not published yet</Badge> : p.changed ? <Badge tone="gold">Changes not published</Badge> : <Badge tone="ok">Live</Badge>}</td>
                      <td className="text-stone">{p.publishedAt ? when(p.publishedAt) : "Original version"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </section>
        ))}
      </div>
    </>
  );
}
