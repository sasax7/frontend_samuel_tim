import { apiPutMyFinance } from "./api";
import type { FinanceStoreData } from "./store";
import { createDefaultFinanceData } from "./store";

const CACHE_KEY = "finance_backend_cache_v1";
const PENDING_KEY = "finance_backend_pending_v1";
const onlineSyncTokens = new Set<string>();

function safeRead(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn(`[finance] localStorage read failed for ${key}`, e);
    return null;
  }
}

function safeWrite(key: string, value: string | null) {
  try {
    if (value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  } catch (e) {
    console.warn(`[finance] localStorage write failed for ${key}`, e);
  }
}

export function readCachedFinance(): FinanceStoreData {
  const raw = safeRead(CACHE_KEY);
  if (!raw) return createDefaultFinanceData();
  try {
    return JSON.parse(raw) as FinanceStoreData;
  } catch {
    return createDefaultFinanceData();
  }
}

export function writeCachedFinance(data: FinanceStoreData) {
  safeWrite(CACHE_KEY, JSON.stringify(data));
}

export function readPendingFinance(): FinanceStoreData | null {
  const raw = safeRead(PENDING_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FinanceStoreData;
  } catch {
    return null;
  }
}

export function writePendingFinance(data: FinanceStoreData | null) {
  if (!data) {
    safeWrite(PENDING_KEY, null);
    return;
  }
  safeWrite(PENDING_KEY, JSON.stringify(data));
}

export async function syncPendingFinance(token: string) {
  const pending = readPendingFinance();
  if (!pending) return;
  await apiPutMyFinance(token, pending);
  writePendingFinance(null);
  writeCachedFinance(pending);
}

export function registerOnlineSync(token: string) {
  if (onlineSyncTokens.has(token)) return;
  onlineSyncTokens.add(token);
  window.addEventListener("online", () => {
    syncPendingFinance(token).catch((e) => {
      console.warn("[finance] online sync failed", e);
    });
  });
}
