import React, { useEffect, useMemo, useState } from "react";
import {
  Typography,
  Spinner,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemPrefix,
  Menu,
  MenuHandler,
  MenuList,
} from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import { AppNavbar } from "../components";
import { Button } from "../components/ui/Button";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUpRightFromSquare,
  faLayerGroup,
  faUser,
  faUsers,
  faBorderNone,
  faChevronDown,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import type { SpaceDto, SpacesFilter } from "../lib/api";
import { useInfiniteQuery } from "@tanstack/react-query";
import { spacesApi } from "../lib/api";

// Enable human readable times, e.g., "5 minutes ago", "yesterday"
dayjs.extend(relativeTime);

function formatLastActivity(ts: string | null): string {
  if (!ts) return "N/A";
  try {
    return dayjs(ts).fromNow();
  } catch {
    return "N/A";
  }
}

const MENU_ITEMS: Array<{
  key: SpacesFilter;
  label: string;
  icon: IconDefinition;
}> = [
  { key: "all", label: "All Spaces", icon: faLayerGroup },
  { key: "created", label: "Created by Me", icon: faUser },
  { key: "invited", label: "Shared with Me", icon: faUsers },
];

const EmptyState: React.FC<{
  title: string;
  subtitle?: string;
  onButtonClick?: () => void;
  loading?: boolean;
  icon?: IconDefinition;
  buttonLabel?: string;
}> = ({ title, subtitle, onButtonClick, loading, icon, buttonLabel }) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
    {icon && (
      <div className="mb-4">
        <FontAwesomeIcon icon={icon} className="text-secondary text-6xl" />
      </div>
    )}
    <Typography variant="h5" className="font-semibold text-gray-900">
      {title}
    </Typography>
    {subtitle && (
      <Typography variant="small" className="mt-2 text-gray-600">
        {subtitle}
      </Typography>
    )}
    {onButtonClick && (
      <Button
        onClick={onButtonClick}
        disabled={loading}
        className="mt-6"
        variant="outlined"
        color="primary"
        loading={loading}
      >
        {buttonLabel ?? "Refresh"}
      </Button>
    )}
  </div>
);

const SpacesMenuList: React.FC<{
  selected: SpacesFilter;
  onSelect: (value: SpacesFilter) => void;
  onItemSelected?: () => void;
  className?: string;
}> = ({ selected, onSelect, onItemSelected, className }) => {
  return (
    <List
      className={twMerge(
        "rounded-xl border border-gray-200 bg-white p-2 shadow-sm",
        className
      )}
    >
      {MENU_ITEMS.map((item) => {
        const isActive = item.key === selected;
        return (
          <ListItem
            key={item.key}
            onClick={() => {
              onSelect(item.key);
              onItemSelected?.();
            }}
            className={twMerge(
              "group relative flex items-center gap-3 rounded-lg px-3 py-3 text-gray-800",
              "transition-all",
              isActive
                ? "bg-secondary/10 hover:bg-secondary/15 focus:bg-secondary/10 shadow-sm before:absolute before:left-0 before:top-0 before:h-full before:w-1.5 before:bg-secondary"
                : "hover:bg-secondary/5"
            )}
          >
            <ListItemPrefix>
              <span
                className={twMerge(
                  "grid h-8 w-8 place-items-center rounded-md",
                  isActive
                    ? "bg-white/2 bg-secondary/5 text-secondary"
                    : "bg-gray-100 text-gray-700 group-hover:bg-secondary/10 group-hover:text-secondary"
                )}
              >
                <FontAwesomeIcon icon={item.icon} />
              </span>
            </ListItemPrefix>
            <span
              className={twMerge(
                "font-medium",
                isActive ? "text-gray-900" : "text-gray-800"
              )}
            >
              {item.label}
            </span>
          </ListItem>
        );
      })}
    </List>
  );
};

const SpaceCard: React.FC<{ space: SpaceDto }> = ({ space }) => {
  const roleLabel = space.role
    ? space.role.charAt(0).toUpperCase() + space.role.slice(1)
    : "N/A";
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <Typography
            variant="h6"
            className="truncate font-semibold text-gray-900"
          >
            {space.name}
          </Typography>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
            {space.transactionsCount} transactions
          </span>
        </div>
        <div className="mt-1 grid grid-cols-1 gap-y-1 text-sm text-gray-600 md:grid-cols-3 md:gap-x-4">
          <span>
            <span className="text-gray-700">Space Owner:</span>{" "}
            <span className="font-medium text-gray-800">
              {space.createdByName || "--"}
            </span>
          </span>
          <span>
            <span className="text-gray-700">Your Role:</span>{" "}
            <span
              className={twMerge(
                "rounded px-1.5 py-0.5 text-xs font-medium",
                space.role === "admin"
                  ? "bg-primary/10 text-primary"
                  : space.role === "member"
                  ? "bg-gray-100 text-gray-800"
                  : "bg-gray-50 text-gray-500"
              )}
            >
              {roleLabel}
            </span>
          </span>
          <span>
            <span className="text-gray-700">Last Activity:</span>{" "}
            <span className="font-medium text-gray-800">
              {formatLastActivity(space.lastTransactionAt)}
            </span>
          </span>
        </div>
      </div>
      <Tooltip content="Open">
        <IconButton className="rounded-full bg-gray-100 text-gray-900 shadow-none hover:bg-gray-200">
          <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
        </IconButton>
      </Tooltip>
    </div>
  );
};

