"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Props = Omit<ImageProps, "onLoad"> & { dark?: boolean; wrapperClassName?: string };

/** next/image with a brand-coloured shimmer that dissolves slowly once the photo arrives. */
export function Img({ className, wrapperClassName, dark, alt, fill = true, quality = 75, ...rest }: Props) {
  const [loaded, setLoaded] = useState(false);
  // Callers may position the wrapper themselves (e.g. `absolute inset-0`); otherwise it anchors the fill image.
  const positioned = /\b(absolute|fixed|sticky)\b/.test(wrapperClassName ?? "");
  return (
    <div className={cn(!positioned && "relative", "overflow-hidden", !loaded && (dark ? "skeleton-dark" : "skeleton"), wrapperClassName)}>
      <Image
        alt={alt}
        fill={fill}
        quality={quality}
        onLoad={() => setLoaded(true)}
        className={cn(
          "object-cover transition-[opacity,transform,filter] duration-[1200ms] ease-silk",
          loaded ? "opacity-100 blur-0" : "opacity-0 blur-sm",
          className
        )}
        {...rest}
      />
    </div>
  );
}
