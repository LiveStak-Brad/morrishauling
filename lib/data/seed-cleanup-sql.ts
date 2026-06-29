import { MOCK_ID_PREFIXES } from "@/lib/data/real-record-filter";

/** Safe read-only cleanup SQL for seed/demo rows (manual execution in Supabase SQL editor). */
export function buildSeedCleanupSql(companyId = "morris-hauling"): string {
  const likeClauses = MOCK_ID_PREFIXES.map((p) => `id LIKE '${p}%'`).join("\n    OR ");
  const entityLike = MOCK_ID_PREFIXES.map((p) => `entity_id LIKE '${p}%'`).join("\n    OR ");

  return `-- Morris OS seed/demo cleanup (review before running)
-- Company: ${companyId}
-- Deletes rows with mock seed id prefixes. Does NOT auto-run from the app.

BEGIN;

DELETE FROM activity_log
WHERE company_id = '${companyId}'
  AND (
    ${entityLike}
    OR message ILIKE '%estate cleanout%'
    OR message ILIKE '%99 Test%'
    OR message ILIKE '%job-m%'
  );

DELETE FROM route_stops WHERE route_id IN (
  SELECT id FROM routes WHERE company_id = '${companyId}' AND (${MOCK_ID_PREFIXES.map((p) => `id LIKE '${p}%'`).join(" OR ")})
);
DELETE FROM routes WHERE company_id = '${companyId}' AND (${MOCK_ID_PREFIXES.filter((p) => p.startsWith("route")).map((p) => `id LIKE '${p}%'`).join(" OR ") || "FALSE"});

DELETE FROM payments WHERE company_id = '${companyId}' AND (${likeClauses});
DELETE FROM invoices WHERE company_id = '${companyId}' AND (${likeClauses});
DELETE FROM financing_requests WHERE company_id = '${companyId}' AND (${MOCK_ID_PREFIXES.filter((p) => p.startsWith("fin")).map((p) => `id LIKE '${p}%'`).join(" OR ")});
DELETE FROM jobs WHERE company_id = '${companyId}' AND (${likeClauses});
DELETE FROM customers WHERE company_id = '${companyId}' AND (${likeClauses});

-- Optional: remove config-mirror employees only if you are sure they are seed rows
-- DELETE FROM employees WHERE company_id = '${companyId}' AND (${MOCK_ID_PREFIXES.filter((p) => p.startsWith("emp")).map((p) => `id LIKE '${p}%'`).join(" OR ")});

COMMIT;
`;
}
