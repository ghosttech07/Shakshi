"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@shakshi/shared/utils";

type Props = Omit<ImageProps, "onLoad"> & { dark?: boolean; wrapperClassName?: string };

/**
 * next/image with a brand-coloured shimmer that dissolves slowly once the photo arrives.
 * The fade uses only opacity and scale (drawn by the graphics card), never blur, which would
 * make the browser re-blur the whole photo every frame and stutter the scroll.
 */
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
          "object-cover transition-[opacity,transform] duration-[1200ms] ease-silk",
          loaded ? "scale-100 opacity-100" : "scale-[1.03] opacity-0",
          className
        )}
        {...rest}
      />
    </div>
  );
}
