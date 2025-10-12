import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

/**
 * ProtectedRoute is a layout guard that ensures the user is authenticated
 * before rendering nested routes. It checks localStorage immediately to avoid
 * unnecessary API calls when signed out.
 */
export const ProtectedRoute: React.FC = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      const hasUser = Boolean(userStr && JSON.parse(userStr));
      setIsAuthenticated(hasUser);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  if (isChecking) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
