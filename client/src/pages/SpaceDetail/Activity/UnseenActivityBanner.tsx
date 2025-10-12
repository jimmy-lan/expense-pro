import React from "react";
import { ListItem, Typography } from "@material-tailwind/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleRight, faBell } from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import type { SpaceDto } from "../../../lib/api";

function alphaColor(hex?: string | null, alpha = 0.1): string | undefined {
  const clean = (hex || "").replace("#", "");
  if (clean.length !== 6) return undefined;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  space?: SpaceDto;
  hasMore?: boolean;
}

export const UnseenActivityBanner: React.FC<Props> = ({
  space,
  hasMore,
  ...otherProps
}) => {
  const bg = alphaColor(space?.colorHex, 0.08);
  const solid = space?.colorHex ? `#${space.colorHex}` : undefined;

  return (
    <ListItem
      ripple={false}
      className={twMerge(
        "relative overflow-hidden rounded-xl border bg-white p-4 my-2",
        "border-gray-200"
      )}
      style={{
        ...(bg ? { background: bg } : {}),
        ...(solid ? { color: solid } : {}),
      }}
      {...otherProps}
    >
      <div className="flex items-center gap-4 w-full">
        <div className="grid place-items-center h-8 w-8 rounded-full bg-white/80 text-gray-800">
          <FontAwesomeIcon icon={faBell} className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <Typography
                variant="small"
                className="text-gray-800 font-semibold"
              >
                New activities
              </Typography>
              <div className="text-sm text-gray-700 truncate">
                Catch up on latest activities.
              </div>
            </div>
            <FontAwesomeIcon icon={faAngleRight} className="text-gray-500" />
          </div>
        </div>
      </div>
    </ListItem>
  );
};
