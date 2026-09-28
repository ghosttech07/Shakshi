import { NextResponse } from "next/server";
import { endSession } from "@/lib/server/customer";

export const runtime = "nodejs";

export async function POST() {
  const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  endSession(res);
  return res;
}
