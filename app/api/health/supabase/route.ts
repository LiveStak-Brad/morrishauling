import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { getPublicSupabaseHealth } from "@/lib/health/supabase-health";

export async function GET(request: Request) {
  const limited = enforceRateLimit(request, {
    key: "health-supabase",
    limit: 30,
    windowMs: 60_000,
  });
  if (limited) return limited;

  try {
    const health = await getPublicSupabaseHealth();
    return NextResponse.json(health, { status: health.ok ? 200 : 503 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
