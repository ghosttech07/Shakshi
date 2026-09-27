import { requireStudio } from "@/lib/server/studio";
import { Shell } from "@/components/studio/Shell";

// Every page inside the shell is checked here as well as in the proxy.
export const dynamic = "force-dynamic";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const base = await requireStudio();
  return (
    <Shell base={base} storefront={process.env.FRONTEND_URL ?? "http://localhost:3000"}>
      {children}
    </Shell>
  );
}
