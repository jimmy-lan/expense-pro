import { useEffect } from "react";

export function useScrollTopOnMount(): void {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      typeof window.scrollTo === "function"
    ) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, []);
}
