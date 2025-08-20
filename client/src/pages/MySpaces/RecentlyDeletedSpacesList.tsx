import React, { useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { spacesApi } from "../../lib/api";
import type { DeletedSpaceDto } from "../../lib/api";
import { DeletedSpaceCard } from "./DeletedSpaceCard";
import { EmptySpacesIndicator } from "./common";
import {
  faBorderNone,
  faEllipsis,
  faTrash,
  faRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import {
  Button as MTButton,
  IconButton,
  Menu,
  MenuHandler,
  MenuItem,
  MenuList,
} from "@material-tailwind/react";
import { MySpacesHeader } from "./MySpacesHeader";
import type { MenuKey } from "./menu";
import { FloatingBottomDrawer } from "../../components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "../../components/ui/Button";

export const RecentlyDeletedSpacesList: React.FC<{
  selected: MenuKey;
  onSelect?: (k: MenuKey) => void;
}> = ({ selected, onSelect }) => {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["spaces", "recently-deleted"],
    queryFn: ({ pageParam }) =>
      spacesApi.recentlyDeleted({ cursor: pageParam ?? null }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
    initialPageParam: null as string | null,
  });

  const allSpaces: DeletedSpaceDto[] = (data?.pages || []).flatMap(
    (p) => p.spaces
  );

  const [manageOpen, setManageOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const headerAction = (
    <div className="flex gap-2 w-full md:w-auto justify-end">
      <Menu open={manageOpen} handler={setManageOpen} placement="bottom-end">
        <MenuHandler>
          <IconButton
            variant="text"
            color="gray"
            className="rounded-md h-12 w-12"
            aria-label="Manage deleted items"
          >
            <FontAwesomeIcon icon={faEllipsis} />
          </IconButton>
        </MenuHandler>
        <MenuList>
          <MenuItem
            onClick={() => {
              setSelectionMode(true);
              setManageOpen(false);
            }}
          >
            Manage Deleted Items
          </MenuItem>
        </MenuList>
      </Menu>
    </div>
  );

  const toggleSelect = (space: DeletedSpaceDto, willSelect: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (willSelect) next.add(space.id);
      else next.delete(space.id);
      return next;
    });
  };

  const onMutationSuccess = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
    // Invalidate all spaces-related queries (active lists and recently-deleted)
    queryClient.invalidateQueries({ queryKey: ["spaces"], exact: false });
  };

  const recoverMutation = useMutation({
    mutationFn: (ids: number[]) => spacesApi.bulkRecover(ids),
    onSuccess: onMutationSuccess,
  });

  const purgeMutation = useMutation({
    mutationFn: (ids: number[]) => spacesApi.bulkPurge(ids),
    onSuccess: onMutationSuccess,
  });

  const recoverDisabled =
    selectedIds.size === 0 ||
    recoverMutation.isPending ||
    purgeMutation.isPending;
  const purgeDisabled =
    selectedIds.size === 0 ||
    recoverMutation.isPending ||
    purgeMutation.isPending;

  return (
    <>
      <MySpacesHeader
        title="Recently Deleted"
        selected={selected}
        onSelect={onSelect}
        headerAction={headerAction}
      />

      {isError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
          {(error as any)?.message || "Failed to load"}
        </div>
      )}

      {allSpaces.length === 0 && !isLoading ? (
        <EmptySpacesIndicator
          title="No recently deleted spaces"
          subtitle="Deleted spaces you own will appear here before they are permanently removed."
          onButtonClick={() => refetch()}
          loading={false}
          icon={faBorderNone}
          buttonLabel="Refresh"
        />
      ) : (
        <div className="space-y-3">
          {allSpaces.map((space) => (
            <DeletedSpaceCard
              key={space.id}
              space={space}
              selectable={selectionMode}
              selected={selectedIds.has(space.id)}
              canSelect={true}
              onSelect={toggleSelect}
            />
          ))}
        </div>
      )}

      {hasNextPage && (
        <div className="mt-6 flex justify-center">
          <MTButton
            onClick={() => fetchNextPage()}
            disabled={!hasNextPage || isFetchingNextPage}
            variant="outlined"
            loading={isFetchingNextPage}
          >
            Load more
          </MTButton>
        </div>
      )}

      <div
        className="pt-4 pb-24 md:pb-14"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 6rem)",
        }}
      />

      <FloatingBottomDrawer
        open={selectionMode}
        prompt={`${selectedIds.size} selected`}
        onExit={() => {
          setSelectionMode(false);
          setSelectedIds(new Set());
        }}
      >
        <Button
          color="primary"
          variant="outlined"
          size="md"
          disabled={recoverDisabled}
          loading={recoverMutation.isPending}
          onClick={() => recoverMutation.mutate(Array.from(selectedIds))}
          className="md:mr-2"
        >
          <FontAwesomeIcon icon={faRotateLeft} className="md:mr-2" />
          <span className="hidden md:inline">Recover</span>
        </Button>
        <Button
          color="red"
          variant="outlined"
          size="md"
          disabled={purgeDisabled}
          loading={purgeMutation.isPending}
          onClick={() => purgeMutation.mutate(Array.from(selectedIds))}
        >
          <FontAwesomeIcon icon={faTrash} className="md:mr-2" />
          <span className="hidden md:inline">Delete Forever</span>
        </Button>
      </FloatingBottomDrawer>
    </>
  );
};
