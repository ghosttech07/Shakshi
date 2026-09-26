import type { Metadata } from "next";
import { Invoice } from "@/components/account/Invoice";

export const metadata: Metadata = {
  title: "Invoice",
  robots: { index: false, follow: false },
};

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="container-lux pb-28 pt-32 print:p-0">
      <Invoice id={decodeURIComponent(id)} />
    </div>
  );
}
