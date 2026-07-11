import Link from "next/link";
import { cn } from "@/lib/utils";

export function MarketingBreadcrumbs({
  items,
  className,
}: {
  items: Array<{ name: string; href?: string }>;
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={cn("text-sm text-muted-foreground", className)}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.name}-${i}`} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden className="text-border">/</span>}
              {item.href && !last ? (
                <Link href={item.href} className="hover:text-brand-primary hover:underline">
                  {item.name}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={last ? "text-foreground" : undefined}>
                  {item.name}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
