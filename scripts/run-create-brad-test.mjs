import { readFileSync, existsSync } from "fs";

const envPath = ".env.local";
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i > 0 && !process.env[t.slice(0, i)]) process.env[t.slice(0, i)] = t.slice(i + 1);
  }
}

const { createBradTestEmployee } = await import("../lib/db/hr/create-test-employee.ts");
const result = await createBradTestEmployee();
console.log("OK:", JSON.stringify(result, null, 2));
