import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { roleAllowedForPath } from "@/lib/auth/permissions";
import { normalizeStaffRole } from "@/lib/auth/staff-allowlist";
import type { Role } from "@/types";

const PROTECTED_PREFIXES = ["/customer", "/employee", "/planner", "/admin", "/account"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status, email")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.status !== "active") {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("error", "no_profile");
    return NextResponse.redirect(loginUrl);
  }

  const role = normalizeStaffRole(profile.role as Role, profile.email as string);

  // Dev toolbar impersonation: honor preview role cookie so /customer and /employee open.
  const isDev = process.env.NODE_ENV === "development";
  const impersonating = isDev && request.cookies.get("morris_dev_impersonate")?.value === "true";
  const previewRoleRaw = request.cookies.get("morris_dev_role")?.value as Role | undefined;
  const previewRole =
    impersonating &&
    previewRoleRaw &&
    ["customer", "employee", "planner", "admin", "hr", "office_admin"].includes(previewRoleRaw)
      ? previewRoleRaw
      : null;

  const roleForPath = previewRole ?? role;
  // Real admin/owner may always open portals; otherwise use preview or real role.
  const allowed =
    roleAllowedForPath(role, pathname, profile.email as string) ||
    roleAllowedForPath(roleForPath, pathname, profile.email as string);
  if (!allowed) {
    const unauthorized = request.nextUrl.clone();
    unauthorized.pathname = "/unauthorized";
    return NextResponse.redirect(unauthorized);
  }

  return response;
}

export const config = {
  matcher: [
    "/customer/:path*",
    "/employee/:path*",
    "/planner/:path*",
    "/admin/:path*",
    "/account/:path*",
  ],
};
