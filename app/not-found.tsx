import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { SEO_ORG } from "@/lib/seo/site";

export const metadata: Metadata = buildPageMetadata({
  title: "Page not found",
  description: "The page you requested is not available on Morris Services.",
  path: "/404",
  noIndex: true,
});

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">404</p>
      <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight">Page not found</h1>
      <p className="mt-3 text-muted-foreground">
        That link may be outdated, private, or mistyped. Try one of these instead.
      </p>
      <nav className="mt-8 flex flex-col gap-3 text-sm font-semibold text-brand-primary">
        <Link href="/" className="hover:underline">
          Morris Services home
        </Link>
        <Link href="/junk-removal" className="hover:underline">
          Morris Junk Removal
        </Link>
        <Link href="/hauling" className="hover:underline">
          Morris Hauling
        </Link>
        <Link href="/book" className="hover:underline">
          Request an estimate
        </Link>
        <Link href="/contact" className="hover:underline">
          Contact · {SEO_ORG.phone}
        </Link>
      </nav>
    </main>
  );
}
