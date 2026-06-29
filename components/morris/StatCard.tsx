import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { PremiumCard } from "./PremiumCard";

type StatTrend = "up" | "down" | "neutral";

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  trend?: StatTrend;
  trendValue?: string;
  variant?: "default" | "hero" | "dark";
  className?: string;
}

export function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  trend,
  trendValue,
  variant = "default",
  className,
}: StatCardProps) {
  return (
    <PremiumCard
      className={cn(
        "p-5",
        variant === "hero" && "bg-gradient-to-br from-brand-primary to-[#6B0F1F] text-white border-0",
        variant === "dark" && "bg-morris-black text-white border-0",
        className
      )}
      glow={variant === "hero"}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-wider",
              variant === "default" ? "text-muted-foreground" : "text-white/70"
            )}
          >
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
            {value}
          </p>
          {subtext && (
            <p
              className={cn(
                "mt-1 text-sm",
                variant === "default" ? "text-muted-foreground" : "text-white/60"
              )}
            >
              {subtext}
            </p>
          )}
          {trend && trendValue && (
            <p
              className={cn(
                "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                trend === "up" && "bg-morris-success/15 text-morris-success",
                trend === "down" && "bg-morris-urgent/15 text-morris-urgent",
                trend === "neutral" && "bg-white/10 text-white/70"
              )}
            >
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "•"} {trendValue}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
              variant === "default"
                ? "bg-brand-primary/10 text-brand-primary"
                : "bg-white/15 text-white"
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </PremiumCard>
  );
}
