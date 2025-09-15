import React from "react";
import { Avatar, ListItem, Typography } from "@material-tailwind/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faGift } from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { useUserInfo } from "../../../hooks";
import { type SpaceDto, type TransactionDto } from "../../../lib/api";
import { TransactionDetail } from "./TransactionDetail";

function formatAmount(amount: string): string {
  const num = Number(amount);
  if (Number.isNaN(num)) return amount;
  const sign = num < 0 ? "-" : "";
  return `${sign}$${Math.abs(num).toFixed(2)}`;
}

interface Props {
  t: TransactionDto;
  space?: SpaceDto;
  expanded: boolean;
  onListItemClick: () => void;
}

export const Transaction: React.FC<Props> = ({
  t,
  space,
  expanded,
  onListItemClick,
}) => {
  const { user } = useUserInfo();
  const currentUserId = (user as any)?.id as number | undefined;
  const isCreator = currentUserId && t.creator?.id === currentUserId;
  const isSpaceAdmin = space?.role === "admin";
  const canDelete = Boolean(isCreator || isSpaceAdmin);

  return (
    <div>
      <ListItem className="py-1 px-2">
        <button
          type="button"
          className="w-full flex items-center gap-4 text-left"
          onClick={onListItemClick}
          aria-expanded={expanded}
        >
          <Avatar
            src={t.creator?.avatarUrl || undefined}
            alt={t.creator?.name || "User"}
            variant="circular"
            className="h-8 w-8"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Typography
                  variant="paragraph"
                  className="font-semibold text-gray-900 truncate"
                >
                  {t.title}
                </Typography>
                <div className="mt-0.5 text-sm text-gray-600 truncate">
                  {t.creator?.name || "Unknown"}
                </div>
              </div>
              <div className="text-right">
                <Typography
                  variant="paragraph"
                  className={twMerge(
                    "font-semibold",
                    Number(t.amount) < 0 ? "text-gray-900" : "text-green-700"
                  )}
                >
                  {formatAmount(t.amount)}
                </Typography>
                <div className="flex items-center justify-end gap-2 mt-1">
                  {t.fullCover && (
                    <FontAwesomeIcon icon={faGift} className="w-3 h-3" />
                  )}
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className={twMerge(
                      "text-gray-500 transition-transform",
                      expanded ? "rotate-180" : "rotate-0"
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        </button>
      </ListItem>

      {expanded && <TransactionDetail t={t} canDelete={canDelete} />}
      <div className="my-2 border-b border-gray-300" />
    </div>
  );
};
