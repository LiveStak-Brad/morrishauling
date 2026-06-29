import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/server";

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ profile: null }, { status: 401 });
  }
  return NextResponse.json({ profile });
}
