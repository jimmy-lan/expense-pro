import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppNavbar } from "../../components/AppNavbar";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { spacesApi, ApiError } from "../../lib/api";
import { useScrollTopOnMount } from "../../hooks";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface PendingDeleteSpace {
  id: number;
  name: string;
}

export const DeleteSpacesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const stateSpaces: PendingDeleteSpace[] =
    (location.state as any)?.spaces || [];

  useScrollTopOnMount();

  const [confirmText, setConfirmText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const canSubmit = useMemo(
    () => confirmText.trim().toLowerCase() === "delete",
    [confirmText]
  );

  const mutation = useMutation({
    mutationFn: async () => spacesApi.bulkDelete(stateSpaces.map((s) => s.id)),
    onMutate: () => {
      setErrorMessage(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spaces"] });
      navigate(
        (location.state as any)?.tab
          ? `/my?tab=${encodeURIComponent((location.state as any).tab)}`
          : "/my"
      );
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 401) {
        navigate("/login");
        return;
      }
      setErrorMessage((err as any)?.message || "Failed to delete spaces");
    },
  });

  return (
    <div className="min-h-screen-safe bg-gray-50">
      <AppNavbar />
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">Delete Spaces</h1>
        <p className="mb-4 text-gray-700">
          You are about to delete the following spaces. This action is
          reversible only until the purge deadline defined by your plan.
        </p>

        {errorMessage && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
          <ul className="list-disc pl-5 text-gray-900">
            {stateSpaces.map((s) => (
              <li key={s.id} className="py-1">
                {s.name}
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-4">
          <Input
            label="Type 'delete' to confirm"
            crossOrigin={undefined}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="delete"
          />
        </div>

        <div className="flex justify-between gap-3 mt-6">
          <Button
            color="red"
            onClick={() => mutation.mutate()}
            disabled={!canSubmit}
            loading={mutation.isPending}
          >
            {!mutation.isPending && (
              <FontAwesomeIcon icon={faTrash} className="mr-2" />
            )}
            Delete Spaces
          </Button>
          <Button
            variant="text"
            color="gray"
            onClick={() =>
              navigate(
                (location.state as any)?.tab
                  ? `/my?tab=${encodeURIComponent((location.state as any).tab)}`
                  : "/my"
              )
            }
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
