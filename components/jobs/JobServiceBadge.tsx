import type { ServiceType } from "@/types/hauling";
import { SERVICE_TYPE_LABELS } from "@/types/hauling";
import { StatusChip } from "@/components/morris/StatusChip";

export function JobServiceBadge({ serviceType }: { serviceType: ServiceType }) {
  return (
    <StatusChip
      label={SERVICE_TYPE_LABELS[serviceType]}
      variant={serviceType === "hauling_transport" ? "info" : "neutral"}
      className="text-[10px]"
    />
  );
}
