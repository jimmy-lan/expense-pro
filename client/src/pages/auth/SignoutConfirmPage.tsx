import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Typography } from "@material-tailwind/react";
import { Button } from "../../components/ui/Button";
import { useUserInfo } from "../../hooks";

const SignoutConfirmPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useUserInfo();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <Typography variant="paragraph" className="text-gray-900">
          Currently signing out of:
        </Typography>
        <Typography variant="h5" className="mt-2 font-bold text-gray-900">
          {user?.email || "..."}
        </Typography>
        <Typography variant="paragraph" className="mt-2 text-gray-700">
          Are you sure to proceed?
        </Typography>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            variant="outlined"
            color="primary"
            onClick={() =>
              navigate(decodeURIComponent(location.state?.returnTo || "/"))
            }
          >
            Back
          </Button>
          <Button color="primary" onClick={() => logout({ redirectTo: "/" })}>
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
};

export { SignoutConfirmPage };
