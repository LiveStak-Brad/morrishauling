"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AUTHORITY_ITEMS, ACCEPTANCE_LABELS, type AuthorityItem } from "@/lib/seo/items";
import { Input } from "@/components/ui/input";
import { trackMarketingEvent } from "@/lib/seo/analytics";

export function CanWeTakeThisTool() {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return AUTHORITY_ITEMS.slice(0, 8);
    return AUTHORITY_ITEMS.filter(
      (item) =>
        item.name.toLowerCase().includes(needle) ||
        item.keywords.some((k) => k.toLowerCase().includes(needle)) ||
        item.slug.includes(needle.replace(/\s+/g, "-"))
    );
  }, [q]);

  return (
    <div className="space-y-4">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search mattress, refrigerator, tires, piano…"
        className="h-12 rounded-xl"
        aria-label="Search items we may take"
      />
      <ul className="space-y-3">
        {results.map((item) => (
          <ResultRow key={item.slug} item={item} />
        ))}
        {results.length === 0 && (
          <li className="rounded-2xl border border-border bg-white p-4 text-sm text-muted-foreground">
            No exact match.{" "}
            <Link href="/book?division=junk_removal" className="font-semibold text-brand-primary hover:underline">
              Request an estimate
            </Link>{" "}
            with photos and we will confirm honestly.
          </li>
        )}
      </ul>
    </div>
  );
}

function ResultRow({ item }: { item: AuthorityItem }) {
  return (
    <li className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Link
          href={`/junk-removal/items/${item.slug}`}
          className="font-semibold text-foreground hover:text-brand-primary"
          onClick={() =>
            trackMarketingEvent("service_page_cta", {
              division: "junk_removal",
              label: `item_search_${item.slug}`,
            })
          }
        >
          {item.name}
        </Link>
        <span className="text-xs font-medium text-brand-primary">
          {ACCEPTANCE_LABELS[item.acceptance]}
        </span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{item.canRemove}</p>
    </li>
  );
}
