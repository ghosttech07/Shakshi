import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";
import { randomBytes } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { NEEDS_DATABASE, backend, insert, list } from "./db";

/**
 * The media library. Images are compressed and converted to WebP (max 2400px); video, GLB models
 * and frame-sequence archives are stored as uploaded. Supabase Storage (bucket "media") when
 * configured, otherwise .data/media served by /api/media/[file].
 */
export type MediaData = { url: string; name: string; kind: "image" | "video" | "model" | "file"; type: string; size: number; width?: number; height?: number; alt: string };

const LIMITS: Record<MediaData["kind"], number> = { image: 15e6, video: 80e6, model: 40e6, file: 20e6 };
const LOCAL_DIR = path.join(process.cwd(), ".data", "media");

function kindOf(type: string, name: string): MediaData["kind"] | null {
  if (/^image\/(jpeg|png|webp|gif|avif)$/.test(type)) return "image";
  if (/^video\/(mp4|webm)$/.test(type)) return "video";
  if (/\.glb$/i.test(name) || type === "model/gltf-binary") return "model";
  if (type === "application/pdf" || /\.zip$/i.test(name)) return "file";
  return null;
}

async function store(key: string, buf: Buffer, contentType: string): Promise<string> {
  if (backend === "supabase") {
    const sb = createClient(process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
    const { error } = await sb.storage.from("media").upload(key, buf, { contentType, upsert: false, cacheControl: "31536000" });
    if (error) throw new Error(error.message);
    return sb.storage.from("media").getPublicUrl(key).data.publicUrl;
  }
  if (process.env.VERCEL) throw new Error(NEEDS_DATABASE);
  await fs.mkdir(LOCAL_DIR, { recursive: true });
  await fs.writeFile(path.join(LOCAL_DIR, key), buf);
  return `/api/media/${key}`;
}

export async function saveUpload(file: File, alt: string) {
  const kind = kindOf(file.type, file.name);
  if (!kind) throw new Error("That file type isn't supported. Use JPG, PNG, WebP, GIF, AVIF, MP4, WebM, GLB, PDF or ZIP.");
  if (file.size > LIMITS[kind]) throw new Error(`That file is too large (limit ${Math.round(LIMITS[kind] / 1e6)} MB).`);
  if (kind === "image" && alt.trim().length < 3) throw new Error("Please describe the image (alt text) for people using screen readers.");
  const base = `${Date.now().toString(36)}-${randomBytes(4).toString("hex")}`;
  const raw = Buffer.from(await file.arrayBuffer());

  let data: MediaData;
  if (kind === "image") {
    const img = sharp(raw, { animated: file.type === "image/gif" }).rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true });
    const out = await img.webp({ quality: 82, effort: 5 }).toBuffer({ resolveWithObject: true });
    const url = await store(`${base}.webp`, out.data, "image/webp");
    data = { url, name: file.name.slice(0, 120), kind, type: "image/webp", size: out.info.size, width: out.info.width, height: out.info.height, alt: alt.trim().slice(0, 300) };
  } else {
    const ext = path.extname(file.name).toLowerCase().replace(/[^.a-z0-9]/g, "") || ".bin";
    const url = await store(`${base}${ext}`, raw, file.type || "application/octet-stream");
    data = { url, name: file.name.slice(0, 120), kind, type: file.type, size: raw.length, alt: alt.trim().slice(0, 300) };
  }
  return insert("media", data);
}

/** Where a file is used (pages, site settings, products, articles), so nothing in use is deleted. */
export async function usageOf(url: string) {
  const where: string[] = [];
  const scan = async (table: "pages" | "content" | "products" | "articles", label: (id: string) => string) => {
    for (const r of await list(table, { limit: 1000 })) if (JSON.stringify(r.data).includes(url)) where.push(label(r.id));
  };
  await scan("pages", (id) => `Page: ${id}`);
  await scan("content", (id) => (id === "site" ? "Site settings" : `Content: ${id}`));
  await scan("products", (id) => `Product: ${id}`);
  await scan("articles", (id) => `Article: ${id}`);
  return where;
}

export async function readLocal(file: string) {
  if (!/^[a-z0-9-]+\.[a-z0-9]+$/.test(file)) return null;
  try {
    return await fs.readFile(path.join(LOCAL_DIR, file));
  } catch {
    return null;
  }
}
