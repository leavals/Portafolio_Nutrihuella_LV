"use client";

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export function smartClose(router: AppRouterInstance, fallback: string = "/") {
  try {
    if (typeof window !== "undefined") {
      const state: any = window.history.state ?? {};
      const idx = typeof state.idx === "number" ? state.idx : 0;
      const hasHistory = window.history.length > 1 && idx > 0;

      // Solo usa back() si venimos de la misma origin
      const sameOriginRef =
        document.referrer &&
        new URL(document.referrer).origin === window.location.origin;

      if (hasHistory && sameOriginRef) {
        router.back();
        return;
      }
    }
  } catch (_e) {
    // ignore
  }
  router.replace(fallback);
}
