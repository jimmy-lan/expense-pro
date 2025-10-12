import React, { useEffect, useState } from "react";
import { Typography, Spinner } from "@material-tailwind/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { spacesApi, type SpaceMemberDto } from "../../lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUserInfo } from "../../hooks";

interface ManageProps {
  spaceId: number;
}

export const Manage: React.FC<ManageProps> = ({ spaceId }) => {
  const { user } = useUserInfo();
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);

  const isValidSpaceId = Number.isFinite(spaceId) && spaceId > 0;

  const {
    data: membersData,
    isLoading: membersLoading,
    isError: membersIsError,
    error: membersError,
  } = useQuery({
    enabled: isValidSpaceId,
    queryKey: ["space-members", spaceId],
    queryFn: () => spacesApi.members(spaceId),
  });

  const members: SpaceMemberDto[] = membersData?.members ?? [];
  const rawUserId = user && "id" in user ? (user as { id?: number | string }).id : undefined;
  const currentUserId =
    typeof rawUserId === "number"
      ? rawUserId
      : typeof rawUserId === "string"
      ? Number(rawUserId)
      : undefined;
  const currentMember = members.find((member) =>
    currentUserId ? member.id === currentUserId : false
  );
  const canManageMembers = currentMember?.role === "admin";

  useEffect(() => {
    if (!inviteMessage) return;
    const timer = setTimeout(() => setInviteMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [inviteMessage]);

  const validateInviteEmail = (email: string): string | null => {
    const trimmed = email.trim();
    if (!trimmed) return "Email is required";
    const re = /[^\s@]+@[^\s@]+\.[^\s@]+/;
    return re.test(trimmed) ? null : "Enter a valid email";
  };

  const inviteMutation = useMutation({
    mutationFn: async () => {
      if (!canManageMembers) {
        throw new Error("Only admins can invite members");
      }
      const validationError = validateInviteEmail(inviteEmail);
      if (validationError) {
        setInviteError(validationError);
        throw new Error(validationError);
      }
      setInviteError(null);
      const response = await spacesApi.invite(spaceId, inviteEmail.trim());
      return response;
    },
    onSuccess: (response) => {
      setInviteEmail("");
      setInviteMessage(response?.message || "Invitation sent");
      queryClient.invalidateQueries({ queryKey: ["space-members", spaceId] });
    },
    onError: (err: any) => {
      setInviteMessage(null);
      setInviteError(err?.message || "Failed to invite member");
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (userId: number) => {
      if (!canManageMembers) {
        throw new Error("Only admins can remove members");
      }
      return spacesApi.removeMember(spaceId, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["space-members", spaceId] });
    },
  });

  if (!isValidSpaceId) {
    return (
      <div className="text-gray-600">
        Select a space to manage members.
      </div>
    );
  }

  const helperText =
    inviteError ??
    (!canManageMembers
      ? "Only admins can invite new members"
      : inviteMessage || undefined);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Typography variant="h4" className="font-semibold text-gray-900">
          Manage Members
        </Typography>
        <Typography variant="small" className="text-gray-600 mt-2">
          Invite teammates to collaborate in this space and review existing
          members.
        </Typography>
      </div>

      <div className="space-y-3">
        <Input
          label="Member Email"
          placeholder="name@example.com"
          type="email"
          value={inviteEmail}
          disabled={!canManageMembers}
          onChange={(e) => {
            setInviteEmail(e.target.value);
            if (inviteError) setInviteError(null);
          }}
          onBlur={() => setInviteError(validateInviteEmail(inviteEmail) ?? null)}
          helperText={helperText}
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
              disabled={!canManageMembers}
            >
              <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
              Invite
            </Button>
          }
        />
      </div>

      <div>
        <Typography
          variant="small"
          className="text-gray-700 font-semibold mb-2"
        >
          Members
        </Typography>

        {membersLoading ? (
          <div className="py-8 text-center text-gray-500">
            <Spinner className="h-5 w-5 inline-block mr-2" /> Loading members...
          </div>
        ) : membersIsError ? (
          <div className="py-4 text-red-600 text-sm">
            {(membersError as any)?.message || "Failed to load members"}
          </div>
        ) : members.length === 0 ? (
          <div className="py-6 text-gray-600 border border-dashed border-gray-300 rounded-lg text-center">
            No members yet. Invite someone to get started.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
            {members.map((member) => (
              <li key={member.id} className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">
                      {member.firstName} {member.lastName}
                    </div>
                    <div className="text-xs text-gray-600 truncate">
                      {member.email}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={
                        member.role === "admin"
                          ? "rounded px-1.5 py-0.5 text-xs font-medium bg-primary/10 text-primary"
                          : "rounded px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800"
                      }
                    >
                      {member.role.charAt(0).toUpperCase() +
                        member.role.slice(1)}
                    </span>
                    {canManageMembers && member.id !== currentUserId ? (
                      <Button
                        variant="text"
                        color="red"
                        size="sm"
                        onClick={() => removeMutation.mutate(member.id)}
                        loading={removeMutation.isPending}
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
    </div>
  );
};
