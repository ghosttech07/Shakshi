import { CmsPage, pageMetadata } from "@/components/cms/CmsPage";

// Content comes from the studio (Pages → real-bedrooms); rebuilt when it's published.
export const revalidate = 300;
export const generateMetadata = () => pageMetadata("real-bedrooms");

export default function RealBedroomsPage() {
  return <CmsPage slug="real-bedrooms" />;
}
