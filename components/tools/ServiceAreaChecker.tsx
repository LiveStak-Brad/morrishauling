"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SERVICE_AREAS } from "@/lib/seo/locations";
import { Input } from "@/components/ui/input";
import { ButtonLink } from "@/components/ui/button-link";

export function ServiceAreaChecker() {
  const [q, setQ] = useState("");
  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (needle.length < 2) return [];
    return SERVICE_AREAS.filter(
      (a) =>
        a.divisions.includes("junk_removal") &&
        (a.name.toLowerCase().includes(needle) ||
          a.county.toLowerCase().includes(needle) ||
          a.slug.includes(needle.replace(/\s+/g, "-")) ||
          a.nearby.some((n) => n.toLowerCase().includes(needle)))
    ).slice(0, 8);
  }, [q]);

  return (
    <div className="space-y-4">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Try Warrenton, Troy, Wentzville, Washington…"
        className="h-12 rounded-xl"
        aria-label="Check service area city or county"
      />
      {q.trim().length >= 2 && matches.length === 0 && (
        <div className="rounded-2xl border border-border bg-white p-4 text-sm text-muted-foreground">
          No exact listed match. We still review many nearby addresses —{" "}
          <Link href="/contact" className="font-semibold text-brand-primary hover:underline">
            contact us
          </Link>{" "}
          or{" "}
          <Link href="/book?division=junk_removal" className="font-semibold text-brand-primary hover:underline">
            request an estimate
          </Link>
          . Extended areas may include travel considerations.
        </div>
      )}
      <ul className="space-y-2">
        {matches.map((area) => (
          <li key={area.slug} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
            <p className="font-semibold">
              {area.name}
              {area.kind === "county" ? "" : `, ${area.county}`}
            </p>
            {area.travelNote && (
              <p className="mt-1 text-xs text-amber-900">{area.travelNote}</p>
            )}
            <ButtonLink
              href={`/junk-removal/areas/${area.slug}`}
              variant="outline"
              size="sm"
              className="mt-3 rounded-xl"
            >
              View area page
            </ButtonLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
