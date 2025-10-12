export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function apiFetch<TResponse>(
  path: string,
  init?: RequestInit
): Promise<TResponse> {
  const hasBody = typeof init?.body !== "undefined" && init?.body !== null;
  const headers = {
    ...(hasBody ? { "Content-Type": "application/json" } : {}),
    ...(init?.headers || {}),
  } as Record<string, string>;

  const res = await fetch(path, {
    credentials: "include",
    headers,
    ...init,
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const body = isJson
    ? await res.json().catch(() => ({}))
    : await res.text().catch(() => "");

  if (!res.ok) {
    // Try to provide a specific message if the API returned structured errors
    let message = `Request failed with status ${res.status}`;
    if (isJson) {
      const b = body as any;
      if (b?.error && typeof b.error === "string") message = b.error;
      else if (Array.isArray(b?.errors) && b.errors.length > 0) {
        message = String(b.errors[0]);
      }
    } else if (typeof body === "string" && body.trim().length > 0) {
      message = body as string;
    }
    throw new ApiError(message, res.status, body);
  }

  return isJson ? (body as TResponse) : ({} as TResponse);
}

// Auth endpoints
export const authApi = {
  login: (payload: { email: string; password: string }) =>
    apiFetch<{ user: unknown }>(`/api/v1/login`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  signup: (payload: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    passwordConfirmation: string;
  }) =>
    apiFetch<{ user: unknown }>(`/api/v1/signup`, {
      method: "POST",
      body: JSON.stringify({
        user: {
          first_name: payload.firstName,
          last_name: payload.lastName,
          email: payload.email,
          password: payload.password,
          password_confirmation: payload.passwordConfirmation,
        },
      }),
    }),
  logout: () =>
    apiFetch<void>(`/api/v1/logout`, {
      method: "DELETE",
    }),
};

// Spaces endpoints
export type SpacesFilter = "all" | "created" | "invited";
export interface SpaceDto {
  id: number;
  name: string;
  createdAt: string;
  createdById: number;
  createdByName: string;
  createdByAvatarUrl?: string | null;
  role?: "member" | "admin" | null;
  transactionsCount: number;
  lastTransactionAt: string | null;
  colorHex?: string | null;
  description?: string | null;
}
export interface SpacesResponse {
  spaces: SpaceDto[];
  lastCursor: string | null;
  hasMore: boolean;
}

export interface SpaceMemberDto {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: "member" | "admin";
}

export interface DeletedSpaceDto {
  id: number;
  name: string;
  deletedAt: string;
  purgeAfterAt: string;
}
export interface RecentlyDeletedSpacesResponse {
  spaces: DeletedSpaceDto[];
  lastCursor: string | null;
  hasMore: boolean;
}

export interface SpaceSummaryMemberDto {
  id: number;
  name: string;
  avatarUrl?: string | null;
  spendAmount: string; // $xx.xx
  creditAmount: string; // $xx.xx
  fullCoverAmount: string; // $xx.xx
  transactionsCount: number;
}
export interface SpaceSummaryDto {
  space: {
    totalTransactions: number;
    totalSpend: string; // $xx.xx
    totalCredit: string; // $xx.xx
  };
  members: SpaceSummaryMemberDto[];
}

export const spacesApi = {
  list: async (params: { filter: SpacesFilter; cursor?: string | null }) => {
    const url = new URL(`/api/v1/spaces`, window.location.origin);
    url.searchParams.set("filter", params.filter);
    if (params.cursor) url.searchParams.set("cursor", params.cursor);
    const path = url.toString().replace(window.location.origin, "");
    return apiFetch<SpacesResponse>(path, { method: "GET" });
  },
  checkName: async (name: string) => {
    const url = new URL(`/api/v1/spaces/check_name`, window.location.origin);
    url.searchParams.set("name", name);
    const path = url.toString().replace(window.location.origin, "");
    return apiFetch<{ available: boolean }>(path, { method: "GET" });
  },
  create: async (payload: { name: string; description?: string | null }) => {
    return apiFetch<{
      space: {
        id: number;
        name: string;
        description?: string | null;
        createdAt: string;
        colorHex?: string | null;
      };
    }>(`/api/v1/spaces`, {
      method: "POST",
      body: JSON.stringify({
        name: payload.name,
        description: payload.description ?? null,
      }),
    });
  },
  members: async (spaceId: number) => {
    return apiFetch<{ members: SpaceMemberDto[] }>(
      `/api/v1/spaces/${spaceId}/members`,
      { method: "GET" }
    );
  },
  invite: async (spaceId: number, email: string) => {
    return apiFetch<{ success?: boolean; message?: string }>(
      `/api/v1/spaces/${spaceId}/invite`,
      {
        method: "POST",
        body: JSON.stringify({ email }),
      }
    );
  },
  removeMember: async (spaceId: number, userId: number) => {
    const url = new URL(
      `/api/v1/spaces/${spaceId}/remove_member`,
      window.location.origin
    );
    url.searchParams.set("user_id", String(userId));
    const path = url.toString().replace(window.location.origin, "");
    return apiFetch<{ success: boolean }>(path, { method: "DELETE" });
  },
  recentlyDeleted: async (params: { cursor?: string | null }) => {
    const url = new URL(
      `/api/v1/spaces/recently_deleted`,
      window.location.origin
    );
    if (params.cursor) url.searchParams.set("cursor", params.cursor);
    const path = url.toString().replace(window.location.origin, "");
    return apiFetch<RecentlyDeletedSpacesResponse>(path, { method: "GET" });
  },
  bulkDelete: async (ids: number[]) => {
    return apiFetch<{ deleted: number[]; skipped: number[] }>(
      `/api/v1/spaces/bulk_delete`,
      {
        method: "DELETE",
        body: JSON.stringify({ ids }),
      }
    );
  },
  recover: async (spaceId: number) => {
    return apiFetch<{ success: boolean }>(`/api/v1/spaces/${spaceId}/recover`, {
      method: "POST",
    });
  },
  bulkRecover: async (ids: number[]) => {
    return apiFetch<{ recovered: number[]; skipped: number[] }>(
      `/api/v1/spaces/bulk_recover`,
      { method: "POST", body: JSON.stringify({ ids }) }
    );
  },
  purge: async (spaceId: number) => {
    return apiFetch<void>(`/api/v1/spaces/${spaceId}/purge`, {
      method: "DELETE",
    });
  },
  bulkPurge: async (ids: number[]) => {
    return apiFetch<{ purged: number[]; skipped: number[] }>(
      `/api/v1/spaces/bulk_purge`,
      { method: "DELETE", body: JSON.stringify({ ids }) }
    );
  },
  show: async (spaceId: number) => {
    return apiFetch<{ space: SpaceDto }>(`/api/v1/spaces/${spaceId}`, {
      method: "GET",
    });
  },
  summary: async (spaceId: number) => {
    return apiFetch<{ summary: SpaceSummaryDto }>(
      `/api/v1/spaces/${spaceId}/summary`,
      { method: "GET" }
    );
  },
};

// Transactions endpoints
export interface TransactionDto {
  id: number;
  title: string;
  description?: string | null;
  amount: string; // signed decimal string
  occurredAt: string; // ISO
  createdAt: string; // ISO
  creator: { id: number; name: string; avatarUrl?: string | null };
  fullCover: boolean;
}
export interface TransactionsResponse {
  transactions: TransactionDto[];
  lastCursor: string | null;
  hasMore: boolean;
}

export const transactionsApi = {
  list: async (spaceId: number, params: { cursor?: string | null } = {}) => {
    const url = new URL(
      `/api/v1/spaces/${spaceId}/transactions`,
      window.location.origin
    );
    if (params.cursor) url.searchParams.set("cursor", params.cursor);
    const path = url.toString().replace(window.location.origin, "");
    return apiFetch<TransactionsResponse>(path, { method: "GET" });
  },
  create: async (
    spaceId: number,
    payload: {
      title: string;
      description?: string | null;
      amount: string; // send signed string
      occurred_at: string; // ISO date or datetime
      full_cover?: boolean;
    }
  ) => {
    return apiFetch<{ transaction: TransactionDto }>(
      `/api/v1/spaces/${spaceId}/transactions`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },
  show: async (spaceId: number, id: number) => {
    return apiFetch<{ transaction: TransactionDto }>(
      `/api/v1/spaces/${spaceId}/transactions/${id}`,
      { method: "GET" }
    );
  },
  delete: async (spaceId: number, id: number) => {
    return apiFetch<{ deleted: boolean }>(
      `/api/v1/spaces/${spaceId}/transactions/${id}`,
      { method: "DELETE" }
    );
  },
};

// Activity History endpoints
export interface ActivityActorDto {
  id: number;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
}

export interface ActivitySubjectDto {
  type?: string | null;
  id?: number | null;
}

export interface ActivityEventDto {
  id: number;
  verb: string;
  createdAt: string; // ISO
  actor?: ActivityActorDto | null;
  subject: ActivitySubjectDto;
  metadata: Record<string, unknown>;
}

export interface ActivityUnseenResponse {
  items: ActivityEventDto[];
  lastCursor?: number | null;
  hasMore: boolean;
}

export const activityHistoryApi = {
  unseen: async (spaceId: number, params: { cursor?: number | null } = {}) => {
    const url = new URL(
      `/api/v1/spaces/${spaceId}/history/unseen`,
      window.location.origin
    );
    if (params.cursor) url.searchParams.set("cursor", String(params.cursor));
    const path = url.toString().replace(window.location.origin, "");
    return apiFetch<ActivityUnseenResponse>(path, { method: "GET" });
  },
  markSeen: async (spaceId: number) => {
    return apiFetch<{ lastSeenActivityId: number }>(
      `/api/v1/spaces/${spaceId}/history/mark_seen`,
      { method: "POST" }
    );
  },
};
