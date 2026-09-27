import { requireStudio } from "@/lib/server/studio";
import { getDoc, mergeSite } from "@/lib/server/content";
import { editorContext } from "@/lib/server/studio-data";
import { DEFAULT_SITE } from "@shakshi/shared/cms/defaults";
import { SITE_GROUPS } from "@shakshi/shared/cms/site-fields";
import type { SiteConfig } from "@shakshi/shared/cms/types";
import { PageHead } from "@/components/studio/ui";
import { DocEditor } from "@/components/studio/DocEditor";

export const metadata = { title: "Site & theme" };

export default async function SitePage() {
  await requireStudio();
  const [d, ctx] = await Promise.all([getDoc<SiteConfig>("site", DEFAULT_SITE), editorContext()]);
  const initial = { draft: mergeSite(d.draft), published: d.published ? mergeSite(d.published) : null, updatedAt: d.updatedAt };
  return (
    <>
      <PageHead eyebrow="Content" title="Site & theme" intro="Everything shared across pages: brand, menus, footer, colours, fonts, features, search defaults, delivery rules and more." />
      <DocEditor groups={SITE_GROUPS} initial={initial as unknown as { draft: Record<string, unknown>; published: Record<string, unknown> | null; updatedAt?: string }} url="/api/admin/site" bodyKey="site" ctx={ctx} liveUrl={process.env.FRONTEND_URL ?? "http://localhost:3000"} />
    </>
  );
}
