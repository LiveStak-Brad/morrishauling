import { cn } from "@/lib/utils";

interface StatusChipProps {
  label: string;
  variant?: "success" | "warning" | "info" | "urgent" | "neutral" | "live";
  className?: string;
  pulse?: boolean;
}

const VARIANTS = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  warning: "bg-orange-50 text-orange-700 ring-orange-600/20",
  info: "bg-blue-50 text-blue-700 ring-blue-600/20",
  urgent: "bg-red-50 text-red-700 ring-red-600/20",
  neutral: "bg-gray-100 text-gray-700 ring-gray-600/20",
  live: "bg-brand-primary/10 text-brand-primary ring-brand-primary/30",
};

export function StatusChip({
  label,
  variant = "neutral",
  className,
  pulse = false,
}: StatusChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        VARIANTS[variant],
        pulse && "pulse-live",
        className
      )}
    >
      {variant === "live" && (
        <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
      )}
      {label}
    </span>
  );
}
