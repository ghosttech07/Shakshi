import { CmsPage, pageMetadata } from "@/components/cms/CmsPage";

// Pages created in the studio (and the policy pages) live at their own address.
export const revalidate = 300;
export const dynamicParams = true;
export const generateStaticParams = async () => [];

type Props = { params: Promise<{ slug: string[] }> };

export async function generateMetadata({ params }: Props) {
  return pageMetadata((await params).slug.map(decodeURIComponent).join("/"));
}

export default async function CustomPage({ params }: Props) {
  return <CmsPage slug={(await params).slug.map(decodeURIComponent).join("/")} />;
}
