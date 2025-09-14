import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Button } from "../../components/ui/Button";
import {
  faBorderNone,
  faPlus,
  faEllipsis,
  faTrash,
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
import { FloatingBottomDrawer } from "../../components";

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

      {spacesQuery.isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading... =^ω^=</p>
          </div>
        </div>
      ) : allSpaces.length === 0 ? (
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
            Load More
          </Button>
        </div>
      )}

      <div className="py-14" />

      <FloatingBottomDrawer
        open={selectionMode}
        prompt={<span>{selectedIds.size} selected</span>}
        onExit={() => {
          setSelectionMode(false);
          setSelectedIds(new Set());
        }}
      >
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
      </FloatingBottomDrawer>
    </>
  );
};
