"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeAlt,
  afterAlt,
  className,
}: {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt: string;
  afterAlt: string;
  className?: string;
}) {
  const [value, setValue] = useState(50);
  const id = useId();

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-black/10 bg-black/5", className)}>
      <div className="relative aspect-[16/10] w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={afterSrc} alt={afterAlt} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${value}%` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={beforeSrc} alt={beforeAlt} className="absolute inset-0 h-full w-full max-w-none object-cover" loading="lazy" />
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow"
          style={{ left: `${value}%` }}
          aria-hidden
        />
      </div>
      <label className="sr-only" htmlFor={id}>
        Compare before and after
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
      <div className="flex justify-between px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-foreground/70">
        <span>Before</span>
        <span>After</span>
      </div>
    </div>
  );
}

export function PublishedBeforeAfter({
  beforeSrc,
  afterSrc,
  title,
}: {
  beforeSrc?: string | null;
  afterSrc?: string | null;
  title: string;
}) {
  if (!beforeSrc || !afterSrc) return null;
  return (
    <BeforeAfterSlider
      beforeSrc={beforeSrc}
      afterSrc={afterSrc}
      beforeAlt={`${title} before`}
      afterAlt={`${title} after`}
    />
  );
}
