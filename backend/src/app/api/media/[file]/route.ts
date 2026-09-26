import { readLocal } from "@/lib/server/media";

export const runtime = "nodejs";

const TYPES: Record<string, string> = { webp: "image/webp", mp4: "video/mp4", webm: "video/webm", glb: "model/gltf-binary", pdf: "application/pdf", zip: "application/zip" };

/** Serves locally stored uploads (when Supabase Storage isn't configured). Files never change, so they cache for a year. */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const buf = await readLocal(file);
  if (!buf) return new Response("Not found", { status: 404 });
  const ext = file.split(".").pop() ?? "";
  return new Response(new Uint8Array(buf), { headers: { "Content-Type": TYPES[ext] ?? "application/octet-stream", "Cache-Control": "public, max-age=31536000, immutable" } });
}
