import type { Metadata } from "next";
import { Thread } from "@/components/about/Thread";

export const metadata: Metadata = {
  title: "Our Story · The Thread",
  description: "The Shakshi story, told as a single gold thread: from one bed stitched by hand in 2012 to the workshop, the materials and the homes we make them for today.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return <Thread />;
}
