import { CmsPage, pageMetadata } from "@/components/cms/CmsPage";

// Content comes from the studio (Pages → sleep-studio); rebuilt when it's published.
export const revalidate = 300;
export const generateMetadata = () => pageMetadata("sleep-studio");

export default function SleepStudioPage() {
  return <CmsPage slug="sleep-studio" />;
}
