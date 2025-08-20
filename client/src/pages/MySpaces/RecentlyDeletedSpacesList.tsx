import React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { spacesApi } from "../../lib/api";
import type { DeletedSpaceDto } from "../../lib/api";
import { DeletedSpaceCard } from "./DeletedSpaceCard";
import { EmptySpacesIndicator } from "./common";
import { faBorderNone } from "@fortawesome/free-solid-svg-icons";
import { Button as MTButton } from "@material-tailwind/react";
import { MySpacesHeader } from "./MySpacesHeader";
import type { MenuKey } from "./menu";

export const RecentlyDeletedSpacesList: React.FC<{
  selected: MenuKey;
  onSelect?: (k: MenuKey) => void;
}> = ({ selected, onSelect }) => {
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

  return (
    <>
      <MySpacesHeader
        title="Recently Deleted"
        selected={selected}
        onSelect={onSelect}
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
            <DeletedSpaceCard key={space.id} space={space} />
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
    </>
  );
};
