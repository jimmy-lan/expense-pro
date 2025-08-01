import React from "react";

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
      </div>
    </div>
  );
};

export { HomePage };
