import type { Metadata } from "next";
import { AccountClient } from "@/components/account/AccountClient";

export const metadata: Metadata = {
  title: "Your Account",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <div className="container-lux pb-28 pt-36 lg:pt-44">
      <AccountClient />
    </div>
  );
}
