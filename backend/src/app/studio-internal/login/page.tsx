import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminBase } from "@/lib/server/admin-session";
import { LoginForm } from "@/components/studio/LoginForm";
import { Logo } from "@/components/studio/Logo";

export const metadata: Metadata = { title: "Sign in" };

/** The only studio page reachable without a session: logo, one password field, Enter. */
export default function LoginPage() {
  if (!adminBase()) notFound();
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-midnight px-6 text-pearl">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(45%_35%_at_50%_38%,rgb(201_169_110/0.10),transparent)]" />
      <div className="relative w-full max-w-sm text-center">
        <Logo variant="lockup" className="mx-auto h-20 text-pearl [animation:breathe_6s_ease-in-out_infinite]" />
        <LoginForm />
      </div>
    </main>
  );
}
