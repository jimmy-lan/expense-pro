import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export interface StoredUser {
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

type LogoutOptions = {
  redirectTo?: string | null; // null disables navigation
};

export function useUserInfo() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const navigate = useNavigate();

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        setUser(JSON.parse(raw));
      } else {
        setUser(null);
      }
    } catch (_) {
      setUser(null);
    }
  }, []);

  // Keep in sync across tabs/windows
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "user") {
        try {
          setUser(e.newValue ? JSON.parse(e.newValue) : null);
        } catch (_) {
          setUser(null);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const logout = useCallback(
    async (options?: LogoutOptions) => {
      const redirectTo =
        options?.redirectTo === undefined ? "/" : options.redirectTo;
      try {
        await fetch("/api/v1/logout", {
          method: "DELETE",
          credentials: "include",
        });
      } catch (_) {
        // ignore network errors; proceed to clear local state
      } finally {
        localStorage.removeItem("user");
        setUser(null);
        if (redirectTo !== null) {
          navigate(redirectTo);
        }
      }
    },
    [navigate]
  );

  return { user, logout };
}
