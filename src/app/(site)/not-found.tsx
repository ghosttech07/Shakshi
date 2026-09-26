import Link from "next/link";

export default function NotFound() {
  return (
    <section data-dark-hero className="relative grid min-h-[100svh] place-items-center overflow-hidden bg-midnight px-5 text-center text-pearl linen-dark">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(40%_40%_at_50%_40%,rgb(201_169_110/0.15),transparent)]" />
      <div className="relative">
        <p className="eyebrow text-gold">404</p>
        <h1 className="display mt-6 text-5xl sm:text-7xl">This page has drifted off.</h1>
        <p className="mx-auto mt-6 max-w-md text-pearl/65">Perhaps it&rsquo;s sleeping somewhere peaceful. Let us guide you back.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/" className="btn btn-gold">Return home</Link>
          <Link href="/shop" className="btn btn-outline">Explore mattresses</Link>
        </div>
      </div>
    </section>
  );
}
