import React from "react";
import { ListItem, Typography } from "@material-tailwind/react";
import type { DeletedSpaceDto } from "../../lib/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleRight } from "@fortawesome/free-solid-svg-icons";

dayjs.extend(relativeTime);

export const DeletedSpaceCard: React.FC<{ space: DeletedSpaceDto }> = ({
  space,
}) => {
  return (
    <ListItem className="group relative overflow-hidden rounded-2xl border-2 bg-white px-0 py-2 border-transparent">
      <div className="flex items-center justify-between gap-4 p-5 w-full">
        <div>
          <Typography variant="h6" className="font-semibold text-gray-900">
            {space.name}
          </Typography>
          <Typography variant="small" className="text-gray-700 mt-1">
            Deleted {dayjs(space.deletedAt).fromNow()} • Will purge{" "}
            {dayjs(space.purgeAfterAt).fromNow()}
          </Typography>
        </div>
        <div className="text-gray-500">
          <FontAwesomeIcon icon={faAngleRight} />
        </div>
      </div>
    </ListItem>
  );
};
