export async function saveCompanySetting(key: string, value: unknown): Promise<void> {
  const res = await fetch("/api/admin/company-settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error ?? "Save failed");
}
