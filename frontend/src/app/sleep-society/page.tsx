import { CmsPage, pageMetadata } from "@/components/cms/CmsPage";

// Content comes from the studio (Pages → sleep-society); rebuilt when it's published.
export const revalidate = 300;
export const generateMetadata = () => pageMetadata("sleep-society");

export default function SleepSocietyPage() {
  return <CmsPage slug="sleep-society" />;
}
