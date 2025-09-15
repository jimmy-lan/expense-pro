import React from "react";
import { Typography } from "@material-tailwind/react";
import dayjs from "dayjs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGift, faTrash } from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { Button } from "../../../components/ui/Button";
import { useNavigate, useParams } from "react-router-dom";
import { type TransactionDto } from "../../../lib/api";

function formatAmount(amount: string): string {
  const num = Number(amount);
  if (Number.isNaN(num)) return amount;
  const sign = num < 0 ? "-" : "";
  return `${sign}$${Math.abs(num).toFixed(2)}`;
}

interface Props {
  t: TransactionDto;
  canDelete: boolean;
}

export const TransactionDetail: React.FC<Props> = ({ t, canDelete }) => {
  const navigate = useNavigate();
  const { spaceId } = useParams();
  const id = Number(spaceId);

  return (
    <div className="pt-6 md:pt-4 px-2 pb-2 md:pl-14">
      {t.description && (
        <div className="mb-3">
          <Typography variant="small" className="font-semibold text-gray-800">
            Description
          </Typography>
          <Typography variant="small" className="text-gray-700">
            {t.description}
          </Typography>
        </div>
      )}

      <div className="grid grid-cols-2 gap-y-2">
        <Typography variant="small" className="font-semibold text-gray-800">
          Occurred on
        </Typography>
        <Typography variant="small" className="font-normal text-right">
          {dayjs(t.occurredAt).format("MMM D, YYYY")}
        </Typography>

        <Typography variant="small" className="font-semibold text-gray-800">
          Created at
        </Typography>
        <Typography variant="small" className="font-normal text-right">
          {dayjs(t.createdAt).format("MMM D, YYYY h:mm A")}
        </Typography>

        {t.fullCover && (
          <>
            <Typography variant="small" className="font-semibold text-gray-800">
              Full cover
            </Typography>
            <div className="flex justify-end items-center gap-2">
              <FontAwesomeIcon icon={faGift} className="w-3 h-3" />
              <Typography
                variant="small"
                className="font-normal inline-block text-right"
              >
                Yes
              </Typography>
            </div>
          </>
        )}
      </div>

      <div className="my-4 border-t border-gray-300" />
      <div className="flex items-center justify-between">
        <Typography variant="small" className="font-semibold text-gray-800">
          Amount
        </Typography>
        <Typography
          variant="small"
          className={twMerge(
            "font-normal",
            Number(t.amount) < 0 ? "" : "text-green-700"
          )}
        >
          {formatAmount(t.amount)}
        </Typography>
      </div>

      <div className="mt-4 flex justify-start gap-3">
        {canDelete && (
          <Button
            color="red"
            size="sm"
            variant="outlined"
            onClick={() =>
              navigate(`/my/space/${id}/transactions/${t.id}/delete`, {
                state: { transaction: t },
              })
            }
          >
            <FontAwesomeIcon icon={faTrash} className="mr-2" />
            Delete
          </Button>
        )}
      </div>
    </div>
  );
};
