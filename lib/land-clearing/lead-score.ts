/** Internal informational score only. Never shown to customers. Never used to reject a lead. */

export function landClearingLeadCompletenessScore(intake: Record<string, unknown>): number {
  let score = 0;
  const address = String(intake.address ?? "").trim();
  const city = String(intake.city ?? "").trim();
  const zip = String(intake.zip ?? "").trim();
  if (address.length >= 5) score += 15;
  if (city) score += 8;
  if (zip.length >= 5) score += 7;

  const acres = Number(intake.acreage ?? intake.calculatedAcres);
  if (Number.isFinite(acres) && acres > 0) score += 12;
  if (intake.acreageSource === "map_calculated") score += 6;

  if (intake.projectGoal) score += 12;
  if (Array.isArray(intake.vegetation) && intake.vegetation.length > 0) score += 8;
  if (intake.density && intake.density !== "unsure") score += 6;
  if (intake.keepVegetation) score += 6;
  if (intake.propertyEndUse) score += 5;

  const access = (intake.access ?? {}) as Record<string, unknown>;
  if (access.drivewayNotes || access.gateWidthFt || access.otherObstacles) score += 7;

  const mediaCount = Number(intake.mediaCount ?? 0);
  if (mediaCount > 0) score += 8;
  if (mediaCount >= 3) score += 4;

  if (intake.scheduling) score += 4;
  return Math.min(100, score);
}
