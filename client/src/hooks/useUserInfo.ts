import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../lib/api";
import { useQueryClient } from "@tanstack/react-query";

export type StoredUser = Record<string, any> | null;

export type LogoutOptions = {
  redirectTo?: string | null; // null disables navigation
};

export function useUserInfo() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
        await authApi.logout();
      } catch (_) {
        // ignore network errors; proceed to clear local state
      } finally {
        try {
          await queryClient.cancelQueries();
        } catch (_) {}
        queryClient.clear();
        localStorage.removeItem("user");
        setUser(null);
        if (redirectTo !== null) {
          navigate(redirectTo);
        }
      }
    },
    [navigate, queryClient]
  );

  return { user, logout };
}
