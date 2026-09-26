import { CmsPage, pageMetadata } from "@/components/cms/CmsPage";

// Content comes from the studio (Pages → setup); rebuilt when it's published.
export const revalidate = 300;
export const generateMetadata = () => pageMetadata("setup");

export default function SetupPage() {
  return <CmsPage slug="setup" />;
}
