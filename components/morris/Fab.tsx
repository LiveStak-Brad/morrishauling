"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface FabProps {
  href: string;
  icon: React.ReactNode;
  label?: string;
}

export function FloatingActionButton({ href, icon, label }: FabProps) {
  return (
    <Link
      href={href}
      className={cn(
        "fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full",
        "bg-gradient-to-r from-brand-primary to-[#C8102E] px-5 py-3.5 text-white shadow-lg",
        "transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95",
        "md:bottom-8"
      )}
      style={{ boxShadow: "var(--morris-shadow-glow)" }}
    >
      {icon}
      {label && <span className="text-sm font-semibold">{label}</span>}
    </Link>
  );
}

interface ActivityFeedProps {
  items: { id: string; message: string; time: string; amount?: number; type: string }[];
}

const TYPE_COLORS: Record<string, string> = {
  job: "bg-blue-500",
  payment: "bg-emerald-500",
  estimate: "bg-orange-500",
  review: "bg-yellow-500",
  financing: "bg-purple-500",
};

export function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={item.id}
          className="flex gap-3 animate-slide-up opacity-0"
          style={{ animationDelay: `${i * 0.06}s`, animationFillMode: "forwards" }}
        >
          <div
            className={cn(
              "mt-1.5 h-2 w-2 shrink-0 rounded-full",
              TYPE_COLORS[item.type] ?? "bg-gray-400"
            )}
          />
          <div className="min-w-0 flex-1 border-b border-border/60 pb-3 last:border-0">
            <p className="text-sm font-medium leading-snug">{item.message}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{item.time}</span>
              {item.amount != null && (
                <span className="text-xs font-semibold text-morris-success">
                  +${item.amount}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
