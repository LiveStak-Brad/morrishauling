import { NextResponse } from "next/server";
import { requireApiProfile } from "@/lib/api/require-profile";
import { isAdmin } from "@/lib/auth/permissions";
import { getDetailedSupabaseHealth } from "@/lib/health/supabase-health";

export async function GET() {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;

  if (!isAdmin(profile)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const detail = await getDetailedSupabaseHealth();
    return NextResponse.json(detail);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      {
        ok: false,
        connected: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
