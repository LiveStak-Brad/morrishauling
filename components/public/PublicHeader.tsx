"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, Phone, Sparkles } from "lucide-react";
import { useCompany } from "@/lib/company-context";
import { morrisServicesConfig } from "@/lib/morris-services-config";
import { isPublicPrelaunch } from "@/lib/public-site";
import {
  PUBLIC_NAV_GROUPS,
  SCRAP_FRIDAYS_NAV,
  navGroupIsActive,
  navLinkIsActive,
  type PublicNavGroup,
  type PublicNavLink,
} from "@/lib/public-nav";
import { MorrisServicesLogo } from "@/components/brand/MorrisServicesLogo";
import { ButtonLink } from "@/components/ui/button-link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SocialMobileNavSection, SocialNavDropdown } from "@/components/social/SocialNavMenu";

function NewBadge({ onDark }: { onDark?: boolean }) {
  return (
    <span
      className={cn(
        "ml-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
        onDark ? "bg-brand-primary text-white" : "bg-brand-primary/15 text-brand-primary"
      )}
    >
      New
    </span>
  );
}

function DesktopNavLink({
  link,
  pathname,
  onDark,
}: {
  link: PublicNavLink;
  pathname: string;
  onDark?: boolean;
}) {
  const active = navLinkIsActive(pathname, link.href);
  return (
    <Link
      href={link.href}
      className={cn(
        "inline-flex min-h-10 items-center rounded-full px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2",
        onDark
          ? active
            ? "bg-brand-primary text-white shadow-sm"
            : "text-white/90 hover:bg-white/10 hover:text-white"
          : active
            ? "bg-brand-primary text-white shadow-sm"
            : "text-foreground/85 hover:bg-muted hover:text-foreground"
      )}
    >
      {link.label}
      {link.badge ? <NewBadge onDark={onDark || active} /> : null}
    </Link>
  );
}

