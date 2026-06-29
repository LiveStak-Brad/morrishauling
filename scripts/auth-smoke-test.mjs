/**
 * Quick auth smoke test against local dev server.
 * Usage: node scripts/auth-smoke-test.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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

const base = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const email = `smoke.${Date.now()}@yahoo.com`;
const password = "TestPass123!";

console.log("Health check...");
const health = await fetch(`${base}/api/health/supabase`);
const healthJson = await health.json();
console.log("  ok:", healthJson.ok, "tablesReady:", healthJson.tablesReady);

console.log("Register customer:", email);
const reg = await fetch(`${base}/api/auth/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email,
    password,
    fullName: "Smoke Test Customer",
    phone: "6365551234",
  }),
});
const regJson = await reg.json();
console.log("  status:", reg.status, regJson);

if (!regJson.ok) process.exit(1);

console.log("Smoke test passed.");
