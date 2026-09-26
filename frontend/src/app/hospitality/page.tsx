import { CmsPage, pageMetadata } from "@/components/cms/CmsPage";

// Content comes from the studio (Pages → hospitality); rebuilt when it's published.
export const revalidate = 300;
export const generateMetadata = () => pageMetadata("hospitality");

export default function HospitalityPage() {
  return <CmsPage slug="hospitality" />;
}
