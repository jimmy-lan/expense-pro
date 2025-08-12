import React, { useEffect, useMemo, useState } from "react";
import { Typography, Spinner } from "@material-tailwind/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleXmark,
  faUserPlus,
  faArrowRight,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { StepsContainer, Step } from "../../components/StepsContainer";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { spacesApi, SpaceMemberDto } from "../../lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useUserInfo } from "../../hooks";

const steps = [
  { id: "name", title: "Name Your Space" },
  { id: "invite", title: "Invite Others" },
] as const;

type StepId = (typeof steps)[number]["id"];

interface CreateSpaceFields {
  name: string;
  description?: string;
}

const schema: yup.ObjectSchema<CreateSpaceFields> = yup.object({
  name: yup
    .string()
    .required("Space name is required")
    .min(2, "Minimum 2 characters")
    .max(80, "Maximum 80 characters"),
  description: yup.string().max(200, "Maximum 200 characters").optional(),
});

export const NewSpacePage: React.FC = () => {
  const [currentStepId, setCurrentStepId] = useState<StepId>("name");
  const [serverError, setServerError] = useState<string | null>(null);
  const [createdSpaceId, setCreatedSpaceId] = useState<number | null>(null);
  const navigate = useNavigate();
  const { user } = useUserInfo();

  const [nameStatus, setNameStatus] = useState<
    | { state: "idle" }
    | { state: "loading" }
    | { state: "available" }
    | { state: "unavailable"; message: string }
  >({ state: "idle" });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<CreateSpaceFields>({
    defaultValues: { name: "", description: "" },
    resolver: yupResolver(schema),
  });

  const nameValue = watch("name");

  // Debounced availability check
  useEffect(() => {
    let ignore = false;
    if (!nameValue || nameValue.trim().length === 0) {
      setNameStatus({ state: "idle" });
      clearErrors("name");
      return;
    }

    setNameStatus({ state: "loading" });

    const handler = setTimeout(async () => {
      try {
        const res = await spacesApi.checkName(nameValue.trim());
        if (ignore) return;
        if (res.available) {
          setNameStatus({ state: "available" });
          clearErrors("name");
        } else {
          setNameStatus({
            state: "unavailable",
            message: "Name already taken",
          });
          setError("name", { type: "manual", message: "Name already taken" });
        }
      } catch (e: any) {
        if (ignore) return;
        setNameStatus({
          state: "unavailable",
          message: e?.message || "Validation failed",
        });
        setError("name", {
          type: "manual",
          message: e?.message || "Validation failed",
        });
      }
    }, 350);

    return () => {
      ignore = true;
      clearTimeout(handler);
    };
  }, [nameValue, clearErrors, setError]);

  const endAdornment = useMemo(() => {
    if (nameStatus.state === "loading") return <Spinner className="h-4 w-4" />;
    if (nameStatus.state === "available")
      return (
        <FontAwesomeIcon icon={faCircleCheck} className="text-green-600" />
      );
    if (nameStatus.state === "unavailable")
      return <FontAwesomeIcon icon={faCircleXmark} className="text-red-600" />;
    return null;
  }, [nameStatus]);

  const onSubmit = async (values: CreateSpaceFields) => {
    setServerError(null);
    try {
      const res = await spacesApi.create({
        name: values.name.trim(),
        description: values.description?.trim() || null,
      });
      setCreatedSpaceId(res.space.id);
      setCurrentStepId("invite");
    } catch (err: any) {
      setServerError(err?.message || "Failed to create space");
    }
  };

  // Step 2 state and data
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    data: membersData,
    isLoading: membersLoading,
    error: membersError,
  } = useQuery({
    enabled: currentStepId === "invite" && !!createdSpaceId,
    queryKey: ["space-members", createdSpaceId],
    queryFn: () => spacesApi.members(createdSpaceId as number),
    refetchOnWindowFocus: true,
  });

  const validateInviteEmail = (email: string): string | null => {
    const trimmed = email.trim();
    if (!trimmed) return "Email is required";
    const re = /[^\s@]+@[^\s@]+\.[^\s@]+/;
    if (!re.test(trimmed)) return "Enter a valid email";
    return null;
  };

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const err = validateInviteEmail(inviteEmail);
      if (err) {
        setInviteError(err);
        throw new Error(err);
      }
      setInviteError(null);
      const email = inviteEmail.trim();
      return spacesApi.invite(createdSpaceId as number, email);
    },
    onSuccess: () => {
      setInviteEmail("");
      queryClient.invalidateQueries({
        queryKey: ["space-members", createdSpaceId],
      });
    },
    onError: (err: any) => {
      setInviteError(err?.message || "Failed to add member");
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (userId: number) => {
      return spacesApi.removeMember(createdSpaceId as number, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["space-members", createdSpaceId],
      });
    },
  });

  const currentUserId = (user as any)?.id as number | undefined;

  return (
    <StepsContainer steps={steps as any} currentStepId={currentStepId}>
      <Step stepId="name">
        <Typography variant="h3" className="mb-1 text-gray-900 font-bold">
          Name Your Space
        </Typography>
        <Typography variant="small" className="mb-6 text-gray-600">
          Choose a unique name for your space
        </Typography>

        {serverError && (
          <div className="bg-red-50 text-red-700 px-3 py-2 rounded mb-4 text-sm">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            {...register("name")}
            label="Space Name"
            error={!!errors.name}
            helperText={errors.name?.message}
            endAdornment={endAdornment}
            autoFocus
            required
          />

          <Input
            {...register("description")}
            label="Description"
            error={!!errors.description}
            helperText={errors.description?.message}
          />

          <Button
            type="submit"
            loading={isSubmitting}
            disabled={nameStatus.state === "loading"}
            className="md:min-w-40"
          >
            Create Space
          </Button>
        </form>
      </Step>

      <Step stepId="invite">
        <Typography variant="h3" className="mb-1 text-gray-900 font-bold">
          Invite Others
        </Typography>
        <Typography variant="small" className="mb-6 text-gray-600">
          Add initial members to your space
        </Typography>

        <Input
          label="Member Email"
          placeholder="name@example.com"
          type="email"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          onBlur={() => setInviteError(validateInviteEmail(inviteEmail))}
          helperText={inviteError || undefined}
          error={!!inviteError}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              inviteMutation.mutate();
            }
          }}
          endAdornment={
            <Button
              onClick={() => inviteMutation.mutate()}
              loading={inviteMutation.isPending}
              color="secondary"
              variant="text"
              size="sm"
            >
              <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
              Invite
            </Button>
          }
        />

        <div className="mt-6">
          <Typography
            variant="small"
            className="text-gray-700 font-semibold mb-2"
          >
            Members
          </Typography>

          {membersLoading ? (
            <div className="py-6 text-center text-gray-500">
              <Spinner className="h-5 w-5 inline-block mr-2" /> Loading
              members...
            </div>
          ) : membersError ? (
            <div className="py-4 text-red-600 text-sm">
              Failed to load members
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
              {(membersData?.members || []).map((m: SpaceMemberDto) => (
                <li key={m.id} className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">
                        {m.firstName} {m.lastName}
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        {m.email}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={
                          m.role === "admin"
                            ? "rounded px-1.5 py-0.5 text-xs font-medium bg-primary/10 text-primary"
                            : "rounded px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800"
                        }
                      >
                        {m.role.charAt(0).toUpperCase() + m.role.slice(1)}
                      </span>
                      {currentUserId && m.id !== currentUserId ? (
                        <Button
                          variant="text"
                          color="red"
                          size="sm"
                          onClick={() => removeMutation.mutate(m.id)}
                        >
                          <FontAwesomeIcon icon={faTrashCan} />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            variant="filled"
            color="primary"
            className="md:min-w-40"
            onClick={() => {
              navigate("/my");
            }}
          >
            Finish
            <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
          </Button>
        </div>
      </Step>
    </StepsContainer>
  );
};
