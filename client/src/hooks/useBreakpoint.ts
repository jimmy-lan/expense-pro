import { useEffect, useMemo, useState } from "react";

// Tailwind CSS default breakpoints (Material Tailwind uses Tailwind under the hood)
// https://tailwindcss.com/docs/responsive-design
const TAILWIND_BREAKPOINTS = {
  sm: 540,
  md: 720,
  lg: 960,
  xl: 1140,
  "2xl": 1320,
} as const;

export type Breakpoint = keyof typeof TAILWIND_BREAKPOINTS; // "sm" | "md" | "lg" | "xl" | "2xl"
export type Direction = "up" | "down"; // inclusive

function getNextBreakpointValue(target: Breakpoint): number | undefined {
  const entries = Object.entries(TAILWIND_BREAKPOINTS) as Array<
    [Breakpoint, number]
  >;
  const index = entries.findIndex(([key]) => key === target);
  if (index === -1) return undefined;
  const next = entries[index + 1];
  return next?.[1];
}

export function useBreakpoint(
  target: Breakpoint,
  direction: Direction = "down"
): boolean {
  const [viewportWidth, setViewportWidth] = useState<number | null>(
    typeof window === "undefined" ? null : window.innerWidth
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    // Initialize on mount in case SSR provided null
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const result = useMemo(() => {
    if (viewportWidth == null) return false; // SSR fallback until mounted

    const min = TAILWIND_BREAKPOINTS[target];

    if (direction === "up") {
      // Inclusive: target and up
      return viewportWidth >= min;
    }

    // direction === "down": Inclusive: target and down (<= next - 1)
    const next = getNextBreakpointValue(target);
    if (next == null) {
      // No upper bound for highest breakpoint ("2xl" and down is everything)
      return true;
    }

    return viewportWidth < next; // strictly less than next breakpoint value
  }, [viewportWidth, target, direction]);

  return result;
}
