import { createAdminClient } from "@/lib/supabase/admin";
import { MORRIS_COMPANY_ID } from "@/lib/morris-config";

export type PublicFleetItem = {
  id: string;
  name: string;
  notes: string | null;
};

export function isPublicOwnedAsset(row: {
  ownership_status?: string | null;
  publicly_visible?: boolean | null;
}): boolean {
  return row.ownership_status === "owned" && row.publicly_visible === true;
}

/** Only owned, publicly visible assets. Empty until an admin marks both flags. */
export async function listPublicOwnedEquipment(): Promise<PublicFleetItem[]> {
  const sb = createAdminClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("equipment_assets")
    .select("id, name, notes, ownership_status, publicly_visible")
    .eq("company_id", MORRIS_COMPANY_ID)
    .eq("ownership_status", "owned")
    .eq("publicly_visible", true);
  if (error || !data) return [];
  return data
    .filter((r) =>
      isPublicOwnedAsset({
        ownership_status: r.ownership_status as string | null,
        publicly_visible: r.publicly_visible as boolean | null,
      })
    )
    .map((r) => ({
      id: String(r.id),
      name: String(r.name ?? "Equipment"),
      notes: (r.notes as string) ?? null,
    }));
}
