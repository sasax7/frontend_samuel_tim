import type {
  FinanceDataV1,
  FinanceCategory,
  Expense,
  Income,
  NetWorthSnapshot,
  NetWorthSnapshotV1,
  NetWorthSnapshotV2,
  RecurringBill,
} from "./types";

export type FinanceStoreData = FinanceDataV1;

export interface FinanceStore {
  get(): Promise<FinanceStoreData>;
  set(next: FinanceStoreData): Promise<void>;

  // Convenience helpers
  upsertCategory(category: FinanceCategory): Promise<void>;
  deleteCategory(categoryId: string): Promise<void>;

  upsertExpense(expense: Expense): Promise<void>;
  deleteExpense(expenseId: string): Promise<void>;

  upsertIncome(income: Income): Promise<void>;
  deleteIncome(incomeId: string): Promise<void>;

  upsertRecurringBill(bill: RecurringBill): Promise<void>;
  deleteRecurringBill(billId: string): Promise<void>;

  upsertNetWorthSnapshot(snapshot: NetWorthSnapshot): Promise<void>;
  deleteNetWorthSnapshot(snapshotId: string): Promise<void>;
}

function stableSortBy<T>(items: T[], by: (t: T) => number | string) {
  return [...items].sort((a, b) => {
    const av = by(a);
    const bv = by(b);
    return av < bv ? -1 : av > bv ? 1 : 0;
  });
}

export function createDefaultFinanceData(currency = "EUR"): FinanceStoreData {
  return {
    version: 1,
    currency,
    categories: [
      { id: "cat_groceries", name: "Lebensmittel", color: "#22c55e" },
      { id: "cat_car", name: "Auto", color: "#f97316" },
      { id: "cat_sport", name: "Sport", color: "#3b82f6" },
      { id: "cat_dog", name: "Hund", color: "#a855f7" },
      { id: "cat_rent", name: "Miete", color: "#64748b" },
      { id: "cat_subscriptions", name: "Abos", color: "#0ea5e9" },
    ],
    expenses: [],
    incomes: [],
    recurringBills: [],
    netWorth: [],
  };
}

