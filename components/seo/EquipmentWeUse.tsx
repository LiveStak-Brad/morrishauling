import { listPublicOwnedEquipment } from "@/lib/equipment/public-fleet";

export async function EquipmentWeUse() {
  const items = await listPublicOwnedEquipment();
  if (items.length === 0) return null;
  return (
    <section className="mt-14">
      <h2 className="font-heading text-2xl font-medium">Equipment we use</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        The result on the property comes first. These are machines we currently own and choose to
        show.
      </p>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-2xl border border-black/5 bg-white p-4">
            <p className="font-semibold">{item.name}</p>
            {item.notes ? <p className="mt-1 text-sm text-muted-foreground">{item.notes}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
