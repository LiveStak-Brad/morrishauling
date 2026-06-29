/**
 * Repair Brad test user auth identity (required for Supabase email login).
 * Usage: node scripts/repair-brad-test-user.mjs
 */
import { readFileSync, existsSync } from "fs";
import { createAuthUserViaPg } from "../lib/db/pg-admin.ts";

const envPath = ".env.local";
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i > 0 && !process.env[t.slice(0, i)]) process.env[t.slice(0, i)] = t.slice(i + 1);
  }
}

const result = await createAuthUserViaPg({
  email: "bradmorrismma@gmail.com",
  password: "Test123!",
  fullName: "Brad Test Employee",
});
console.log("Repaired auth user:", result.userId, result.created ? "(created)" : "(synced)");
