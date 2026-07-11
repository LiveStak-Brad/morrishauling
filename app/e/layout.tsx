import type { Metadata } from "next";

/** Private share links must never be indexed. */
export const metadata: Metadata = {
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function EstimateShareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
