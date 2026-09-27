/** The Shakshi mark, drawn in the current text colour (the SVGs live in /public/brand). */
export function Logo({ variant = "wordmark", className = "" }: { variant?: "wordmark" | "lockup"; className?: string }) {
  const src = variant === "lockup" ? "/brand/shakshi-lockup.svg" : "/brand/shakshi-wordmark.svg";
  return (
    <span
      role="img"
      aria-label="Shakshi"
      className={`logo-mask ${variant === "lockup" ? "aspect-[2.36]" : "aspect-[3.07]"} ${className}`}
      style={{ ["--logo" as string]: `url(${src})` }}
    />
  );
}
