import type { FinanceStoreData } from "./store";

export type AuthToken = {
  access_token: string;
  token_type: "bearer";
};

export type ApiError = {
  status: number;
  message: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getApiBaseUrl(): string {
  // Prefer explicit backend URL; fallback to localhost for local dev.
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  return env?.VITE_BACKEND_URL ?? "http://127.0.0.1:8000";
}

async function readJsonOrText(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function ensureOk(res: Response): Promise<unknown> {
  if (res.ok) return readJsonOrText(res);
  const body = await readJsonOrText(res);
  const message =
    typeof body === "string"
      ? body
      : isRecord(body) && "detail" in body
        ? JSON.stringify(body.detail)
        : JSON.stringify(body ?? {});
  const err: ApiError = { status: res.status, message };
  throw err;
}

export async function apiRegister(email: string, password: string): Promise<AuthToken> {
  const res = await fetch(`${getApiBaseUrl()}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return (await ensureOk(res)) as AuthToken;
}

export async function apiLogin(email: string, password: string): Promise<AuthToken> {
  const res = await fetch(`${getApiBaseUrl()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return (await ensureOk(res)) as AuthToken;
}

export async function apiGetMyFinance(token: string): Promise<FinanceStoreData> {
  const res = await fetch(`${getApiBaseUrl()}/v1/finance/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const json = await ensureOk(res);
  if (isRecord(json) && "data" in json) return (json.data ?? {}) as FinanceStoreData;
  return {} as FinanceStoreData;
}

export async function apiPutMyFinance(token: string, data: FinanceStoreData): Promise<FinanceStoreData> {
  const res = await fetch(`${getApiBaseUrl()}/v1/finance/me`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data }),
  });
  const json = await ensureOk(res);
  if (isRecord(json) && "data" in json) return (json.data ?? {}) as FinanceStoreData;
  return {} as FinanceStoreData;
}
