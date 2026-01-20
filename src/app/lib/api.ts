// src/app/lib/api.ts
// GraphQL fetch wrapper (FE-ready for: access token in Authorization header + refresh token in httpOnly cookie)

export type GraphQLErrorExtensions = {
  code?: string;
  field?: string;
  [key: string]: unknown;
};

export type GraphQLErrorItem = {
  message: string;
  extensions?: GraphQLErrorExtensions;
};

export class ApiError extends Error {
  code?: string;
  field?: string;
  errors?: GraphQLErrorItem[];

  constructor(message: string, opts?: { code?: string; field?: string; errors?: GraphQLErrorItem[] }) {
    super(message);
    this.name = "ApiError";
    this.code = opts?.code;
    this.field = opts?.field;
    this.errors = opts?.errors;
  }
}

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:4000/graphql";

export async function gql<TData>(
  query: string,
  variables?: Record<string, unknown>,
  opts?: { accessToken?: string | null; signal?: AbortSignal }
): Promise<TData> {
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    credentials: "include", // ✅ needed for refresh cookie
    headers: {
      "Content-Type": "application/json",
      ...(opts?.accessToken ? { Authorization: `Bearer ${opts.accessToken}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
    signal: opts?.signal,
  });

  // If server is down / proxy issues etc.
  if (!res.ok) {
    throw new ApiError(`Request failed (${res.status})`, { code: String(res.status) });
  }

  const json = (await res.json()) as {
    data?: TData;
    errors?: GraphQLErrorItem[];
  };

  if (json.errors?.length) {
    const first = json.errors[0];
    throw new ApiError(first.message ?? "GraphQL error", {
      code: first.extensions?.code,
      field: first.extensions?.field,
      errors: json.errors,
    });
  }

  if (!json.data) {
    throw new ApiError("No data returned from API");
  }

  return json.data;
}