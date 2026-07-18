"use client";

import { Providers } from "@/components/Providers";
import { DevToolbar } from "@/components/dev/DevToolbar";
import { SiteSocialChrome } from "@/components/social/SiteSocialChrome";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <SiteSocialChrome />
      {children}
      <DevToolbar />
    </Providers>
  );
}
