import { createContext, useContext, type RefObject } from "react";

/**
 * The landing page scrolls inside its own `.landing-scroll` element (the body is
 * `overflow:hidden`), so every scroll-linked animation must read from that
 * container rather than the window. This context hands the container ref down to
 * the scenes that drive motion off scroll position.
 */
export const ScrollContainerContext = createContext<RefObject<HTMLElement | null> | null>(null);

export function useScrollContainer() {
  return useContext(ScrollContainerContext);
}
