import { CmsPage, pageMetadata } from "@/components/cms/CmsPage";

// Content comes from the studio (Pages → build-your-bed); rebuilt when it's published.
export const revalidate = 300;
export const generateMetadata = () => pageMetadata("build-your-bed");

export default function BuildYourBedPage() {
  return <CmsPage slug="build-your-bed" />;
}
