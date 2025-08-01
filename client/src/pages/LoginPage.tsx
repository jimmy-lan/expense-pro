import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Typography, Input, Button } from "@material-tailwind/react";
import authPic from "../assets/images/auth-pic.jpg";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Login failed");
      }
      const data = await res.json();
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white grid grid-cols-1 md:grid-cols-2">
      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <Typography variant="h3" className="mb-1 text-gray-900 font-bold">
            Sign in
          </Typography>
          <Typography variant="small" className="mb-6 text-gray-600">
            Welcome back
          </Typography>

          {error && (
            <div className="bg-red-50 text-red-700 px-3 py-2 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
              required
              crossOrigin={undefined}
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) =>
                setPassword((e.target as HTMLInputElement).value)
              }
              required
              crossOrigin={undefined}
            />
            <Button type="submit" disabled={isLoading} fullWidth>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <Typography variant="small" className="mt-4 text-gray-600">
            No account?{" "}
            <Link to="/signup" className="text-blue-600">
              Create one
            </Link>
          </Typography>
        </div>
      </div>

      <div className="hidden md:block">
        <img
          src={authPic}
          alt="Sign in illustration"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export { LoginPage };
