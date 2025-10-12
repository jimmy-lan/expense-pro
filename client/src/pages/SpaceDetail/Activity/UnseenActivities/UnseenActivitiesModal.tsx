import React, { useMemo } from "react";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Typography,
  Avatar,
} from "@material-tailwind/react";
import { Button } from "../../../../components/ui/Button";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  activityHistoryApi,
  type ActivityEventDto,
  type ActivityUnseenResponse,
} from "../../../../lib/api";

function formatValue(value: unknown): string {
  if (value === null || typeof value === "undefined") return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

const KeyValueList: React.FC<{ entries: [string, unknown][] }> = ({
  entries,
}) => {
  if (!entries || entries.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-y-1">
      {entries.map(([key, value]) => (
        <React.Fragment key={key}>
          <Typography variant="small" className="font-semibold text-gray-800">
            {key}
          </Typography>
          <Typography
            variant="small"
            className="font-normal text-right break-words"
          >
            {formatValue(value)}
          </Typography>
        </React.Fragment>
      ))}
    </div>
  );
};

interface Props {
  spaceId: number;
  open: boolean;
  onClose: () => void;
}

export const UnseenActivitiesModal: React.FC<Props> = ({
  spaceId,
  open,
  onClose,
}) => {
  const qc = useQueryClient();

  const unseenQuery = useInfiniteQuery<ActivityUnseenResponse>({
    queryKey: ["activity", "unseen", spaceId],
    queryFn: ({ pageParam }) =>
      activityHistoryApi.unseen(spaceId, {
        cursor: (pageParam as number | null) || undefined,
      }),
    getNextPageParam: (last) =>
      last.hasMore ? last.lastCursor || undefined : undefined,
    enabled: open && Number.isFinite(spaceId) && spaceId > 0,
    initialPageParam: null as number | null,
    refetchOnMount: true,
  });

  const items = useMemo<ActivityEventDto[]>(() => {
    return (unseenQuery.data?.pages || []).flatMap((p) => p.items);
  }, [unseenQuery.data]);

  // Track the highest activity ID from loaded items
  // Since backend returns in descending order, the first item has the highest ID
  const highestActivityId = items[0]?.id;

  const acknowledgeMutation = useMutation({
    mutationFn: async () => {
      await activityHistoryApi.markSeen(spaceId, highestActivityId);
    },
    onSuccess: () => {
      // Invalidate has_unseen and unseen lists
      qc.invalidateQueries({ queryKey: ["activity", "has_unseen", spaceId] });
      qc.invalidateQueries({ queryKey: ["activity", "unseen", spaceId] });
      onClose();
    },
  });

  return (
    <Dialog
      open={open}
      handler={() => {}}
      size="xxl"
      dismiss={{ outsidePress: false, escapeKey: false }}
      className="!m-0 !h-[100dvh] !min-h-[100dvh] !max-h-[100dvh] !w-screen flex flex-col bg-white pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
    >
      <DialogHeader className="px-4 py-3 border-b border-gray-100">
        <Typography variant="h5" className="text-gray-800">
          New activities
        </Typography>
      </DialogHeader>
      <DialogBody className="flex-1 overflow-y-auto px-0">
        <div className="px-4">
          {unseenQuery.isError && (
            <div className="mb-4 p-3 text-red-700 bg-red-50 border border-red-100 rounded">
              {(unseenQuery.error as any)?.message ||
                "Failed to load new activities"}
            </div>
          )}

          {items.length === 0 && unseenQuery.isSuccess && (
            <div className="text-gray-700 py-6">You're all caught up.</div>
          )}

          <ul className="divide-y divide-gray-300">
            {items.map((a) => {
              const verb = (a.verb || "").toString();
              const subjectType = (a.subject?.type || "").toString();
              const title = `${verb.replace(/\b\w/g, (c) =>
                c.toUpperCase()
              )} ${subjectType.replace(/\b\w/g, (c) =>
                c.toUpperCase()
              )}`.trim();
              const metadata = a.metadata || {};
              const entries = Object.entries(metadata);
              const actorName = [a.actor?.firstName, a.actor?.lastName]
                .filter(Boolean)
                .join(" ");

              return (
                <li key={a.id} className="p-2 py-4 mb-2">
                  <div className="flex items-start gap-4">
                    <Avatar
                      src={a.actor?.avatarUrl || undefined}
                      alt={actorName || "User"}
                      variant="circular"
                      className="h-8 w-8 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900 font-semibold">
                        {title || "Activity"}
                      </div>
                      <div className="text-xs text-gray-600">
                        {new Date(a.createdAt).toLocaleString()}
                      </div>
                      {actorName && (
                        <div className="mt-1 text-sm text-gray-700 truncate">
                          {actorName}
                        </div>
                      )}

                      {entries.length > 0 && (
                        <div className="mt-3">
                          <KeyValueList entries={entries} />
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {unseenQuery.hasNextPage && (
            <div className="flex justify-center py-4">
              <Button
                variant="outlined"
                size="md"
                onClick={() => unseenQuery.fetchNextPage()}
                loading={unseenQuery.isFetchingNextPage}
                className="bg-white"
              >
                Load more
              </Button>
            </div>
          )}
        </div>
      </DialogBody>
      <DialogFooter className="gap-2 border-t border-gray-100 p-4">
        <Button
          variant="text"
          color="gray"
          onClick={onClose}
          disabled={acknowledgeMutation.isPending}
          className="bg-white"
          size="md"
        >
          View Later
        </Button>
        <Button
          onClick={() => acknowledgeMutation.mutate()}
          loading={acknowledgeMutation.isPending}
          disabled={!items.length}
          size="md"
        >
          Mark as Read
        </Button>
      </DialogFooter>
    </Dialog>
  );
};
