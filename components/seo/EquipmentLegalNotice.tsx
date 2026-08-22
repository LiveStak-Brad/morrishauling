import { EQUIPMENT_LEGAL_POINTS, EQUIPMENT_PRELAUNCH_NOTE } from "@/lib/equipment/legal";

export function EquipmentLegalNotice({ className }: { className?: string }) {
  return (
    <section className={className}>
      <h2 className="font-heading text-2xl font-medium">Before we work a property</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{EQUIPMENT_PRELAUNCH_NOTE}</p>
      <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
        {EQUIPMENT_LEGAL_POINTS.map((point) => (
          <li key={point.slice(0, 48)}>• {point}</li>
        ))}
      </ul>
    </section>
  );
}
