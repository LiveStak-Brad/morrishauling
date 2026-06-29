"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Phone, Sparkles } from "lucide-react";
import { useCompany } from "@/lib/company-context";
import { CompanyLogo } from "@/components/brand/CompanyLogo";
import { ButtonLink } from "@/components/ui/button-link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/book", label: "Book Now" },
  { href: "/login", label: "My Account" },
];

export function PublicHeader({
  transparent = false,
  floating = false,
}: {
  transparent?: boolean;
  /** Absolutely positioned over hero imagery — no bar, no blur */
  floating?: boolean;
}) {
  const { company } = useCompany();
  const pathname = usePathname();

  return (
    <header
      className={cn(
        "z-50 transition-all duration-300",
        floating
          ? "absolute inset-x-0 top-0 border-0 bg-transparent"
          : "sticky top-0",
        !floating &&
          (transparent
            ? "border-b border-white/20 bg-black/25 backdrop-blur-md"
            : "morris-glass border-b border-white/40")
      )}
    >
      <div className="mx-auto flex h-16 max-w-lg items-center justify-between px-4 md:h-[4.25rem] md:max-w-6xl">
        <CompanyLogo
          height={floating ? 72 : 56}
          width={floating ? 280 : 220}
          priority
          href="/"
          onDark={floating}
          className={floating ? "md:!h-[4.75rem] md:!w-[4.75rem]" : undefined}
        />

        <div className="flex items-center gap-2">
          <a
            href={`tel:${company.phone}`}
            className={cn(
              buttonVariants({ size: "sm", variant: "outline" }),
              "hidden rounded-full sm:inline-flex",
              floating || transparent
                ? "border-white/40 bg-black/30 text-white backdrop-blur-sm hover:bg-black/45 hover:text-white"
                : "border-brand-primary/20 hover:bg-brand-primary/5"
            )}
          >
            <Phone
              className={cn(
                "mr-1.5 h-4 w-4",
                floating || transparent ? "text-white" : "text-brand-primary"
              )}
            />
            <span className="font-semibold">{company.phone}</span>
          </a>

          <ButtonLink
            href="/book"
            size="sm"
            className={cn(
              "hidden rounded-full shadow-md sm:inline-flex",
              floating || transparent
                ? "bg-brand-primary hover:bg-brand-primary/90"
                : "bg-brand-primary hover:bg-brand-primary/90"
            )}
          >
            <Sparkles className="mr-1.5 h-4 w-4" />
            Book Now
          </ButtonLink>

          <Sheet>
            <SheetTrigger
              className={cn(
                buttonVariants({ size: "icon", variant: "ghost" }),
                "rounded-full md:hidden",
                (floating || transparent) && "text-white hover:bg-white/15 hover:text-white"
              )}
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] morris-glass">
              <SheetHeader>
                <SheetTitle className="text-left">{company.companyName}</SheetTitle>
              </SheetHeader>
              <nav className="mt-8 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                      pathname === link.href
                        ? "bg-brand-primary text-white"
                        : "hover:bg-muted"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <a
                  href={`tel:${company.phone}`}
                  className="mt-4 flex items-center gap-2 rounded-xl bg-brand-primary/10 px-4 py-3 text-sm font-semibold text-brand-primary"
                >
                  <Phone className="h-4 w-4" />
                  {company.phone}
                </a>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
