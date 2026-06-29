/** @deprecated Import from `@/lib/estimate` */
export {
  junkRemovalEngine as estimateEngine,
  junkRemovalEngine as default,
  type JunkRemovalEstimateInput as EstimateInput,
  type JunkRemovalEstimateResult as EstimateResult,
} from "./estimate/junk-removal-engine";

export { junkRemovalEngine, haulingTransportEngine, getEstimateEngine, calculateEstimate } from "./estimate";
