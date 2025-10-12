import { useEffect, useState } from "react";

// Returns the current visible viewport height in CSS pixels accounting for mobile browser UI.
export function useViewportHeight(): number | null {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    function read(): number {
      // Prefer VisualViewport height if available (handles PWA/iOS chrome/safari dynamic toolbars)
      const vv = (window as any).visualViewport as VisualViewport | undefined;
      if (vv && typeof vv.height === "number" && vv.height > 0) {
        return Math.round(vv.height);
      }
      // Fallback to innerHeight
      if (typeof window.innerHeight === "number" && window.innerHeight > 0) {
        return Math.round(window.innerHeight);
      }
      // As a last resort, use documentElement clientHeight
      return Math.round(document.documentElement.clientHeight || 0);
    }

    const setFromViewport = () => setHeight(read());

    setFromViewport();

    // Listen to relevant events; VisualViewport has its own resize/scroll events
    const vv = (window as any).visualViewport as VisualViewport | undefined;
    if (vv) {
      vv.addEventListener("resize", setFromViewport);
      vv.addEventListener("scroll", setFromViewport);
    }
    window.addEventListener("resize", setFromViewport);
    window.addEventListener("orientationchange", setFromViewport);

    return () => {
      if (vv) {
        vv.removeEventListener("resize", setFromViewport);
        vv.removeEventListener("scroll", setFromViewport);
      }
      window.removeEventListener("resize", setFromViewport);
      window.removeEventListener("orientationchange", setFromViewport);
    };
  }, []);

  return height;
}
