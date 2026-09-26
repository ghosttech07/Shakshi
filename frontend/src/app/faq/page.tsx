import { CmsPage, pageMetadata } from "@/components/cms/CmsPage";

// Content comes from the studio (Pages → faq); rebuilt when it's published.
export const revalidate = 300;
export const generateMetadata = () => pageMetadata("faq");

export default function FaqPage() {
  return <CmsPage slug="faq" />;
}
