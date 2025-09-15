import React from "react";
import { Avatar, Spinner, Typography } from "@material-tailwind/react";
import { useQuery } from "@tanstack/react-query";
import { spacesApi, type SpaceSummaryDto } from "../../lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGift } from "@fortawesome/free-solid-svg-icons";

interface Props {
  spaceId: number;
}

export const Summary: React.FC<Props> = ({ spaceId }) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["space", spaceId, "summary"],
    queryFn: () => spacesApi.summary(spaceId),
    enabled: Number.isFinite(spaceId) && spaceId > 0,
  });

  const summary: SpaceSummaryDto | undefined = data?.summary;

  return (
    <div>
      <div className="py-3">
        <Typography
          variant="h5"
          as="h2"
          className="font-semibold text-gray-700"
        >
          Space at a Glance
        </Typography>
      </div>
      <div className="grid grid-cols-2 gap-y-2 py-2">
        <Typography variant="small" className="font-semibold text-gray-800">
          Transactions
        </Typography>
        <Typography variant="small" className="font-normal text-right">
          {isLoading
            ? "Loading..."
            : `${summary?.space.totalTransactions} txns`}
        </Typography>

        <Typography variant="small" className="font-semibold text-gray-800">
          Total spend
        </Typography>
        <Typography variant="small" className="font-normal text-right">
          {isLoading ? "—" : summary?.space.totalSpend ?? "$0.00"}
        </Typography>

        <Typography variant="small" className="font-semibold text-gray-800">
          Total credit
        </Typography>
        <Typography
          variant="small"
          className="font-normal text-right text-green-700"
        >
          {isLoading ? "—" : summary?.space.totalCredit ?? "$0.00"}
        </Typography>
      </div>

      <div className="my-4 border-t border-gray-300" />

      <div className="py-3">
        <Typography
          variant="h5"
          as="h2"
          className="font-semibold text-gray-700"
        >
          Member contributions
        </Typography>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center h-24">
          <Spinner />
        </div>
      )}

      {isError && (
        <Typography variant="small" className="text-red-700">
          Failed to load summary
        </Typography>
      )}

      <div className="flex flex-col">
        {(summary?.members || []).map((m) => (
          <div key={m.id} className="pb-3">
            <div className="flex items-center gap-3 py-3 mb-1">
              <Avatar
                src={m.avatarUrl || ""}
                alt={m.name}
                variant="circular"
                className="h-6 w-6"
              />
              <Typography
                variant="paragraph"
                className="font-semibold text-gray-900 truncate"
              >
                {m.name}
              </Typography>
            </div>
            <div className="grid grid-cols-2 gap-y-2">
              <Typography
                variant="small"
                className="font-semibold text-gray-800"
              >
                Spend
              </Typography>
              <Typography variant="small" className="font-normal text-right">
                {m.spendAmount}
              </Typography>

              <Typography
                variant="small"
                className="font-semibold text-gray-800"
              >
                Credit
              </Typography>
              <Typography
                variant="small"
                className="font-normal text-right text-green-700"
              >
                {m.creditAmount}
              </Typography>

              <Typography
                variant="small"
                className="font-semibold text-gray-800"
              >
                Full cover
              </Typography>
              <div className="flex justify-end items-center gap-2">
                <FontAwesomeIcon icon={faGift} className="w-3 h-3" />
                <Typography variant="small" className="font-normal text-right">
                  {m.fullCoverAmount}
                </Typography>
              </div>

              <Typography
                variant="small"
                className="font-semibold text-gray-800"
              >
                Transactions
              </Typography>
              <Typography variant="small" className="font-normal text-right">
                {m.transactionsCount} txns
              </Typography>
            </div>
            <div className="mt-4 mb-2 border-t border-gray-300" />
          </div>
        ))}

        {summary && summary.members.length === 0 && (
          <Typography variant="small" className="text-gray-600">
            No contributions yet.
          </Typography>
        )}
      </div>
    </div>
  );
};
