import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Typography } from "@material-tailwind/react";

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="text-center">
        <Typography variant="h3" className="font-bold text-gray-900 mb-2">
          Share Expenses App
        </Typography>
        <Typography variant="small" className="text-gray-600">
          Welcome to your expense sharing application
        </Typography>
        <div className="flex gap-3 justify-center mt-6">
          <Button onClick={() => navigate("/login")}>Login</Button>
          <Button color="gray" onClick={() => navigate("/signup")}>
            Sign up
          </Button>
        </div>
      </div>
    </div>
  );
};

export { HomePage };
