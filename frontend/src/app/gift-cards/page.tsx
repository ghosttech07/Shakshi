import { CmsPage, pageMetadata } from "@/components/cms/CmsPage";

// Content comes from the studio (Pages → gift-cards); rebuilt when it's published.
export const revalidate = 300;
export const generateMetadata = () => pageMetadata("gift-cards");

export default function GiftCardsPage() {
  return <CmsPage slug="gift-cards" />;
}
