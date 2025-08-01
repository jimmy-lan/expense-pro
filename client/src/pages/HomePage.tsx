import React from "react";
import { Link } from "react-router-dom";

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 text-center m-4">
          Share Expenses App
        </h1>
        <p className="text-lg text-gray-600 text-center">
          Welcome to your expense sharing application
        </p>
        <div className="flex gap-3 justify-center mt-6">
          <Link
            to="/login"
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 bg-gray-900 text-white rounded"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};

export { HomePage };
