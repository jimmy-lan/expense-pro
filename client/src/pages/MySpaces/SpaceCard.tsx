import React from "react";
import { useNavigate } from "react-router-dom";
import { ListItem, Typography } from "@material-tailwind/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleRight, faUser } from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import type { SpaceDto } from "../../lib/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

function formatLastActivity(ts: string | null): string {
  if (!ts) return "N/A";
  try {
    return dayjs(ts).fromNow();
  } catch {
    return "N/A";
  }
}

function alphaColor(hex?: string | null, alpha = 0.12): string | undefined {
  const clean = (hex || "").replace("#", "");
  if (clean.length !== 6) return undefined;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const SpaceCard: React.FC<{
  space: SpaceDto;
  disableClick?: boolean;
  selectable?: boolean;
  selected?: boolean;
  canSelect?: boolean;
  onSelect?: (space: SpaceDto, willSelect: boolean) => void;
}> = ({ space, selectable, selected, canSelect = true, onSelect }) => {
  const navigate = useNavigate();

  const roleLabel = space.role
    ? space.role.charAt(0).toUpperCase() + space.role.slice(1)
    : "N/A";

  const solid = space.colorHex ? `#${space.colorHex}` : undefined;
  const bg = alphaColor(space.colorHex, 0.1);

  const isClickable = !selectable || (selectable && canSelect);

  return (
    <ListItem
      ripple={isClickable}
      className={twMerge(
        "group relative overflow-hidden rounded-2xl border-2 bg-white px-0 py-2",
        "border-transparent transition-colors",
        isClickable ? "cursor-pointer hover:border-current" : "cursor-default",
        `bg-[${bg}]`
      )}
      style={{
        ...(bg ? { background: bg } : {}),
        ...(solid ? { color: solid } : {}),
      }}
      onClick={() => {
        if (selectable) {
          if (!canSelect) return;
          onSelect?.(space, !selected);
        } else {
          navigate(`/my/space/${space.id}`);
        }
      }}
    >
      <div className="flex items-center gap-4 p-5 w-full">
        <div className="flex items-center self-stretch mr-2">
          <div className="mr-1 md:mr-3 lg:mr-4 h-full w-1 rounded-full bg-gray-400/60 transition-colors group-hover:bg-current" />
          <div className="hidden lg:block h-12 w-12 overflow-hidden rounded-full ring-2 ring-white/60 shadow-sm">
            {space.createdByAvatarUrl ? (
              <img
                src={space.createdByAvatarUrl}
                alt="Owner avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center bg-white/40 text-gray-700">
                <FontAwesomeIcon icon={faUser} />
              </div>
            )}
          </div>
        </div>

        <div className="flex-1">
          <div className="flex flex-col mb-2 sm:flex-row sm:gap-3 items-start sm:items-center justify-center sm:justify-start">
            <Typography
              variant="h6"
              className="truncate font-semibold text-gray-900"
            >
              {space.name}
            </Typography>
            <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-gray-800">
              {space.transactionsCount} transactions
            </span>
          </div>
          <div className="mt-1 grid grid-cols-1 gap-y-1 text-sm md:grid-cols-3 md:gap-x-4">
            <span className="text-gray-700/90">
              <span className="text-gray-800/90">Space Owner:</span>{" "}
              <span className="font-medium text-gray-900/90">
                {space.createdByName || "--"}
              </span>
            </span>
            <span>
              <span className="text-gray-800/90">Your Role:</span>{" "}
              <span
                className={twMerge(
                  "rounded px-1.5 py-0.5 text-xs font-medium",
                  space.role === "admin"
                    ? "bg-primary/10 text-primary"
                    : space.role === "member"
                    ? "bg-white/70 text-gray-800"
                    : "bg-white/60 text-gray-600"
                )}
              >
                {roleLabel}
              </span>
            </span>
            <span className="text-gray-700/90">
              <span className="text-gray-800/90">Last Activity:</span>{" "}
              <span className="font-medium text-gray-900/90">
                {formatLastActivity(space.lastTransactionAt)}
              </span>
            </span>
          </div>
        </div>
        <div
          className={twMerge(
            "hidden lg:flex px-8 items-center",
            selectable ? "!flex" : ""
          )}
        >
          {selectable ? (
            <button
              type="button"
              className={twMerge(
                "h-6 w-6 rounded-md border-2 transition-colors",
                selected
                  ? "bg-primary border-primary"
                  : "bg-white border-gray-400",
                canSelect ? "cursor-pointer" : "cursor-not-allowed opacity-50"
              )}
              onClick={(e) => {
                e.stopPropagation();
                if (!canSelect) return;
                onSelect?.(space, !selected);
              }}
              aria-label={selected ? "Deselect space" : "Select space"}
            />
          ) : (
            <FontAwesomeIcon
              icon={faAngleRight}
              size="lg"
              className="text-gray-500 group-hover:text-current transition-colors"
            />
          )}
        </div>
      </div>
    </ListItem>
  );
};
