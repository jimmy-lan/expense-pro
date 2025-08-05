import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Typography } from "@material-tailwind/react";
import { Button } from "../components/ui/Button";

interface StoredUser {
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const parsed: StoredUser = JSON.parse(raw);
        setUser(parsed);
      }
    } catch (_) {
      setUser(null);
    }
  }, []);

  const handleSignOut = async () => {
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
      navigate("/");
    }
  };

  const firstName = user?.first_name || user?.firstName || "";
  const lastName = user?.last_name || user?.lastName || "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="text-center">
        <Typography variant="h3" className="font-bold text-gray-900 mb-2">
          Share Expenses App
        </Typography>
        {!user ? (
          <>
            <Typography variant="small" className="text-gray-600">
              Welcome to your expense sharing application
            </Typography>
            <div className="flex gap-3 justify-center mt-6">
              <Button onClick={() => navigate("/signup")}>Sign up</Button>
              <Button variant="outlined" onClick={() => navigate("/login")}>
                Sign in
              </Button>
            </div>
          </>
        ) : (
          <>
            <Typography variant="small" className="text-gray-600">
              Signed in as
            </Typography>
            <Typography
              variant="h5"
              className="mt-1 text-gray-900 font-semibold"
            >
              {`${firstName} ${lastName}`.trim()}
            </Typography>
            {user.email && (
              <Typography variant="small" className="text-gray-600 mt-1">
                {user.email}
              </Typography>
            )}
            <div className="flex gap-3 justify-center mt-6">
              <Button onClick={() => navigate("/my")}>My spaces</Button>
              <Button variant="outlined" onClick={handleSignOut}>
                Sign out
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export { HomePage };
