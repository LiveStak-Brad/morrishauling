import { cn } from "@/lib/utils";

interface PremiumCardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  glow?: boolean;
  style?: React.CSSProperties;
}

export function PremiumCard({
  children,
  className,
  interactive = false,
  glow = false,
  style,
}: PremiumCardProps) {
  return (
    <div
      className={cn(
        interactive ? "morris-card-interactive" : "morris-card",
        glow && "ring-1 ring-brand-primary/10",
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}
