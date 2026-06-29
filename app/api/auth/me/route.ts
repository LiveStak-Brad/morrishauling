import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/server";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ profile: null }, { status: 401 });
  }

  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ profile: null }, { status: 401 });
    }
    return NextResponse.json({ profile });
  } catch (error) {
    console.error("[api/auth/me]", error);
    return NextResponse.json({ profile: null }, { status: 401 });
  }
}
