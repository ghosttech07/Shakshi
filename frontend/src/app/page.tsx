import { CmsPage, pageMetadata } from "@/components/cms/CmsPage";

// Content comes from the studio (Pages → Home); rebuilt when it's published.
export const revalidate = 300;
export const generateMetadata = () => pageMetadata("");

export default function HomePage() {
  return <CmsPage slug="" />;
}
