/**
 * Verify auth migration 003 state and env requirements.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i > 0) process.env[t.slice(0, i)] = t.slice(i + 1);
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("Env check:");
console.log("  NEXT_PUBLIC_SUPABASE_URL:", url ? "set" : "MISSING");
console.log("  NEXT_PUBLIC_SUPABASE_ANON_KEY:", anon ? "set" : "MISSING");
console.log("  SUPABASE_SERVICE_ROLE_KEY:", service ? "set" : "MISSING");
console.log("  SUPABASE_DB_PASSWORD:", process.env.SUPABASE_DB_PASSWORD ? "set" : "MISSING");

if (!url || !anon) process.exit(1);

const sb = createClient(url, anon, { auth: { persistSession: false } });

const { data: profiles, error } = await sb.from("profiles").select("id, role, full_name, status").limit(1);
if (error) {
  console.log("\nProfiles query error:", error.message);
} else {
  const row = profiles?.[0];
  const hasFullName = row && "full_name" in row;
  const hasStatus = row && "status" in row;
  console.log("\nMigration 003 indicators:");
  console.log("  profiles.full_name column:", hasFullName ? "yes" : "unknown/missing");
  console.log("  profiles.status column:", hasStatus ? "yes" : "unknown/missing");
}

const { data: fnTest } = await sb.rpc("current_user_role").maybeSingle?.();
// rpc may not work without auth - skip

console.log("\nDone.");
