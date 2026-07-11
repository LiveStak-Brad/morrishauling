import { isDemoDataExplicitlyEnabled } from "@/lib/is-demo-data";

export interface ProductionEnvStatus {
  isProduction: boolean;
  ok: boolean;
  errors: string[];
  warnings: string[];
  demoDataEnabled: boolean;
  useSupabase: boolean;
  hasServiceRole: boolean;
  hasStaffOwnerEmails: boolean;
}

/** Validate required production environment variables. */
export function validateProductionEnv(): ProductionEnvStatus {
  const isProduction = process.env.NODE_ENV === "production";
  const errors: string[] = [];
  const warnings: string[] = [];

  const useSupabase = process.env.NEXT_PUBLIC_USE_SUPABASE === "true";
  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
  const hasStaffOwnerEmails = Boolean(process.env.STAFF_OWNER_EMAILS?.trim());
  const demoDataEnabled = isDemoDataExplicitlyEnabled();

  if (isProduction) {
    if (!useSupabase) {
      errors.push("NEXT_PUBLIC_USE_SUPABASE must be true in production");
    }
    if (!hasServiceRole) {
      errors.push("SUPABASE_SERVICE_ROLE_KEY is required in production");
    }
    if (!hasStaffOwnerEmails) {
      errors.push("STAFF_OWNER_EMAILS must be set in production");
    }
    if (demoDataEnabled) {
      warnings.push("DEMO_DATA=true — demo/mock fallbacks are enabled in production");
    }
    if (process.env.ALLOW_PUBLIC_BOOKING === "false" || process.env.NEXT_PUBLIC_ALLOW_PUBLIC_BOOKING === "false") {
      warnings.push("Public booking is explicitly disabled (ALLOW_PUBLIC_BOOKING=false)");
    }
    if (process.env.APP_STATUS === "prelaunch" || process.env.NEXT_PUBLIC_APP_STATUS === "prelaunch") {
      warnings.push("APP_STATUS=prelaunch — public booking is frozen");
    }
    if (process.env.APP_STATUS === "live" || !process.env.APP_STATUS) {
      // live is the default — no warning
    }
  } else if (!useSupabase) {
    warnings.push("NEXT_PUBLIC_USE_SUPABASE is not true — using mock data layer");
  }

  return {
    isProduction,
    ok: errors.length === 0,
    errors,
    warnings,
    demoDataEnabled,
    useSupabase,
    hasServiceRole,
    hasStaffOwnerEmails,
  };
}

/** True when production is running with unsafe/missing required configuration. */
export function isProductionUnsafe(): boolean {
  const status = validateProductionEnv();
  return status.isProduction && !status.ok;
}

/** Block dev-only APIs in production (test employee, data inspector, etc.). */
export function isDevOnlyApiAllowed(): boolean {
  return process.env.NODE_ENV !== "production";
}
