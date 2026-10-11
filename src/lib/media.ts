import { useSyncExternalStore } from "react";

/** True while the media query matches; false on the server. */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    change => {
      const list = matchMedia(query);
      list.addEventListener("change", change);
      return () => list.removeEventListener("change", change);
    },
    () => matchMedia(query).matches,
    () => false,
  );
}

export const PHONE = "(max-width: 767px)";