function DesktopNavDropdown({
  group,
  pathname,
  onDark,
}: {
  group: PublicNavGroup;
  pathname: string;
  onDark?: boolean;
}) {
  const active = navGroupIsActive(pathname, group);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex min-h-10 items-center gap-1 rounded-full px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2",
          onDark
            ? active
              ? "bg-white/15 text-white"
              : "text-white/90 hover:bg-white/10 hover:text-white"
            : active
              ? "bg-muted text-foreground"
              : "text-foreground/85 hover:bg-muted hover:text-foreground"
        )}
      >
        {group.label}
        <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={10} className="min-w-[15.5rem] p-1.5">
        {group.items.map((item) => (
          <DropdownMenuItem
            key={`${group.id}-${item.href}-${item.label}`}
            render={<Link href={item.href} />}
            className={cn(
              "cursor-pointer rounded-lg px-3 py-2.5 text-sm font-medium",
              item.highlight && "bg-brand-primary/5 text-brand-primary focus:bg-brand-primary/10",
              navLinkIsActive(pathname, item.href) && "bg-accent"
            )}
          >
            <span className="inline-flex items-center">
              {item.label}
              {item.badge ? <NewBadge /> : null}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileAccordionGroup({
  group,
  pathname,
  onDark,
  onNavigate,
}: {
  group: PublicNavGroup;
  pathname: string;
  onDark?: boolean;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(() => navGroupIsActive(pathname, group));
  return (
    <div className="border-b border-border/50 last:border-b-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex min-h-12 w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold transition-colors",
          onDark ? "text-white hover:bg-white/10" : "hover:bg-muted"
        )}
      >
        {group.label}
        <ChevronDown
          className={cn("h-4 w-4 opacity-70 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="pb-2 pl-2">
          {group.items.map((item) => {
            const active = navLinkIsActive(pathname, item.href);
            return (
              <Link
                key={`${group.id}-${item.href}-${item.label}`}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex min-h-11 items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-primary text-white"
                    : item.highlight
                      ? onDark
                        ? "text-brand-primary hover:bg-white/10"
                        : "text-brand-primary hover:bg-brand-primary/5"
                      : onDark
                        ? "text-white/85 hover:bg-white/10"
                        : "text-foreground/90 hover:bg-muted"
                )}
              >
                {item.label}
                {item.badge ? <NewBadge onDark={active || onDark} /> : null}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const floatDesktop = floating === "desktop";
  const floatAll = floating === true;
  const onDark = floatAll || transparent || floatDesktop;
  const bookingCta = isPublicPrelaunch() ? "Book service" : "Book service";
  const homeHref = variant === "company" ? "/junk-removal" : "/";

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
              ? "morris-glass border-b border-white/40 shadow-sm"
              : transparent
                ? "border-b border-white/20 bg-black/25 backdrop-blur-md"
                : "morris-glass border-b border-white/40"
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-7xl items-center gap-3 px-4 lg:gap-5",
          "h-[4.75rem] md:h-[5.25rem]"
        )}
      >
        <MorrisServicesLogo
          height={72}
          priority
          href={homeHref}
          className="max-h-[3.75rem] shrink-0 sm:max-h-[4.25rem] md:max-h-[4.5rem]"
        />

        <nav
          aria-label="Primary"
          className={cn(
            "hidden min-w-0 flex-1 items-center justify-center gap-0.5",
            "lg:flex"
          )}
        >
          <DesktopNavLink
            link={{ href: homeHref, label: "Home" }}
            pathname={pathname}
            onDark={onDark}
          />
          <DesktopNavLink link={SCRAP_FRIDAYS_NAV} pathname={pathname} onDark={onDark} />
          {PUBLIC_NAV_GROUPS.map((group) => (
            <DesktopNavDropdown
              key={group.id}
              group={group}
              pathname={pathname}
              onDark={onDark}
            />
          ))}
          <SocialNavDropdown onDark={onDark} />
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <a
            href={`tel:${company.phone}`}
            className={cn(
              buttonVariants({ size: "sm", variant: "outline" }),
              "hidden min-h-10 rounded-full sm:inline-flex",
              onDark
                ? "border-white/35 bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 hover:text-white"
                : "border-brand-primary/20 hover:bg-brand-primary/5"
            )}
          >
            <Phone className={cn("mr-1.5 h-4 w-4", onDark ? "text-white" : "text-brand-primary")} />
            <span className="font-semibold">{company.phone}</span>
          </a>

          <ButtonLink
            href="/login"
            size="sm"
            variant="outline"
            className={cn(
              "hidden min-h-10 rounded-full md:inline-flex",
              onDark
                ? "border-white/35 bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 hover:text-white"
                : "border-border hover:bg-muted"
            )}
          >
            Login
          </ButtonLink>

          <ButtonLink
            href="/book"
            size="sm"
            className={cn(
              "hidden min-h-10 rounded-full bg-brand-primary shadow-md hover:bg-brand-primary/90 sm:inline-flex",
              onDark && "bg-brand-primary hover:bg-brand-primary/90"
            )}
          >
            <Sparkles className="mr-1.5 h-4 w-4" />
            {bookingCta}
          </ButtonLink>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              aria-label="Open menu"
              className={cn(
                buttonVariants({ size: "icon", variant: "ghost" }),
                "min-h-11 min-w-11 rounded-full lg:hidden",
                onDark && "text-white hover:bg-white/15 hover:text-white"
              )}
            >
              <Menu className="h-5 w-5" aria-hidden />
            </SheetTrigger>
            <SheetContent
              side="right"
              className={cn(
                "w-[min(100vw-1.5rem,22rem)] overflow-y-auto",
                onDark ? "border-border bg-slate-950 text-white" : "morris-glass"
              )}
            >
              <SheetHeader>
                <SheetTitle className="sr-only">
                  {variant === "umbrella"
                    ? morrisServicesConfig.publicBrandName
                    : company.companyName}
                </SheetTitle>
                <MorrisServicesLogo height={64} href={homeHref} className="max-h-16" />
              </SheetHeader>

              <div className="mt-4 grid grid-cols-2 gap-2 px-1">
                <a
                  href={`tel:${company.phone}`}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-primary px-3 text-sm font-semibold text-white"
                >
                  <Phone className="h-4 w-4" />
                  Call
                </a>
                <ButtonLink href="/book" className="min-h-12 w-full rounded-xl" onClick={() => setMobileOpen(false)}>
                  {bookingCta}
                </ButtonLink>
              </div>

              <nav className="mt-5 flex flex-col" aria-label="Mobile">
                <Link
                  href={homeHref}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex min-h-12 items-center rounded-xl px-4 text-sm font-semibold transition-colors",
                    navLinkIsActive(pathname, homeHref)
                      ? "bg-brand-primary text-white"
                      : onDark
                        ? "text-white/90 hover:bg-white/10"
                        : "hover:bg-muted"
                  )}
                >
                  Home
                </Link>
                <Link
                  href={SCRAP_FRIDAYS_NAV.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex min-h-12 items-center rounded-xl px-4 text-sm font-semibold transition-colors",
                    navLinkIsActive(pathname, SCRAP_FRIDAYS_NAV.href)
                      ? "bg-brand-primary text-white"
                      : onDark
                        ? "text-brand-primary hover:bg-white/10"
                        : "text-brand-primary hover:bg-brand-primary/5"
                  )}
                >
                  {SCRAP_FRIDAYS_NAV.label}
                  <NewBadge
                    onDark={navLinkIsActive(pathname, SCRAP_FRIDAYS_NAV.href) || onDark}
                  />
                </Link>

                {PUBLIC_NAV_GROUPS.map((group) => (
                  <MobileAccordionGroup
                    key={group.id}
                    group={group}
                    pathname={pathname}
                    onDark={onDark}
                    onNavigate={() => setMobileOpen(false)}
                  />
                ))}

                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "mt-2 flex min-h-12 items-center rounded-xl px-4 text-sm font-medium transition-colors",
                    onDark ? "text-white/90 hover:bg-white/10" : "hover:bg-muted"
                  )}
                >
                  Login
                </Link>

                <SocialMobileNavSection onDark={onDark} />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
