import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Avatar,
  Button as MTButton,
  Card,
  CardBody,
  Typography,
  List,
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
  faChevronDown,
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

  const [expandedId, setExpandedId] = useState<number | null>(null);

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
            <Typography
              variant="h3"
              as="h1"
              className="font-bold text-gray-900"
            >
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
        <div className="mt-10">
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
            <div className="flex flex-col">
              <Typography variant="h4" as="h1" className="ml-1 mb-6">
                Activity
              </Typography>

              {transactions.map((group) => (
                <div key={group.key} className="">
                  <div className="px-1 py-3">
                    <Typography
                      variant="h5"
                      as="h2"
                      className="font-semibold text-gray-700"
                    >
                      {group.header}
                    </Typography>
                  </div>
                  <List>
                    {group.items.map((t) => {
                      const isExpanded = expandedId === t.id;
                      const currentUserId = (user as any)?.id as
                        | number
                        | undefined;
                      const isCreator =
                        currentUserId && t.creator?.id === currentUserId;
                      const isSpaceAdmin = space?.role === "admin";
                      const canDelete = Boolean(isCreator || isSpaceAdmin);

                      return (
                        <div key={t.id}>
                          <ListItem className="py-1 px-2">
                            <button
                              type="button"
                              className={
                                "w-full flex items-center gap-4 text-left"
                              }
                              onClick={() =>
                                setExpandedId((prev) =>
                                  prev === t.id ? null : t.id
                                )
                              }
                              aria-expanded={isExpanded}
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
                                        Number(t.amount) < 0
                                          ? "text-gray-900"
                                          : "text-green-700"
                                      )}
                                    >
                                      {formatAmount(t.amount)}
                                    </Typography>
                                    <FontAwesomeIcon
                                      icon={faChevronDown}
                                      className={twMerge(
                                        "ml-auto mt-1 text-gray-500 transition-transform",
                                        isExpanded ? "rotate-180" : "rotate-0"
                                      )}
                                    />
                                  </div>
                                </div>
                              </div>
                            </button>
                          </ListItem>

                          {isExpanded && (
                            <div className="pt-6 md:pt-4 px-2 pb-2 md:pl-14">
                              {t.description && (
                                <div className="mb-3">
                                  <Typography
                                    variant="small"
                                    className="font-semibold text-gray-800"
                                  >
                                    Description
                                  </Typography>
                                  <Typography
                                    variant="small"
                                    className="text-gray-700"
                                  >
                                    {t.description}
                                  </Typography>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-y-2">
                                <Typography
                                  variant="small"
                                  className="font-semibold text-gray-800"
                                >
                                  Occurred on
                                </Typography>
                                <Typography
                                  variant="small"
                                  className="font-normal text-right"
                                >
                                  {dayjs(t.occurredAt).format("MMM D, YYYY")}
                                </Typography>

                                <Typography
                                  variant="small"
                                  className="font-semibold text-gray-800"
                                >
                                  Created at
                                </Typography>
                                <Typography
                                  variant="small"
                                  className="font-normal text-right"
                                >
                                  {dayjs(t.createdAt).format(
                                    "MMM D, YYYY h:mm A"
                                  )}
                                </Typography>

                                {t.fullCover && (
                                  <>
                                    <Typography
                                      variant="small"
                                      className="font-semibold text-gray-800"
                                    >
                                      Full cover
                                    </Typography>
                                    <Typography
                                      variant="small"
                                      className="font-normal text-right"
                                    >
                                      Yes
                                    </Typography>
                                  </>
                                )}
                              </div>

                              <div className="my-4 border-t border-gray-300" />
                              <div className="flex items-center justify-between">
                                <Typography
                                  variant="small"
                                  className="font-semibold text-gray-800"
                                >
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
                                      navigate(
                                        `/my/space/${id}/transactions/${t.id}/delete`,
                                        { state: { transaction: t } }
                                      )
                                    }
                                  >
                                    <FontAwesomeIcon
                                      icon={faTrash}
                                      className="mr-2"
                                    />
                                    Delete
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                          <div className="my-2 border-b border-gray-300" />
                        </div>
                      );
                    })}
                  </List>
                </div>
              ))}

              {txQuery.hasNextPage && (
                <div className="flex justify-center py-4">
                  <MTButton
                    variant="outlined"
                    onClick={() => txQuery.fetchNextPage()}
                    loading={txQuery.isFetchingNextPage}
                    className="bg-white"
                  >
                    Load more
                  </MTButton>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
