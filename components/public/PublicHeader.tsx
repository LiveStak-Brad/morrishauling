"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Phone, Sparkles } from "lucide-react";
import { useCompany } from "@/lib/company-context";
import { morrisServicesConfig } from "@/lib/morris-services-config";
import { isPublicPrelaunch } from "@/lib/public-site";
import { CompanyLogo } from "@/components/brand/CompanyLogo";
import { MorrisServicesLogo } from "@/components/brand/MorrisServicesLogo";
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

const umbrellaLinks = [
  { href: "/", label: "Home" },
  { href: "/#companies", label: "Our Companies" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const companyLinks = [
  { href: "/junk-removal", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/careers", label: "Careers" },
  { href: "/login", label: "My Account" },
];

const loginLinks = [
  { href: "/login?portal=customer", label: "Customer Login" },
  { href: "/login?portal=staff", label: "Staff Login" },
];

function NavLink({
  href,
  label,
  pathname,
  onDark,
}: {
  href: string;
  label: string;
  pathname: string;
  onDark?: boolean;
}) {
  const path = href.split("?")[0].split("#")[0];
  const active =
    path === "/junk-removal"
      ? pathname === "/junk-removal"
      : path === "/"
        ? pathname === "/"
        : pathname === path || pathname.startsWith(`${path}/`);

  if (onDark) {
    return (
      <Link
        href={href}
        className={cn(
          "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
          active
            ? "bg-brand-primary text-white shadow-sm"
            : "text-white/90 hover:bg-white/10 hover:text-white"
        )}
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "bg-brand-primary text-white shadow-sm" : "hover:bg-muted"
      )}
    >
      {label}
    </Link>
  );
}

export function PublicHeader({
  variant = "umbrella",
  transparent = false,
  floating = false,
}: {
  variant?: "umbrella" | "company";
  transparent?: boolean;
  /** true = always overlay hero; "desktop" = sticky bar below banner on mobile/tablet */
  floating?: boolean | "desktop";
}) {
  const { company } = useCompany();
  const pathname = usePathname();
  const mainLinks = variant === "umbrella" ? umbrellaLinks : companyLinks;
  const floatDesktop = floating === "desktop";
  const floatAll = floating === true;
  const onDark = floatAll || transparent || variant === "umbrella" || floatDesktop;
  const homeHref = variant === "company" ? "/junk-removal" : "/";
  const bookingCta = isPublicPrelaunch() ? "Booking info" : "Book service";

  return (
    <header
      className={cn(
        "z-50 transition-all duration-300",
        floatAll && "absolute inset-x-0 top-0",
        floatDesktop && "sticky top-0 lg:absolute lg:inset-x-0 lg:top-0",
        !floatAll && !floatDesktop && "sticky top-0",
        floatAll
          ? "border-b border-white/10 bg-black/60 shadow-lg backdrop-blur-md"
          : floatDesktop
            ? "border-b max-lg:border-white/10 max-lg:bg-[#1a1a1a]/95 max-lg:backdrop-blur-md lg:border-white/10 lg:bg-black/60 lg:shadow-lg lg:backdrop-blur-md"
            : variant === "umbrella"
              ? "border-b border-white/10 bg-black/65 shadow-lg backdrop-blur-md"
              : transparent
                ? "border-b border-white/20 bg-black/25 backdrop-blur-md"
                : "morris-glass border-b border-white/40"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 md:h-[4.25rem]">
        {variant === "umbrella" ? (
          <MorrisServicesLogo height={52} priority className="max-h-11 sm:max-h-12 md:max-h-14" />
        ) : (
          <div className="flex min-w-0 shrink flex-col">
            <CompanyLogo
              height={floatAll || floatDesktop ? 56 : 56}
              width={floatAll || floatDesktop ? 220 : 220}
              priority
              href={homeHref}
              onDark={onDark}
              className={
                floatAll || floatDesktop ? "!h-12 !w-12 md:!h-14 md:!w-14" : undefined
              }
            />
            <span
              className={cn(
                "truncate text-[10px] font-medium leading-tight",
                onDark ? "text-white/80" : "text-muted-foreground"
              )}
            >
              A {morrisServicesConfig.publicBrandName} Company
            </span>
          </div>
        )}

        <nav
          className={cn(
            "hidden flex-1 flex-wrap items-center justify-center gap-0.5 xl:gap-1",
            variant === "company" ? "md:flex" : "lg:flex"
          )}
        >
          {mainLinks.map((link) => (
            <NavLink key={link.href} {...link} pathname={pathname} onDark={onDark} />
          ))}
          {variant === "umbrella" && (
            <>
              <span className="mx-1 hidden h-4 w-px bg-white/25 lg:block" />
              {loginLinks.map((link) => (
                <NavLink key={link.href} {...link} pathname={pathname} onDark />
              ))}
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${company.phone}`}
            className={cn(
              buttonVariants({ size: "sm", variant: "outline" }),
              "hidden rounded-full sm:inline-flex",
              onDark
                ? "border-white/35 bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 hover:text-white"
                : "border-brand-primary/20 hover:bg-brand-primary/5"
            )}
          >
            <Phone className={cn("mr-1.5 h-4 w-4", onDark ? "text-white" : "text-brand-primary")} />
            <span className="font-semibold">{company.phone}</span>
          </a>

          {variant === "company" && (
            <ButtonLink
              href="/book"
              size="sm"
              className={cn(
                "hidden rounded-full bg-brand-primary shadow-md hover:bg-brand-primary/90 sm:inline-flex",
                onDark && "bg-brand-primary hover:bg-brand-primary/90"
              )}
            >
              <Sparkles className="mr-1.5 h-4 w-4" />
              {bookingCta}
            </ButtonLink>
          )}

          <Sheet>
            <SheetTrigger
              className={cn(
                buttonVariants({ size: "icon", variant: "ghost" }),
                "rounded-full",
                variant === "company" ? "md:hidden" : "lg:hidden",
                onDark && "text-white hover:bg-white/15 hover:text-white"
              )}
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent
              side="right"
              className={cn(
                "w-[min(100vw-2rem,320px)]",
                onDark ? "border-border bg-slate-950 text-white" : "morris-glass"
              )}
            >
              <SheetHeader>
                <SheetTitle className={cn("text-left", onDark && "text-white")}>
                  {variant === "umbrella"
                    ? morrisServicesConfig.publicBrandName
                    : company.companyName}
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-8 flex flex-col gap-1">
                {mainLinks.map((link) => {
                  const path = link.href.split("?")[0].split("#")[0];
                  const active =
                    path === "/junk-removal"
                      ? pathname === "/junk-removal"
                      : path === "/"
                        ? pathname === "/"
                        : pathname === path || pathname.startsWith(`${path}/`);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                        active
                          ? "bg-brand-primary text-white"
                          : onDark
                            ? "text-white/90 hover:bg-white/10"
                            : "hover:bg-muted"
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}
                {variant === "umbrella" &&
                  loginLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="rounded-xl px-4 py-3 text-sm font-medium text-white/90 hover:bg-white/10"
                    >
                      {link.label}
                    </Link>
                  ))}
                <a
                  href={`tel:${company.phone}`}
                  className={cn(
                    "mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold",
                    onDark
                      ? "bg-brand-primary text-white"
                      : "bg-brand-primary/10 text-brand-primary"
                  )}
                >
                  <Phone className="h-4 w-4" />
                  {company.phone}
                </a>
                {variant === "company" && (
                  <ButtonLink href="/book" className="mt-2 w-full rounded-xl">
                    {bookingCta}
                  </ButtonLink>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
