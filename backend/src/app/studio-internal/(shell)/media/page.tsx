import { requireStudio } from "@/lib/server/studio";
import { PageHead } from "@/components/studio/ui";
import { MediaLibrary } from "@/components/studio/MediaLibrary";

export const metadata = { title: "Media" };

export default async function MediaPage() {
  await requireStudio();
  return (
    <>
      <PageHead eyebrow="Content" title="Media" intro="Images, videos, 3D models and files for the site. A file can't be deleted while a page, product or essay still uses it." />
      <div className="card p-5 sm:p-6">
        <MediaLibrary />
      </div>
    </>
  );
}
