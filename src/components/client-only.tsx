"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** Renders children only in the browser, after hydration, so they can read localStorage while rendering. */
export function ClientOnly({ children }: { children: React.ReactNode }) {
  const inBrowser = useSyncExternalStore(subscribe, () => true, () => false);
  return inBrowser ? children : null;
}
