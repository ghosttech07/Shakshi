import { CmsPage, pageMetadata } from "@/components/cms/CmsPage";

// Content comes from the studio (Pages → quiz); rebuilt when it's published.
export const revalidate = 300;
export const generateMetadata = () => pageMetadata("quiz");

export default function QuizPage() {
  return <CmsPage slug="quiz" />;
}
