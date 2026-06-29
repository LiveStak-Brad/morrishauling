import { PremiumCard } from "@/components/morris/PremiumCard";
import type { LucideIcon } from "lucide-react";

export function AdminEmptyState({
  title,
  description,
  icon: Icon,
  action,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <PremiumCard className="border-dashed p-10 text-center">
      {Icon && <Icon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />}
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground whitespace-pre-line">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </PremiumCard>
  );
}
