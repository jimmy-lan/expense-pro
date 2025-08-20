import React from "react";
import { ListItem, Typography } from "@material-tailwind/react";
import type { DeletedSpaceDto } from "../../lib/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleRight } from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";

dayjs.extend(relativeTime);

export const DeletedSpaceCard: React.FC<{
  space: DeletedSpaceDto;
  selectable?: boolean;
  selected?: boolean;
  canSelect?: boolean;
  onSelect?: (space: DeletedSpaceDto, willSelect: boolean) => void;
}> = ({
  space,
  selectable = false,
  selected = false,
  canSelect = true,
  onSelect,
}) => {
  const isClickable = selectable && canSelect;

  return (
    <ListItem
      ripple={isClickable}
      className={twMerge(
        "group relative overflow-hidden rounded-2xl border-2 bg-white px-0 py-2",
        "border-transparent transition-colors",
        isClickable ? "cursor-pointer hover:border-gray-900" : "cursor-default"
      )}
      onClick={() => {
        if (selectable) {
          if (!canSelect) return;
          onSelect?.(space, !selected);
        }
      }}
    >
      <div className="flex items-center gap-4 p-5 w-full">
        <div className="flex-1">
          <Typography variant="h6" className="font-semibold text-gray-900">
            {space.name}
          </Typography>
          <Typography variant="small" className="text-gray-700 mt-1">
            Deleted {dayjs(space.deletedAt).fromNow()} • Will purge{" "}
            {dayjs(space.purgeAfterAt).fromNow()}
          </Typography>
        </div>
        <div
          className={twMerge(
            "hidden lg:flex px-8 items-center",
            selectable ? "!flex" : ""
          )}
        >
          {selectable && (
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
          )}
        </div>
      </div>
    </ListItem>
  );
};
