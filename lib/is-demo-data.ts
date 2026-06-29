/** Explicit opt-in for demo seed data in any environment. */
export function isDemoDataExplicitlyEnabled(): boolean {
  return process.env.DEMO_DATA === "true";
}

/**
 * True when demo/mock operational seed data is allowed.
 * Only enabled when DEMO_DATA=true — dev mode alone does not enable fake data.
 */
export function isDemoDataEnabled(): boolean {
  return process.env.DEMO_DATA === "true";
}
