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
    const message =
      (isJson ? (body as any)?.error : String(body)) ||
      `Request failed with status ${res.status}`;
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
  createdByName: string;
  role?: "member" | "admin" | null;
  transactionsCount: number;
  lastTransactionAt: string | null;
}
export interface SpacesResponse {
  spaces: SpaceDto[];
  lastCursor: string | null;
  hasMore: boolean;
}

export const spacesApi = {
  list: async (params: { filter: SpacesFilter; cursor?: string | null }) => {
    const url = new URL(`/api/v1/spaces`, window.location.origin);
    url.searchParams.set("filter", params.filter);
    if (params.cursor) url.searchParams.set("cursor", params.cursor);
    const path = url.toString().replace(window.location.origin, "");
    return apiFetch<SpacesResponse>(path, { method: "GET" });
  },
};
