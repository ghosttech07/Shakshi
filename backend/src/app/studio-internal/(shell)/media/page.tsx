import { requireStudio } from "@/lib/server/studio";
import { PageHead } from "@/components/studio/ui";
import { MediaLibrary } from "@/components/studio/MediaLibrary";

export const metadata = { title: "Photos & files" };

export default async function MediaPage() {
  await requireStudio();
  return (
    <>
      <PageHead eyebrow="Website" title="Photos & files" intro="Upload photos here to use anywhere on the website. A photo can't be deleted while the website still uses it." />
      <div className="card p-5 sm:p-6">
        <MediaLibrary />
      </div>
    </>
  );
}
