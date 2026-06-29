export function useSupabaseData(): boolean {
  return process.env.NEXT_PUBLIC_USE_SUPABASE === "true";
}

export function dataSourceLabel(): "supabase" | "mock" {
  return useSupabaseData() ? "supabase" : "mock";
}
