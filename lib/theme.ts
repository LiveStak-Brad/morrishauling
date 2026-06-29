import type { BrandColors } from "@/types";

export function applyBrandTheme(colors: BrandColors) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--brand-primary", colors.primary);
  root.style.setProperty("--brand-secondary", colors.secondary);
  root.style.setProperty("--brand-accent", colors.accent);
  root.style.setProperty("--brand-background", colors.background);
  root.style.setProperty("--brand-foreground", colors.foreground);
}

export const brandColorVars = {
  primary: "var(--brand-primary)",
  secondary: "var(--brand-secondary)",
  accent: "var(--brand-accent)",
  background: "var(--brand-background)",
  foreground: "var(--brand-foreground)",
};
