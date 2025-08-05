import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Typography,
  Spinner,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemPrefix,
} from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import { Logo } from "../components/Logo";
import { Button } from "../components/ui/Button";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRotateRight,
  faArrowUpRightFromSquare,
  faLayerGroup,
  faUser,
  faUsers,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { useUserInfo } from "../hooks";

// Enable human readable times, e.g., "5 minutes ago", "yesterday"
dayjs.extend(relativeTime);

// Types matching backend `Api::V1::SpacesController#index`
interface SpaceDto {
  id: number;
  name: string;
  createdAt: string;
  createdById: number;
  transactionsCount: number;
  lastTransactionAt: string | null;
}

interface SpacesResponse {
  spaces: SpaceDto[];
  lastCursor: string | null;
  hasMore: boolean;
}

type SpacesFilter = "all" | "created" | "invited";

const MENU_ITEMS: Array<{
  key: SpacesFilter;
  label: string;
  icon: IconDefinition;
}> = [
  { key: "all", label: "All Spaces", icon: faLayerGroup },
  { key: "created", label: "Created by Me", icon: faUser },
  { key: "invited", label: "Shared with Me", icon: faUsers },
];

function formatLastActivity(ts: string | null): string {
  if (!ts) return "last activity: --";
  try {
    return `last activity: ${dayjs(ts).fromNow()}`;
  } catch {
    return "last activity: --";
  }
}

const EmptyState: React.FC<{
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  loading?: boolean;
}> = ({ title, subtitle, onRefresh, loading }) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
    <Typography variant="h5" className="font-semibold text-gray-900">
      {title}
    </Typography>
    {subtitle && (
      <Typography variant="small" className="mt-2 text-gray-600">
        {subtitle}
      </Typography>
    )}
    {onRefresh && (
      <Button
        onClick={onRefresh}
        disabled={loading}
        className="mt-6"
        variant="outlined"
        color="primary"
      >
        {loading ? "Refreshing..." : "Refresh"}
      </Button>
    )}
  </div>
);

const SpaceCard: React.FC<{ space: SpaceDto }> = ({ space }) => {
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
            {space.transactionsCount} tx
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
          <span>creator id: {space.createdById}</span>
          <span className="hidden text-gray-300 md:inline">•</span>
          <span>{formatLastActivity(space.lastTransactionAt)}</span>
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
  const { logout } = useUserInfo();

  const [selected, setSelected] = useState<SpacesFilter>("all");
  const [spaces, setSpaces] = useState<SpaceDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const headerTitle = useMemo(
    () => MENU_ITEMS.find((m) => m.key === selected)?.label || "My Spaces",
    [selected]
  );

  const loadSpaces = useCallback(
    async (opts?: { reset?: boolean }) => {
      const reset = opts?.reset ?? false;
      if (reset) {
        setSpaces([]);
        setCursor(null);
        setHasMore(false);
      }
      setLoading(true);
      setError(null);
      try {
        const url = new URL("/api/v1/spaces", window.location.origin);
        url.searchParams.set("filter", selected);
        if (!reset && cursor) url.searchParams.set("cursor", cursor);
        const res = await fetch(
          url.toString().replace(window.location.origin, ""),
          {
            credentials: "include",
          }
        );
        if (res.status === 401) {
          navigate("/login");
          return;
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({} as any));
          throw new Error((data as any).error || "Failed to load spaces");
        }
        const data: SpacesResponse = await res.json();
        setSpaces((prev) => (reset ? data.spaces : [...prev, ...data.spaces]));
        setCursor(data.lastCursor);
        setHasMore(data.hasMore);
      } catch (err: any) {
        setError(err.message || "Unexpected error");
      } finally {
        setLoading(false);
      }
    },
    [selected, cursor, navigate]
  );

  useEffect(() => {
    loadSpaces({ reset: true });
  }, [selected]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex items-center gap-4 px-4 py-3 md:px-6">
          <Logo className="justify-start" />
          <div className="ml-auto flex items-center gap-2">
            <Tooltip content="Reload">
              <IconButton
                onClick={() => loadSpaces({ reset: true })}
                disabled={loading}
                className="rounded-full bg-gray-100 text-gray-900 shadow-none hover:bg-gray-200"
              >
                {loading ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <FontAwesomeIcon icon={faArrowRotateRight} />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip content="Sign out">
              <IconButton
                onClick={() => logout()}
                className="rounded-full bg-gray-100 text-gray-900 shadow-none hover:bg-gray-200"
              >
                <FontAwesomeIcon icon={faRightFromBracket} />
              </IconButton>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto grid grid-cols-1 gap-12 2xl:gap-16 px-4 py-6 md:grid-cols-12 md:px-8 lg:px-12 2xl:px-16">
        {/* Left sticky menu */}
        <aside className="md:col-span-5 lg:col-span-4 xl:col-span-3">
          <div className="sticky top-24 mt-2">
            <List className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
              {MENU_ITEMS.map((item) => {
                const isActive = item.key === selected;
                return (
                  <ListItem
                    key={item.key}
                    onClick={() => setSelected(item.key)}
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
          </div>
        </aside>

        {/* Right list */}
        <main className="md:col-span-7 lg:col-span-8 xl:col-span-9">
          <div className="mb-4 mt-2">
            <Typography variant="h4" className="font-bold text-gray-900">
              {headerTitle}
            </Typography>
            <Typography variant="small" className="mt-1 text-gray-600">
              Manage and review your expense spaces
            </Typography>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
              {error}
            </div>
          )}

          {spaces.length === 0 && !loading ? (
            <EmptyState
              title="No spaces yet"
              subtitle="Create a space from the app to get started."
              onRefresh={() => loadSpaces({ reset: true })}
              loading={loading}
            />
          ) : (
            <div className="space-y-3">
              {spaces.map((space) => (
                <SpaceCard
                  key={`${space.id}-${space.createdById}`}
                  space={space}
                />
              ))}
            </div>
          )}

          {/* Load more */}
          {hasMore && (
            <div className="mt-6 flex justify-center">
              <Button
                onClick={() => loadSpaces()}
                disabled={loading}
                variant="outlined"
              >
                {loading ? "Loading..." : "Load more"}
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export { MySpacesPage };
