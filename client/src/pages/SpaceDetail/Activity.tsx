import React, { useMemo, useState } from "react";
import { Typography, List } from "@material-tailwind/react";
import { useInfiniteQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import {
  transactionsApi,
  type TransactionDto,
  type TransactionsResponse,
  type SpaceDto,
} from "../../lib/api";
import { Transaction } from "./Activity/Transaction";
import { Button } from "../../components/ui/Button";

// dayjs plugins
(dayjs as any).extend(relativeTime);
(dayjs as any).extend(isToday);
(dayjs as any).extend(isYesterday);

function formatDateHeader(iso: string): string {
  const d = dayjs(iso);
  if ((d as any).isToday && d.isToday()) return "Today";
  if ((d as any).isYesterday && d.isYesterday()) return "Yesterday";
  return d.format("MMMM D, YYYY");
}

interface Props {
  spaceId: number;
  space?: SpaceDto;
}

export const Activity: React.FC<Props> = ({ spaceId, space }) => {
  const txQuery = useInfiniteQuery<TransactionsResponse>({
    queryKey: ["transactions", spaceId],
    queryFn: ({ pageParam }) =>
      transactionsApi.list(spaceId, {
        cursor: (pageParam as string | null) || undefined,
      }),
    getNextPageParam: (last) => (last.hasMore ? last.lastCursor : undefined),
    enabled: Number.isFinite(spaceId) && spaceId > 0,
    initialPageParam: null as string | null,
  });

  const transactions = useMemo(() => {
    const all: TransactionDto[] = (txQuery.data?.pages || []).flatMap(
      (p) => p.transactions
    );

    // Group by occurredAt date (yyyy-mm-dd)
    const groups = new Map<string, TransactionDto[]>();
    for (const t of all) {
      const key = dayjs(t.occurredAt).format("YYYY-MM-DD");
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    }

    // Sort groups by date desc
    const sortedKeys = Array.from(groups.keys()).sort((a, b) =>
      a < b ? 1 : a > b ? -1 : 0
    );
    return sortedKeys.map((k) => ({
      key: k,
      header: formatDateHeader(k),
      items: groups.get(k)!,
    }));
  }, [txQuery.data]);

  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div className="mt-10">
      {txQuery.isError && (
        <div className="mb-4 p-4 text-red-700 bg-red-50 border border-red-100 rounded">
          {(txQuery.error as any)?.message || "Failed to load transactions"}
        </div>
      )}

      <div className="flex flex-col">
        <Typography variant="h4" as="h1" className="mb-6">
          Activity
        </Typography>

        {transactions.length === 0 && (
          <div className="text-gray-700">No transactions yet.</div>
        )}

        {transactions.map((group) => (
          <div key={group.key}>
            <div className="py-3">
              <Typography
                variant="h5"
                as="h2"
                className="font-semibold text-gray-700"
              >
                {group.header}
              </Typography>
            </div>
            <List className="px-0">
              {group.items.map((t) => (
                <Transaction
                  key={t.id}
                  t={t}
                  space={space}
                  expanded={expandedId === t.id}
                  onListItemClick={() =>
                    setExpandedId((prev) => (prev === t.id ? null : t.id))
                  }
                />
              ))}
            </List>
          </div>
        ))}

        {txQuery.hasNextPage && (
          <div className="flex justify-center py-4">
            <Button
              variant="outlined"
              size="md"
              onClick={() => txQuery.fetchNextPage()}
              loading={txQuery.isFetchingNextPage}
              className="bg-white"
            >
              Load more
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
