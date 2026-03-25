import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";

const ServerErrorPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-red-600 mb-4">500</h1>
        <h2 className="text-2xl font-semibold mb-2">Server Error</h2>
        <p className="text-gray-600 mb-6">
          Something went wrong on our end. Please try again later.
        </p>
        <Button onClick={() => navigate("/")}>Go Home</Button>
      </div>
    </div>
  );
};

export default ServerErrorPage;
