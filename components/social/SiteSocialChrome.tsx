"use client";

import { usePathname } from "next/navigation";
import { SocialAnnouncementBar } from "@/components/social/SocialAnnouncementBar";
import { FloatingSocialPill } from "@/components/social/FloatingSocialPill";

function isPublicMarketingPath(pathname: string) {
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/employee") ||
    pathname.startsWith("/customer") ||
    pathname.startsWith("/planner") ||
    pathname.startsWith("/hr") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/api")
  ) {
    return false;
  }
  return true;
}

/** Site-wide social chrome for public marketing pages only. */
export function SiteSocialChrome() {
  const pathname = usePathname() || "/";
  if (!isPublicMarketingPath(pathname)) return null;

  return (
    <>
      <SocialAnnouncementBar />
      <FloatingSocialPill />
    </>
  );
}
