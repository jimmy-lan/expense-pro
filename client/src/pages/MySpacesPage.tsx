import React from "react";
import { Typography } from "@material-tailwind/react";
import { Button } from "../components/ui/Button";
import { useNavigate } from "react-router-dom";

const MySpacesPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="text-center">
        <Typography variant="h4" className="font-bold text-gray-900 mb-2">
          My Spaces
        </Typography>
        <Typography variant="small" className="text-gray-600">
          This is a placeholder for your spaces.
        </Typography>
        <div className="flex justify-center mt-6">
          <Button onClick={() => navigate("/")}>Back home</Button>
        </div>
      </div>
    </div>
  );
};

export { MySpacesPage };
