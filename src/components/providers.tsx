"use client";

import { Toaster } from "sonner";

export function Providers() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        className:
          "rounded-2xl border border-white/60 bg-white text-slate-900 shadow-xl",
      }}
    />
  );
}
