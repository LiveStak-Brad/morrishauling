import { NextResponse } from "next/server";
import { isDemoDataExplicitlyEnabled } from "@/lib/is-demo-data";

/** Dev-only UI and diagnostics (Data Inspector, test employee button, etc.). */
export function areDevToolsEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}

/** Production deploy with DEMO_DATA=true — show critical warning; block destructive dev actions. */
export function isProductionWithDemoData(): boolean {
  return process.env.NODE_ENV === "production" && isDemoDataExplicitlyEnabled();
}

/** Gate dev-only API routes — returns 404 in production (avoids leaking route existence). */
export function requireDevToolsApi(): Response | null {
  if (!areDevToolsEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return null;
}