const MySpacesPage: React.FC = () => {
  const navigate = useNavigate();

  const [selected, setSelected] = useState<SpacesFilter>("all");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const headerTitle = useMemo(
    () => MENU_ITEMS.find((m) => m.key === selected)?.label || "My Spaces",
    [selected]
  );

  const spacesQuery = useInfiniteQuery({
    queryKey: ["spaces", selected],
    queryFn: ({ pageParam }) =>
      spacesApi.list({ filter: selected, cursor: pageParam ?? null }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
    initialPageParam: null as string | null,
  });

  const allSpaces: SpaceDto[] = (spacesQuery.data?.pages || []).flatMap(
    (p: { spaces: SpaceDto[] }) => p.spaces
  );
  const hasMore: boolean = spacesQuery.data?.pages?.at(-1)?.hasMore ?? false;

  const refresh = () => spacesQuery.refetch();

  useEffect(() => {
    if ((spacesQuery.error as any)?.status === 401) {
      navigate("/login");
    }
  }, [spacesQuery.error, navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavbar />

      {/* Content */}
      <div className="mx-auto grid grid-cols-1 gap-12 2xl:gap-16 px-4 py-6 md:grid-cols-12 md:px-8 lg:px-12 2xl:px-16">
        {/* Left sticky menu (hidden on mobile) */}
        <aside className="hidden md:block md:col-span-5 lg:col-span-4 xl:col-span-3">
          <div className="sticky top-24 mt-2">
            <SpacesMenuList selected={selected} onSelect={setSelected} />
          </div>
        </aside>

        {/* Right list */}
        <main className="md:col-span-7 lg:col-span-8 xl:col-span-9">
          <div className="flex justify-start md:justify-between flex-col md:flex-row">
            <div className="mb-4 mt-2">
              <div className="flex items-center gap-2">
                <Typography variant="h4" className="font-bold text-gray-900">
                  {headerTitle}
                </Typography>
                {/* Mobile menu trigger */}
                <Menu open={isMobileMenuOpen} handler={setIsMobileMenuOpen}>
                  <MenuHandler>
                    <IconButton
                      className="md:hidden rounded-full bg-gray-100 text-gray-900 shadow-none hover:bg-gray-200"
                      aria-label="Change view"
                    >
                      {spacesQuery.isFetching ? (
                        <Spinner className="h-4 w-4" />
                      ) : (
                        <FontAwesomeIcon
                          icon={faChevronDown}
                          rotation={isMobileMenuOpen ? 180 : undefined}
                          className="transition-transform duration-300"
                        />
                      )}
                    </IconButton>
                  </MenuHandler>
                  <MenuList className="p-2">
                    <div className="min-w-[240px]">
                      <SpacesMenuList
                        selected={selected}
                        onSelect={setSelected}
                        onItemSelected={() => setIsMobileMenuOpen(false)}
                        className="border-0 shadow-none p-0"
                      />
                    </div>
                  </MenuList>
                </Menu>
              </div>
              <Typography variant="small" className="mt-1 text-gray-600">
                Manage and review your expense spaces
              </Typography>
            </div>
            <div className="mb-4 flex md:items-center md:justify-center">
              <Button
                size="md"
                variant="outlined"
                fullWidth
                onClick={() => navigate("/spaces/new")}
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                New Space
              </Button>
            </div>
          </div>

          {spacesQuery.isError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
              {spacesQuery.error?.message || "Failed to load"}
            </div>
          )}

          {allSpaces.length === 0 && !spacesQuery.isLoading ? (
            <EmptyState
              title="No spaces yet"
              subtitle="Create a space from the app to get started."
              buttonLabel={selected === "invited" ? undefined : "Create"}
              onButtonClick={
                selected === "invited"
                  ? () => refresh()
                  : () => navigate("/spaces/new")
              }
              loading={selected === "invited" ? spacesQuery.isFetching : false}
              icon={faBorderNone}
            />
          ) : (
            <div className="space-y-3">
              {allSpaces.map((space: SpaceDto) => (
                <SpaceCard key={space.id} space={space} />
              ))}
            </div>
          )}

          {/* Load more */}
          {hasMore && (
            <div className="mt-6 flex justify-center">
              <Button
                onClick={() => spacesQuery.fetchNextPage()}
                disabled={
                  !spacesQuery.hasNextPage || spacesQuery.isFetchingNextPage
                }
                variant="outlined"
              >
                {spacesQuery.isFetchingNextPage ? "Loading..." : "Load more"}
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export { MySpacesPage };
