import { CmsPage, pageMetadata } from "@/components/cms/CmsPage";

// Content comes from the studio (Pages → shop); rebuilt when it's published.
export const revalidate = 300;
export const generateMetadata = () => pageMetadata("shop");

export default function ShopPage() {
  return <CmsPage slug="shop" />;
}
