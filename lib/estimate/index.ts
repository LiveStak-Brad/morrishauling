import type { ServiceType } from "@/types/hauling";
import type { CompanyConfig } from "@/types";
import {
  junkRemovalEngine,
  type JunkRemovalEstimateInput,
  type JunkRemovalEstimateResult,
} from "./junk-removal-engine";
import {
  haulingTransportEngine,
  type HaulingEstimateInput,
  type HaulingEstimateResult,
} from "./hauling-transport-engine";
import type { MorrisConfig } from "@/lib/morris-config";

export function getEstimateEngine(serviceType: ServiceType) {
  if (serviceType === "hauling_transport") return haulingTransportEngine;
  return junkRemovalEngine;
}

export function calculateEstimate(
  serviceType: ServiceType,
  input: JunkRemovalEstimateInput | HaulingEstimateInput,
  company: CompanyConfig | MorrisConfig
): JunkRemovalEstimateResult | HaulingEstimateResult {
  if (serviceType === "hauling_transport") {
    return haulingTransportEngine.calculate(input as HaulingEstimateInput, company as MorrisConfig);
  }
  return junkRemovalEngine.calculate(input as JunkRemovalEstimateInput, company as MorrisConfig);
}

export * from "./junk-removal-engine";
export * from "./hauling-transport-engine";
