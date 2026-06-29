"use client";

import { Providers } from "@/components/Providers";
import { DevToolbar } from "@/components/dev/DevToolbar";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      {children}
      <DevToolbar />
    </Providers>
  );
}
