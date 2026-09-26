import { CmsPage, pageMetadata } from "@/components/cms/CmsPage";

// Content comes from the studio (Pages → about); rebuilt when it's published.
export const revalidate = 300;
export const generateMetadata = () => pageMetadata("about");

export default function AboutPage() {
  return <CmsPage slug="about" />;
}
