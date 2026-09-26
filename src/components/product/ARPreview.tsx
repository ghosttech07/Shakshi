"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { SIZES, type Product, type SizeId } from "@/lib/products";
import { IconCube } from "@/components/ui/Icons";

/**
 * "View in your room": a camera preview with a to-scale mattress footprint you can drag and resize.
 * A lightweight stand-in for full WebXR placement, which would need a USDZ/GLB model per product.
 */
export function ARPreview({ product, size }: { product: Product; size: SizeId }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "live" | "denied" | "unsupported">("idle");
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [pos, setPos] = useState({ x: 50, y: 62, scale: 1 });
  const drag = useRef<{ x: number; y: number } | null>(null);
  const s = SIZES.find((x) => x.id === size)!;

  useEffect(() => {
    if (!open) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      return;
    }
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      .then((ms) => {
        if (cancelled) return ms.getTracks().forEach((t) => t.stop());
        stream.current = ms;
        if (video.current) video.current.srcObject = ms;
        setStatus("live");
      })
      .catch(() => setStatus("denied"));
    return () => {
      cancelled = true;
      stream.current?.getTracks().forEach((t) => t.stop());
      stream.current = null;
      setStatus("idle");
    };
  }, [open]);

  const onDown = (e: PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY };
  };
  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!drag.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const dx = ((e.clientX - drag.current.x) / r.width) * 100;
    const dy = ((e.clientY - drag.current.y) / r.height) * 100;
    drag.current = { x: e.clientX, y: e.clientY };
    setPos((p) => ({ ...p, x: Math.min(90, Math.max(10, p.x + dx)), y: Math.min(90, Math.max(20, p.y + dy)) }));
  };

  // Footprint proportions from the real size, drawn in gentle floor perspective.
  const w = 26 * (s.cm[0] / 152) * pos.scale;
  const d = 30 * (s.cm[1] / 198) * pos.scale;
  const cx = pos.x;
  const cy = pos.y;
  const pts = [
    [cx - w * 0.72, cy - d * 0.45],
    [cx + w * 0.72, cy - d * 0.45],
    [cx + w, cy + d * 0.45],
    [cx - w, cy + d * 0.45],
  ];

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex shrink-0 items-center gap-2 border border-ink/15 px-3 py-3 text-[0.65rem] uppercase tracking-[0.18em] transition-colors duration-700 hover:border-gold sm:px-4">
        <IconCube size={18} className="text-gold-ink" />
        <span className="hidden sm:inline">View in your room</span>
        <span className="sm:hidden">AR</span>
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="View in your room" dark className="sm:max-w-2xl">
        <div className="p-6 pt-4">
          <p className="text-sm text-pearl/65">
            Point your camera at the floor, then drag the outline into place. It&rsquo;s drawn to the proportions of a {s.label} ({s.dims}) {product.name}.
          </p>
          <div className="relative mt-5 aspect-[3/4] overflow-hidden rounded-sm bg-midnight-2 sm:aspect-video">
            <video ref={video} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-cover" />
            {status !== "live" && (
              <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(70%_60%_at_50%_60%,#2a3246,#0e1420)] p-8 text-center">
                <p className="max-w-xs text-sm text-pearl/70">
                  {status === "denied"
                    ? "Camera access was declined. You can still arrange the outline here, or allow the camera in your browser settings."
                    : status === "unsupported"
                    ? "Your browser can't open the camera here. Try this page on your phone for the full preview."
                    : "Opening your camera…"}
                </p>
              </div>
            )}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full touch-none" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={() => (drag.current = null)} aria-label="Drag to position the mattress outline" role="img">
              <polygon points={pts.map((p) => p.join(",")).join(" ")} fill="rgb(245 240 232 / 0.35)" stroke="#c9a96e" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
              <polygon points={pts.map(([x, y]) => `${x},${y - 3 * pos.scale}`).join(" ")} fill="rgb(245 240 232 / 0.55)" stroke="#c9a96e" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
          <label className="mt-5 flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-pearl/60">
            Distance
            <input type="range" min={0.5} max={1.8} step={0.01} value={pos.scale} onChange={(e) => setPos((p) => ({ ...p, scale: +e.target.value }))} className="flex-1 text-pearl" />
          </label>
        </div>
      </Dialog>
    </>
  );
}
