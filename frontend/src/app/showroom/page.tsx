import { CmsPage, pageMetadata } from "@/components/cms/CmsPage";

// Content comes from the studio (Pages → showroom); rebuilt when it's published.
export const revalidate = 300;
export const generateMetadata = () => pageMetadata("showroom");

export default function ShowroomPage() {
  return <CmsPage slug="showroom" />;
}
