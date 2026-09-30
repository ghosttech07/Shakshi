import type { Metadata } from "next";
import { HouseExperience } from "@/components/house/HouseExperience";

export const metadata: Metadata = {
  title: "The House",
  description: "Step inside a Shakshi home: walk from the living room to the bedroom, and discover our mattresses, pillows and covers where they belong.",
};

export default function HousePage() {
  return <HouseExperience />;
}
