import { requireStudio } from "@/lib/server/studio";
import { getAccessories } from "@/lib/server/catalog";
import { editorContext } from "@/lib/server/studio-data";
import { PageHead } from "@/components/studio/ui";
import { AccessoriesEditor } from "@/components/studio/AccessoriesEditor";

export const metadata = { title: "Pillows & covers" };

export default async function PillowsCoversPage() {
  await requireStudio();
  const [items, ctx] = await Promise.all([getAccessories({ all: true }), editorContext()]);
  return (
    <>
      <PageHead
        eyebrow="Commerce"
        title="Pillows & covers"
        intro="Everything besides mattresses: the pillows and mattress covers listed in the Products menu, and bedding offered in the bag. Drag to reorder; the order here is the order on the site."
      />
      <AccessoriesEditor initial={items as unknown as Record<string, unknown>[]} ctx={ctx} frontend={process.env.FRONTEND_URL ?? "http://localhost:3000"} />
    </>
  );
}
