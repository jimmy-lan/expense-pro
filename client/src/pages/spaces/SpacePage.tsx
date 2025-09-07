import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Avatar,
  Button as MTButton,
  Card,
  CardBody,
  Dialog,
  DialogBody,
  DialogHeader,
  Typography,
  ListItem,
} from "@material-tailwind/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import { AppNavbar } from "../../components";
import { Button } from "../../components/ui/Button";
import { useUserInfo } from "../../hooks";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import {
  spacesApi,
  transactionsApi,
  type TransactionDto,
  type TransactionsResponse,
} from "../../lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faArrowLeft,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";

dayjs.extend(relativeTime);
dayjs.extend(isToday);
dayjs.extend(isYesterday);

function formatDateHeader(iso: string): string {
  const d = dayjs(iso);
  if (d.isToday()) return "Today";
  if ((d as any).isYesterday && d.isYesterday()) return "Yesterday";
  return d.format("MMMM D, YYYY");
}

function formatAmount(amount: string): string {
  const num = Number(amount);
  if (Number.isNaN(num)) return amount;
  const sign = num < 0 ? "-" : "";
  return `${sign}$${Math.abs(num).toFixed(2)}`;
}

export const SpacePage: React.FC = () => {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const id = Number(spaceId);
  const { user } = useUserInfo();

  const spaceQuery = useQuery({
    queryKey: ["space", id],
    queryFn: () => spacesApi.show(id),
    enabled: Number.isFinite(id) && id > 0,
  });

  const txQuery = useInfiniteQuery<TransactionsResponse>({
    queryKey: ["transactions", id],
    queryFn: ({ pageParam }) =>
      transactionsApi.list(id, {
        cursor: (pageParam as string | null) || undefined,
      }),
    getNextPageParam: (last) => (last.hasMore ? last.lastCursor : undefined),
    enabled: Number.isFinite(id) && id > 0,
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

  const [selected, setSelected] = useState<TransactionDto | null>(null);

  const space = spaceQuery.data?.space;

  return (
    <div className="min-h-screen-safe bg-gray-50">
      <AppNavbar />

      <div className="mx-auto px-4 py-6 md:px-8 lg:px-12 2xl:px-16">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-1">
              <Button
                color="gray"
                variant="text"
                size="sm"
                onClick={() => navigate("/my")}
                className="!px-0 mb-4"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                Back to My Spaces
              </Button>
            </div>
            <Typography variant="h4" className="font-bold text-gray-900">
              {spaceQuery.isLoading ? "Loading..." : space?.name || "Space"}
            </Typography>
            {spaceQuery.isError && (
              <Typography variant="small" className="text-red-700 mt-1">
                Failed to load space details
              </Typography>
            )}
            {space?.description && (
              <Typography variant="small" className="text-gray-600 mt-1">
                {space.description || ""}
              </Typography>
            )}
          </div>
          <div className="mt-2 md:mt-0">
            <Button
              variant="outlined"
              onClick={() => navigate(`/my/space/${id}/transactions/new`)}
              fullWidth
              size="md"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Add Transaction
            </Button>
          </div>
        </div>

        {/* Transactions list */}
        <div>
          {txQuery.isError && (
            <div className="mb-4 p-4 text-red-700 bg-red-50 border border-red-100 rounded">
              {(txQuery.error as any)?.message || "Failed to load transactions"}
            </div>
          )}

          {transactions.length === 0 && !txQuery.isLoading ? (
            <Card className="shadow-sm">
              <CardBody className="p-6 text-center text-gray-700">
                No transactions yet.
              </CardBody>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {transactions.map((group) => (
                <Card key={group.key} className="shadow-sm">
                  <div className="px-4 py-3 border-b border-gray-100 bg-white">
                    <Typography
                      variant="small"
                      className="font-semibold text-gray-800"
                    >
                      {group.header}
                    </Typography>
                  </div>
                  <ul>
                    {group.items.map((t) => (
                      <ListItem
                        key={t.id}
                        className="p-6 rounded-none border-gray-100 bg-white active:bg-gray-50 cursor-pointer"
                        onClick={() => setSelected(t)}
                      >
                        <div className="flex items-center gap-4 w-full">
                          <Avatar
                            src={t.creator?.avatarUrl || undefined}
                            alt={t.creator?.name || "User"}
                            variant="circular"
                            className="h-10 w-10"
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
                              <Typography
                                variant="paragraph"
                                className={twMerge(
                                  "font-semibold",
                                  Number(t.amount) < 0
                                    ? "text-gray-900"
                                    : "text-green-700"
                                )}
                              >
                                {formatAmount(t.amount)}
                              </Typography>
                            </div>
                          </div>
                        </div>
                      </ListItem>
                    ))}
                  </ul>
                </Card>
              ))}

              {txQuery.hasNextPage && (
                <div className="flex justify-center">
                  <MTButton
                    variant="outlined"
                    onClick={() => txQuery.fetchNextPage()}
                    disabled={txQuery.isFetchingNextPage}
                    className="bg-white"
                  >
                    {txQuery.isFetchingNextPage ? "Loading..." : "Load more"}
                  </MTButton>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Details dialog */}
      <Dialog open={!!selected} handler={() => setSelected(null)} size="sm">
        <DialogHeader className="p-4">
          <div className="flex items-center gap-4 w-full pr-5">
            <Avatar
              src={selected?.creator?.avatarUrl || undefined}
              alt={selected?.creator?.name || "User"}
              variant="circular"
              className="h-10 w-10"
            />
            <div>
              <Typography variant="h6" className="font-semibold text-gray-900">
                {selected?.title || ""}
              </Typography>
              <Typography variant="small" className="text-gray-600">
                {selected?.creator?.name || ""}
              </Typography>
            </div>
            <div className="ml-auto text-right">
              <Typography
                variant="h6"
                className={
                  Number(selected?.amount || 0) < 0
                    ? "text-gray-900"
                    : "text-green-700"
                }
              >
                {selected ? formatAmount(selected.amount) : ""}
              </Typography>
            </div>
          </div>
        </DialogHeader>
        <DialogBody className="px-5 pb-6">
          {selected?.description && (
            <div className="mb-3">
              <Typography
                variant="small"
                className="font-semibold text-gray-800"
              >
                Description
              </Typography>
              <Typography variant="small" className="text-gray-700">
                {selected.description || ""}
              </Typography>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Typography
                variant="small"
                className="font-semibold text-gray-800"
              >
                Occurred on
              </Typography>
              <Typography variant="small" className="text-gray-700">
                {dayjs(selected?.occurredAt).format("MMM D, YYYY")}
              </Typography>
            </div>
            <div>
              <Typography
                variant="small"
                className="font-semibold text-gray-800"
              >
                Created at
              </Typography>
              <Typography variant="small" className="text-gray-700">
                {dayjs(selected?.createdAt).format("MMM D, YYYY h:mm A")}
              </Typography>
            </div>
            <div className="col-span-2">
              <Typography
                variant="small"
                className="font-semibold text-gray-800"
              >
                Full cover
              </Typography>
              <Typography variant="small" className="text-gray-700">
                {selected?.fullCover ? "Yes" : "No"}
              </Typography>
            </div>
          </div>

          {/* Actions */}
          {!!selected && (
            <div className="mt-6 flex justify-end gap-3">
              {(() => {
                const currentUserId = (user as any)?.id as number | undefined;
                const isCreator =
                  currentUserId && selected.creator?.id === currentUserId;
                const isSpaceAdmin = space?.role === "admin";
                const canDelete = Boolean(isCreator || isSpaceAdmin);
                return canDelete ? (
                  <Button
                    color="red"
                    size="sm"
                    variant="outlined"
                    onClick={() =>
                      navigate(
                        `/my/space/${id}/transactions/${selected.id}/delete`,
                        {
                          state: { transaction: selected },
                        }
                      )
                    }
                  >
                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                    Delete
                  </Button>
                ) : null;
              })()}
              <Button
                variant="text"
                color="gray"
                size="sm"
                onClick={() => setSelected(null)}
              >
                Close
              </Button>
            </div>
          )}
        </DialogBody>
      </Dialog>
    </div>
  );
};
