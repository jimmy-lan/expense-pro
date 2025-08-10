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

interface SignupFormFields {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

const schema: yup.ObjectSchema<SignupFormFields> = yup.object({
  firstName: yup.string().required("First name is required"),
  lastName: yup.string().required("Last name is required"),
  email: yup
    .string()
    .email("Enter a valid email")
    .required("Email is required"),
  password: yup
    .string()
    .min(6, "Min 6 characters")
    .required("Password is required"),
  passwordConfirmation: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Confirm your password"),
});

const defaultValues: SignupFormFields = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  passwordConfirmation: "",
};

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const isMobile = useBreakpoint("sm");
  const signupMutation = useMutation({
    mutationFn: (payload: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      passwordConfirmation: string;
    }) => authApi.signup(payload),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormFields>({
    resolver: yupResolver(schema),
    defaultValues,
  });

  const onSubmit = async (values: SignupFormFields) => {
    setServerError(null);
    try {
      const data = await signupMutation.mutateAsync(values);
      localStorage.setItem("user", JSON.stringify((data as any).user));
      navigate("/");
    } catch (err: any) {
      setServerError(err?.message || "Something went wrong");
    }
  };

  return (
    <AuthContainer>
      <Typography variant="h3" className="mb-1 text-gray-900 font-bold">
        Create account
      </Typography>
      <Typography variant="small" className="mb-6 text-gray-600">
        Join and start sharing expenses
      </Typography>

      {serverError && (
        <div className="bg-red-50 text-red-700 px-3 py-2 rounded mb-4 text-sm">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Input
              {...register("firstName")}
              label="First name"
              error={!!errors.firstName}
              autoComplete="given-name"
              helperText={errors.firstName?.message}
            />
          </div>

          <div>
            <Input
              {...register("lastName")}
              label="Last name"
              error={!!errors.lastName}
              autoComplete="family-name"
              helperText={errors.lastName?.message}
            />
          </div>

          <div>
            <Input
              {...register("email")}
              label="Email"
              type="email"
              error={!!errors.email}
              autoComplete="email"
              helperText={errors.email?.message}
            />
          </div>

          <div>
            <Input
              {...register("password")}
              label="Password"
              type="password"
              error={!!errors.password}
              autoComplete="new-password"
              helperText={errors.password?.message}
            />
          </div>

          <div>
            <Input
              {...register("passwordConfirmation")}
              label="Confirm password"
              type="password"
              error={!!errors.passwordConfirmation}
              autoComplete="new-password"
              helperText={errors.passwordConfirmation?.message}
            />
          </div>
        </div>

        <Button
          type="submit"
          loading={isSubmitting || signupMutation.isPending}
          fullWidth={isMobile}
          className="md:min-w-40"
        >
          Create account
        </Button>
      </form>

      <Typography variant="small" className="mt-4 text-gray-600">
        Already have an account?{" "}
        <Link to="/login" className="text-primary hover:text-primary/80">
          Sign in
        </Link>
      </Typography>
    </AuthContainer>
  );
};

export { SignupPage };
