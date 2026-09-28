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
        eyebrow="Catalogue"
        title="Pillows & covers"
        intro="The pillows and mattress covers on the website. Click an item to edit it, or add a new one at the bottom. Remember to press Save."
      />
      <AccessoriesEditor initial={items as unknown as Record<string, unknown>[]} ctx={ctx} frontend={process.env.FRONTEND_URL ?? "http://localhost:3000"} />
    </>
  );
}
