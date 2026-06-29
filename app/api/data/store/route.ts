import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { requireApiProfile } from "@/lib/api/require-profile";
import { getCompanyStore } from "@/lib/db";

export async function GET(request: Request) {
  const limited = enforceRateLimit(request, {
    key: "data-store",
    limit: 30,
    windowMs: 60_000,
  });
  if (limited) return limited;

  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;

  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");

  if (!companyId) {
    return NextResponse.json({ error: "companyId required" }, { status: 400 });
  }

  try {
    const store = await getCompanyStore(companyId, profile);
    return NextResponse.json(store);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ source: "mock", tablesReady: false, error: message }, { status: 500 });
  }
}
