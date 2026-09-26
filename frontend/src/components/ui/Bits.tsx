import { cn } from "@shakshi/shared/utils";
import { IconStar } from "./Icons";

export function Stars({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-gold", className)} role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <IconStar key={i} size={size} filled={i <= Math.round(value)} />
      ))}
    </span>
  );
}

/** Where a mattress sits between plush and firm. */
export function FirmnessScale({ value, dark, compact }: { value: number; dark?: boolean; compact?: boolean }) {
  const pct = ((value - 1) / 9) * 100;
  return (
    <div className="w-full" role="img" aria-label={`Firmness ${value} out of 10`}>
      <div className="relative h-5">
        <div className={cn("absolute inset-x-0 top-1/2 h-px", dark ? "bg-pearl/25" : "bg-ink/20")} />
        <div className="absolute top-1/2 h-px bg-gradient-to-r from-blush via-gold to-gold" style={{ width: `${pct}%` }} />
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className={cn("absolute top-1/2 h-1.5 w-px -translate-y-1/2", dark ? "bg-pearl/30" : "bg-ink/25")}
            style={{ left: `${(i / 9) * 100}%` }}
          />
        ))}
        <span
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ivory bg-gold shadow-[0_2px_10px_rgb(14_20_32/0.3)]"
          style={{ left: `${pct}%` }}
        />
      </div>
      {!compact && (
        <div className={cn("mt-1.5 flex justify-between text-[0.65rem] uppercase tracking-[0.2em]", dark ? "text-pearl/55" : "text-stone")}>
          <span>Plush</span>
          <span>Medium</span>
          <span>Firm</span>
        </div>
      )}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  dark,
  align = "left",
  className,
  f,
}: {
  eyebrow?: string;
  /** Studio preview: tags each part with its field name. */
  f?: (path: string) => object;
  title: React.ReactNode;
  intro?: string;
  dark?: boolean;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn(align === "center" && "mx-auto text-center", "max-w-2xl", className)}>
      {eyebrow && (
        <p className={cn("eyebrow mb-5", dark ? "text-gold" : "text-gold-ink")} {...f?.("eyebrow")}>
          {eyebrow}
        </p>
      )}
      <h2 className="display text-[2.6rem] sm:text-5xl lg:text-6xl" {...f?.("title")}>
        {title}
      </h2>
      {intro && (
        <p className={cn("mt-6 text-base leading-relaxed sm:text-lg", dark ? "text-pearl/70" : "text-stone")} {...f?.("intro")}>
          {intro}
        </p>
      )}
    </div>
  );
}
