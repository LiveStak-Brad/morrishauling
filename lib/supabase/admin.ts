import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for scripts/migrations only.
 * Set SUPABASE_SERVICE_ROLE_KEY in .env.local when available.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
