import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Typography } from "@material-tailwind/react";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { AuthContainer } from "./AuthContainer";
import { useBreakpoint } from "../../hooks";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "../../lib/api";

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

const SigninPage: React.FC = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const isMobile = useBreakpoint("sm");
  const loginMutation = useMutation({
    mutationFn: (payload: { email: string; password: string }) =>
      authApi.login(payload),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormFields>({
    resolver: yupResolver(schema),
    defaultValues,
  });

  const onSubmit = async (values: LoginFormFields) => {
    setServerError(null);
    try {
      const data = await loginMutation.mutateAsync(values);
      localStorage.setItem("user", JSON.stringify((data as any).user));
      navigate("/my");
    } catch (err: any) {
      setServerError(err?.message || "Something went wrong");
    }
  };

  return (
    <AuthContainer>
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
        <Input
          {...register("email")}
          label="Email"
          type="email"
          error={!!errors.email}
          autoComplete="email"
          helperText={errors.email?.message}
        />

        <Input
          {...register("password")}
          label="Password"
          type="password"
          error={!!errors.password}
          autoComplete="current-password"
          helperText={errors.password?.message}
        />

        <Button
          type="submit"
          loading={isSubmitting || loginMutation.isPending}
          fullWidth={isMobile}
          className="md:min-w-40"
        >
          Sign in
        </Button>
      </form>

      <Typography variant="small" className="mt-4 text-gray-600">
        No account?{" "}
        <Link to="/signup" className="text-primary hover:text-primary/80">
          Create one
        </Link>
      </Typography>
    </AuthContainer>
  );
};

export { SigninPage };
