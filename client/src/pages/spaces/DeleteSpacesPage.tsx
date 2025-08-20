import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppNavbar } from "../../components/AppNavbar";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { spacesApi } from "../../lib/api";
import { useScrollTopOnMount } from "../../hooks";

interface PendingDeleteSpace {
  id: number;
  name: string;
}

export const DeleteSpacesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const stateSpaces: PendingDeleteSpace[] =
    (location.state as any)?.spaces || [];

  useScrollTopOnMount();

  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const canSubmit = useMemo(
    () => confirmText.trim().toLowerCase() === "delete",
    [confirmText]
  );

  const onDelete = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      await spacesApi.bulkDelete(stateSpaces.map((s) => s.id));
      navigate("/my");
    } catch (e) {
      // naive error surface; in a real app you'd show a toast/snackbar
      console.error(e);
      navigate("/my");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen-safe bg-gray-50">
      <AppNavbar />
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">Delete Spaces</h1>
        <p className="mb-4 text-gray-700">
          You are about to delete the following spaces. This action is
          reversible only until the purge deadline defined by your plan.
        </p>

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
            onClick={onDelete}
            disabled={!canSubmit || submitting}
          >
            <FontAwesomeIcon icon={faTrash} className="mr-2" />
            Delete Spaces
          </Button>
          <Button
            variant="text"
            color="gray"
            onClick={() =>
              navigate(
                location.state?.tab
                  ? `/my?tab=${encodeURIComponent(location.state?.tab)}`
                  : "/my"
              )
            }
            disabled={submitting}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
