import { cn } from "@shakshi/shared/utils";

type Props = {
  /** "wordmark" is SHAKSHI® alone (header); "lockup" adds the tagline (footer, preloader, sign-in). */
  variant?: "wordmark" | "lockup";
  /** "brand": Shakshi red on light surfaces, pearl by moonlight. "light": pearl, for dark surfaces. */
  tone?: "brand" | "light";
  className?: string;
};

/**
 * The Shakshi logo, traced to vector from the master artwork and drawn as a CSS mask,
 * so one cached SVG can take the brand red or pearl to suit the surface beneath it.
 */
export function Logo({ variant = "wordmark", tone = "brand", className }: Props) {
  return (
    <span
      role="img"
      aria-label={variant === "lockup" ? "Shakshi, a commitment for complete rest" : "Shakshi"}
      data-tone={tone}
      className={cn("logo", variant === "lockup" ? "logo-lockup" : "logo-wordmark", className)}
    />
  );
}
