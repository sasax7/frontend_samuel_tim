import type { FinanceStore, FinanceStoreData } from "./store";
import { createLocalFinanceStore, createDefaultFinanceData } from "./store";
import { apiGetMyFinance, apiPutMyFinance } from "./api";
import { getAccessToken } from "@/features/auth/session";
import { readCachedFinance, writeCachedFinance, writePendingFinance, syncPendingFinance, registerOnlineSync } from "./offlineSync";

const localStore = createLocalFinanceStore();

function createBackendFinanceStore(token: string): FinanceStore {
  registerOnlineSync(token);

  async function get(): Promise<FinanceStoreData> {
    try {
      // attempt to flush pending first; ignore failure here (will retry online event)
      await syncPendingFinance(token);

      const data = await apiGetMyFinance(token);
      if (!data || !data.version) {
        const fallback = createDefaultFinanceData();
        writeCachedFinance(fallback);
        return fallback;
      }
      writeCachedFinance(data);
      writePendingFinance(null);
      return data;
    } catch (e) {
      console.warn("[finance] falling back to cached finance data", e);
      const cached = readCachedFinance();
      return cached ?? createDefaultFinanceData();
    }
  }

  async function set(next: FinanceStoreData): Promise<void> {
    try {
      await apiPutMyFinance(token, next);
      writeCachedFinance(next);
      writePendingFinance(null);
    } catch (e) {
      // optimistic: cache locally + queue for retry
      writeCachedFinance(next);
      writePendingFinance(next);
      console.warn("[finance] queued finance changes for retry", e);
    }
  }

  // We can reuse the same convenience helpers by reading/mutating/writing.
  return {
    get,
    set,

    async upsertCategory(category) {
      const data = await get();
      await set({ ...data, categories: [...data.categories.filter((c) => c.id !== category.id), category] });
    },
    async deleteCategory(categoryId) {
      const data = await get();
      await set({ ...data, categories: data.categories.filter((c) => c.id !== categoryId) });
    },
    async upsertExpense(expense) {
      const data = await get();
      await set({ ...data, expenses: [...data.expenses.filter((e) => e.id !== expense.id), expense] });
    },
    async deleteExpense(expenseId) {
      const data = await get();
      await set({ ...data, expenses: data.expenses.filter((e) => e.id !== expenseId) });
    },
    async upsertIncome(income) {
      const data = await get();
      await set({ ...data, incomes: [...data.incomes.filter((i) => i.id !== income.id), income] });
    },
    async deleteIncome(incomeId) {
      const data = await get();
      await set({ ...data, incomes: data.incomes.filter((i) => i.id !== incomeId) });
    },
    async upsertRecurringBill(bill) {
      const data = await get();
      await set({ ...data, recurringBills: [...data.recurringBills.filter((b) => b.id !== bill.id), bill] });
    },
    async deleteRecurringBill(billId) {
      const data = await get();
      await set({ ...data, recurringBills: data.recurringBills.filter((b) => b.id !== billId) });
    },
    async upsertNetWorthSnapshot(snapshot) {
      const data = await get();
      await set({ ...data, netWorth: [...data.netWorth.filter((s) => s.id !== snapshot.id), snapshot] });
    },
    async deleteNetWorthSnapshot(snapshotId) {
      const data = await get();
      await set({ ...data, netWorth: data.netWorth.filter((s) => s.id !== snapshotId) });
    },
  };
}

export function getActiveFinanceStore(explicitToken?: string): FinanceStore {
  const token = explicitToken ?? getAccessToken();
  if (!token) return localStore;
  return createBackendFinanceStore(token);
}
