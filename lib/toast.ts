type ToastType = "success" | "error" | "info";

export function showToast(message: string, type: ToastType = "info") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("morris:toast", { detail: { message, type } })
  );
}

export const toast = {
  success: (message: string) => showToast(message, "success"),
  error: (message: string) => showToast(message, "error"),
  info: (message: string) => showToast(message, "info"),
};
