import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Typography, Input } from "@material-tailwind/react";
import { Button } from "../components/ui/Button";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import authPic from "../assets/images/auth-pic.jpg";
import { Logo } from "../components/Logo";

interface LoginFormFields {
  email: string;
  password: string;
}

const schema: yup.ObjectSchema<LoginFormFields> = yup.object({
  email: yup
    .string()
    .email("Enter a valid email")
    .required("Email is required"),
  password: yup
    .string()
    .min(6, "Min 6 characters")
    .required("Password is required"),
});

const defaultValues: LoginFormFields = {
  email: "",
  password: "",
};

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormFields>({
    resolver: yupResolver(schema),
    defaultValues,
  });

  const onSubmit = async (values: LoginFormFields) => {
    setServerError(null);
    try {
      const res = await fetch("/api/v1/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Login failed");
      }
      const data = await res.json();
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/");
    } catch (err: any) {
      setServerError(err.message || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-white grid grid-cols-1 md:grid-cols-5">
      <div className="absolute top-6 left-6 z-10 p-0">
        <Logo />
      </div>

      <div className="flex items-center justify-center p-6 pt-0 md:pt-6 md:p-10 md:overflow-y-auto md:h-screen md:col-span-3">
        <div className="w-full max-w-md">
          <Typography variant="h3" className="mb-1 text-gray-900 font-bold">
            Sign in
          </Typography>
          <Typography variant="small" className="mb-6 text-gray-600">
            Welcome back
          </Typography>

          {serverError && (
            <div className="bg-red-50 text-red-700 px-3 py-2 rounded mb-4 text-sm">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    label="Email"
                    type="email"
                    error={!!errors.email}
                    autoComplete="email"
                  />
                )}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    label="Password"
                    type="password"
                    error={!!errors.password}
                    autoComplete="current-password"
                  />
                )}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting} fullWidth>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <Typography variant="small" className="mt-4 text-gray-600">
            No account?{" "}
            <Link to="/signup" className="text-primary hover:text-primary/80">
              Create one
            </Link>
          </Typography>
        </div>
      </div>

      <div className="hidden md:block md:col-span-2">
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