export function createLocalFinanceStore(storageKey = "finance:data"): FinanceStore {
  type LegacyMoney = { amount?: unknown; currency?: unknown };
  type LegacyRecurringBill = {
    id?: unknown;
    name?: unknown;
    categoryId?: unknown;
    dueDay?: unknown;
    active?: unknown;
    notes?: unknown;
    startMonth?: unknown;
    amount?: LegacyMoney;
    amountHistory?: unknown;
  };

  function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
  }

  function isYearMonth(value: unknown): value is `${number}-${number}` {
    return typeof value === "string" && /^\d{4}-\d{2}$/.test(value);
  }

  function normalizeRecurringBill(raw: unknown): RecurringBill {
    // legacy shape had `amount` directly
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, "0")}`;

    const b: LegacyRecurringBill = isRecord(raw) ? (raw as LegacyRecurringBill) : {};

    if (Array.isArray(b.amountHistory) && typeof b.startMonth === "string") {
      return raw as RecurringBill;
    }

    const legacyAmount = b.amount;
    const currency = typeof legacyAmount?.currency === "string" ? legacyAmount.currency : "EUR";
    const amount = Number(typeof legacyAmount?.amount === "number" ? legacyAmount.amount : 0);

    return {
      id: typeof b.id === "string" ? b.id : String(b.id ?? "bill_unknown"),
      name: typeof b.name === "string" ? b.name : String(b.name ?? "Untitled"),
      categoryId: typeof b.categoryId === "string" ? b.categoryId : "",
      dueDay: Number(typeof b.dueDay === "number" ? b.dueDay : 1),
      startMonth: (isYearMonth(b.startMonth) ? b.startMonth : (currentMonth as `${number}-${number}`)),
      amountHistory: [
        {
          effectiveMonth: (isYearMonth(b.startMonth) ? b.startMonth : (currentMonth as `${number}-${number}`)),
          amount: { amount, currency },
        },
      ],
      active: typeof b.active === "boolean" ? b.active : Boolean(b.active ?? true),
      notes: typeof b.notes === "string" ? b.notes : undefined,
    };
  }
  function normalizeNetWorthSnapshot(s: NetWorthSnapshot): NetWorthSnapshotV2 {
    if ("groups" in s) return s;
    const legacy = s as NetWorthSnapshotV1;
    return {
      id: legacy.id,
      month: legacy.month,
      notes: legacy.notes,
      groups: [
        {
          id: "liquid",
          name: "Liquid",
          lines: legacy.lines,
        },
      ],
    };
  }

  function normalizeData(data: FinanceStoreData): FinanceStoreData {
    return {
      ...data,
      netWorth: data.netWorth.map(normalizeNetWorthSnapshot),
      recurringBills: (data.recurringBills as unknown[]).map(normalizeRecurringBill),
      incomes: Array.isArray((data as unknown as { incomes?: unknown }).incomes)
        ? (data as unknown as { incomes: Income[] }).incomes
        : [],
    };
  }

  // Some browsers / extensions can block localStorage (throws SecurityError).
  // We fall back to an in-memory store so the app still works, and we log a warning.
  let memoryFallback: string | null = null;

  function safeGetItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[finance] localStorage.getItem failed; using in-memory fallback.", e);
      return memoryFallback;
    }
  }

  function safeSetItem(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
      // keep memory in sync too
      memoryFallback = value;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[finance] localStorage.setItem failed; using in-memory fallback (NOT persisted across reload).", e);
      memoryFallback = value;
    }
  }

  async function read(): Promise<FinanceStoreData> {
    const raw = safeGetItem(storageKey);
    if (!raw) return createDefaultFinanceData();

    try {
      // Future: migrations based on version
      const parsed = JSON.parse(raw) as FinanceStoreData;
      if (!parsed || parsed.version !== 1) return createDefaultFinanceData();
      return normalizeData(parsed);
    } catch {
      return createDefaultFinanceData();
    }
  }

  async function write(next: FinanceStoreData) {
    safeSetItem(storageKey, JSON.stringify(next));
  }

  function putById<T extends { id: string }>(arr: T[], item: T): T[] {
    const idx = arr.findIndex((x) => x.id === item.id);
    if (idx === -1) return [...arr, item];
    const copy = [...arr];
    copy[idx] = item;
    return copy;
  }

  function removeById<T extends { id: string }>(arr: T[], id: string): T[] {
    return arr.filter((x) => x.id !== id);
  }

  return {
    get: read,
    set: write,

    async upsertCategory(category) {
      const data = await read();
      await write({
        ...data,
        categories: stableSortBy(putById(data.categories, category), (c) => c.name.toLowerCase()),
      });
    },

    async deleteCategory(categoryId) {
      const data = await read();
      const isUsed =
        data.expenses.some((e) => e.categoryId === categoryId) ||
        data.recurringBills.some((b) => b.categoryId === categoryId);
      if (isUsed) {
        throw new Error("Category is in use. Reassign items before deleting.");
      }
      await write({
        ...data,
        categories: removeById(data.categories, categoryId),
      });
    },

    async upsertExpense(expense) {
      const data = await read();
      await write({
        ...data,
        expenses: stableSortBy(putById(data.expenses, expense), (e) => e.date).reverse(),
      });
    },

    async deleteExpense(expenseId) {
      const data = await read();
      await write({
        ...data,
        expenses: removeById(data.expenses, expenseId),
      });
    },

    async upsertIncome(income) {
      const data = await read();
      await write({
        ...data,
        incomes: stableSortBy(putById(data.incomes, income), (i) => i.date).reverse(),
      });
    },

    async deleteIncome(incomeId) {
      const data = await read();
      await write({
        ...data,
        incomes: removeById(data.incomes, incomeId),
      });
    },

    async upsertRecurringBill(bill) {
      const data = await read();
      await write({
        ...data,
        recurringBills: stableSortBy(putById(data.recurringBills, bill), (b) => b.name.toLowerCase()),
      });
    },

    async deleteRecurringBill(billId) {
      const data = await read();
      await write({
        ...data,
        recurringBills: removeById(data.recurringBills, billId),
      });
    },

    async upsertNetWorthSnapshot(snapshot) {
      const data = await read();
      const normalized = normalizeNetWorthSnapshot(snapshot);
      await write({
        ...data,
        netWorth: stableSortBy(putById(data.netWorth, normalized), (s) => s.month),
      });
    },

    async deleteNetWorthSnapshot(snapshotId) {
      const data = await read();
      await write({
        ...data,
        netWorth: removeById(data.netWorth, snapshotId),
      });
    },
  };
}
