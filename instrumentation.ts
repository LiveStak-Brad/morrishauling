export async function register() {
  if (process.env.NEXT_PUBLIC_USE_SUPABASE === "true" && process.env.NODE_ENV === "production") {
    const { validateProductionEnv } = await import("@/lib/env/production");
    const status = validateProductionEnv();
    if (!status.ok) {
      console.error(
        "[Morris OS] Production environment misconfiguration:",
        status.errors.join("; ")
      );
    }
    if (status.warnings.length > 0) {
      console.warn("[Morris OS] Production warnings:", status.warnings.join("; "));
    }
  }
}
