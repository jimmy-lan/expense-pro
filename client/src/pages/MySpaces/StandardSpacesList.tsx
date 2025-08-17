import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Button } from "../../components/ui/Button";
import {
  faBorderNone,
  faPlus,
  faEllipsis,
  faTrash,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { SpaceCard } from "./SpaceCard";
import type { SpaceDto, SpacesFilter } from "../../lib/api";
import { spacesApi } from "../../lib/api";
import { EmptySpacesIndicator } from "./common";
import { MySpacesHeader } from "./MySpacesHeader";
import type { MenuKey } from "./menu";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  IconButton,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
} from "@material-tailwind/react";
import { useUserInfo } from "../../hooks";

export const StandardSpacesList: React.FC<{
  filter: SpacesFilter;
  selected: MenuKey;
  onSelect?: (k: MenuKey) => void;
}> = ({ filter, selected, onSelect }) => {
  const navigate = useNavigate();
  const { user } = useUserInfo();

  const [manageOpen, setManageOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const title = useMemo(() => {
    switch (filter) {
      case "all":
        return "All Spaces";
      case "created":
        return "Created by Me";
      case "invited":
        return "Shared with Me";
      default:
        return "All Spaces";
    }
  }, [filter]);

  const spacesQuery = useInfiniteQuery({
    queryKey: ["spaces", filter],
    queryFn: ({ pageParam }) =>
      spacesApi.list({ filter, cursor: pageParam ?? null }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
    initialPageParam: null as string | null,
  });

  const allSpaces: SpaceDto[] = (spacesQuery.data?.pages || []).flatMap(
    (p: { spaces: SpaceDto[] }) => p.spaces
  );
  const hasMore: boolean = spacesQuery.data?.pages?.at(-1)?.hasMore ?? false;

  useEffect(() => {
    if ((spacesQuery.error as any)?.status === 401) {
      navigate("/login");
    }
  }, [spacesQuery.error, navigate]);

  // Reset selection when filter changes
  useEffect(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, [filter]);

  const headerAction = (
    <div className="flex gap-2 w-full md:w-auto">
      <Button
        size="md"
        variant="outlined"
        fullWidth
        onClick={() => navigate("/spaces/new", { state: { tab: selected } })}
      >
        <FontAwesomeIcon icon={faPlus} className="mr-2" />
        New Space
      </Button>
      <Menu open={manageOpen} handler={setManageOpen} placement="bottom-end">
        <MenuHandler>
          <IconButton
            variant="text"
            color="gray"
            className="rounded-md h-12 w-12"
            aria-label="Manage spaces"
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
            Manage Spaces
          </MenuItem>
        </MenuList>
      </Menu>
    </div>
  );

  const canSelect = (s: SpaceDto) => {
    const currentUserId = (user as any)?.id as number | undefined;
    return Boolean(currentUserId && s.createdById === currentUserId);
  };

  const toggleSelect = (s: SpaceDto, willSelect: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (willSelect) next.add(s.id);
      else next.delete(s.id);
      return next;
    });
  };

  const selectedSpaces = allSpaces.filter((s) => selectedIds.has(s.id));

  return (
    <>
      <MySpacesHeader
        title={title}
        headerAction={headerAction}
        selected={selected}
        onSelect={onSelect}
      />

      {spacesQuery.isError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
          {spacesQuery.error?.message || "Failed to load"}
        </div>
      )}

      {allSpaces.length === 0 && !spacesQuery.isLoading ? (
        <EmptySpacesIndicator
          title="No spaces yet"
          subtitle="Create a space from the app to get started."
          buttonLabel={filter === "invited" ? undefined : "Create"}
          onButtonClick={
            filter === "invited"
              ? () => spacesQuery.refetch()
              : () => navigate("/spaces/new")
          }
          loading={filter === "invited" ? spacesQuery.isFetching : false}
          icon={faBorderNone}
        />
      ) : (
        <div className="space-y-3">
          {allSpaces.map((space: SpaceDto) => (
            <SpaceCard
              key={space.id}
              space={space}
              selectable={selectionMode}
              selected={selectedIds.has(space.id)}
              canSelect={canSelect(space)}
              onSelect={toggleSelect}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <Button
            onClick={() => spacesQuery.fetchNextPage()}
            disabled={
              !spacesQuery.hasNextPage || spacesQuery.isFetchingNextPage
            }
            variant="outlined"
            loading={spacesQuery.isFetchingNextPage}
          >
            {spacesQuery.isFetchingNextPage ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}

      {/* Bottom drawer for bulk actions */}
      <div
        className={
          "fixed left-0 right-0 bottom-0 transition-transform duration-300 " +
          (selectionMode ? "translate-y-0" : "translate-y-full")
        }
      >
        <div className="mx-auto max-w-4xl px-4 pb-6 pt-4 md:px-6">
          <div className="rounded-2xl border border-gray-200 bg-white/90 backdrop-blur p-4 shadow-lg">
            <div className="flex items-center justify-between gap-3 pl-2 lg:pl-4">
              <div className="text-sm text-gray-700">
                {selectedIds.size} selected
              </div>
              <div className="flex items-center gap-3">
                <Button
                  color="red"
                  variant="filled"
                  size="md"
                  disabled={selectedIds.size === 0}
                  onClick={() =>
                    navigate("/spaces/delete", {
                      state: {
                        spaces: selectedSpaces.map((s) => ({
                          id: s.id,
                          name: s.name,
                        })),
                        tab: selected,
                      },
                    })
                  }
                >
                  <FontAwesomeIcon icon={faTrash} className="mr-2" />
                  Delete
                  <span className="hidden lg:inline"> Spaces</span>
                </Button>
                <IconButton
                  variant="text"
                  color="gray"
                  className="rounded-md h-10 w-10"
                  aria-label="Exit selection"
                  onClick={() => {
                    setSelectionMode(false);
                    setSelectedIds(new Set());
                  }}
                >
                  <FontAwesomeIcon icon={faXmark} />
                </IconButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
