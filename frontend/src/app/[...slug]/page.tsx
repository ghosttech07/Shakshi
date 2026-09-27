import { notFound } from "next/navigation";
import { CmsPage, pageMetadata } from "@/components/cms/CmsPage";
import { getPage } from "@/lib/data";

// Pages created in the studio (and the policy pages) live at their own address.
export const revalidate = 300;
export const dynamicParams = true;
export const generateStaticParams = async () => [];

type Props = { params: Promise<{ slug: string[] }> };

// Missing pages are answered here, before any of the page starts streaming.
export async function generateMetadata({ params }: Props) {
  const slug = (await params).slug.map(decodeURIComponent).join("/");
  if (!(await getPage(slug))) notFound();
  return pageMetadata(slug);
}

export default async function CustomPage({ params }: Props) {
  return <CmsPage slug={(await params).slug.map(decodeURIComponent).join("/")} />;
}
