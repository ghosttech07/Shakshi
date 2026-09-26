import { CmsPage, pageMetadata } from "@/components/cms/CmsPage";

// Content comes from the studio (Pages → sleep-library); rebuilt when it's published.
export const revalidate = 300;
export const generateMetadata = () => pageMetadata("sleep-library");

export default function SleepLibraryPage() {
  return <CmsPage slug="sleep-library" />;
}
