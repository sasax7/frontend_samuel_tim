import { useEffect, useMemo, useState } from "react";
import type { Expense, FinanceCategory, Income, NetWorthSnapshot, NetWorthSnapshotV2, YearMonth } from "@/features/finance/types";
import { getActiveFinanceStore } from "@/features/finance/activeStore";
import type { FinanceStoreData } from "@/features/finance/store";
import { uid } from "@/features/finance/id";
import { QuickBillEntry } from "@/components/finance/QuickBillEntry";
import { ExpenseLogTable } from "@/components/finance/ExpenseLogTable";
import { CategoryManager } from "@/components/finance/CategoryManager";
import { RecurringBillsManager } from "@/components/finance/RecurringBillsManager";
import { NetWorthManager, type NetWorthGroupKey } from "@/components/finance/NetWorthManager";
import { IncomeMonthMatrix } from "@/components/finance/IncomeMonthMatrix";

// NOTE: don't bind the store at module load time, because login/logout can change
// which store is active (backend vs local). We'll obtain it inside the component.

function toYearMonth(date: Date): YearMonth {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${y}-${m}` as YearMonth;
}

function isISODate(value: string): value is `${number}-${number}-${number}` {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function getOrCreateSnapshot(
  data: FinanceStoreData | null,
  month: YearMonth
): NetWorthSnapshotV2 {
  const existing = data?.netWorth.find((s) => s.month === month);
  if (existing && "groups" in existing) {
    // Defensive: make sure all expected groups exist (older data or partial snapshots).
    const expected: Array<{ id: "liquid" | "investment" | "material"; name: string }> = [
      { id: "liquid", name: "Liquid" },
      { id: "investment", name: "Investment" },
      { id: "material", name: "Material" },
    ];
    const groups = expected.map(
      (eg) => existing.groups.find((g: { id: string }) => g.id === eg.id) ?? { ...eg, lines: [] }
    );
    return { ...existing, groups };
  }

  return {
    id: `nw_${month}`,
    month,
    groups: [
      { id: "liquid", name: "Liquid", lines: [] },
      { id: "investment", name: "Investment", lines: [] },
      { id: "material", name: "Material", lines: [] },
    ],
  };
}

function upsertNetWorthSnapshotInMemory(
  prev: FinanceStoreData | null,
  snapshot: NetWorthSnapshotV2
): FinanceStoreData | null {
  if (!prev) return prev;
  const normalized: NetWorthSnapshotV2 = snapshot;
  const existing = (prev.netWorth ?? []) as NetWorthSnapshot[];
  const nextNetWorth = (() => {
    const idx = existing.findIndex((s) => s.id === normalized.id);
    const withUpsert =
      idx === -1
        ? [...existing, normalized]
        : existing.map((s, i: number) => (i === idx ? normalized : s));
    return [...withUpsert].sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0));
  })();

  return {
    ...prev,
    netWorth: nextNetWorth,
  };
}

export default function FinanceLogPage() {
  const store = getActiveFinanceStore();
  const [data, setData] = useState<Awaited<ReturnType<typeof store.get>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth] = useState<YearMonth>(() => toYearMonth(new Date()));

  // Vermögen
  const [snapshotMonth, setSnapshotMonth] = useState<YearMonth>(() => toYearMonth(new Date()));
  const [nwGroup, setNwGroup] = useState<NetWorthGroupKey>("liquid");
  const [nwAccountName, setNwAccountName] = useState("");
  const [nwAccountAmount, setNwAccountAmount] = useState<number>(0);

  // Kategorien
  const [newCategory, setNewCategory] = useState("");

  // Quick bill form
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [expenseCategoryId, setExpenseCategoryId] = useState<string>("");

  // Einnahmen (Table like Vermögen)
  const [newIncomeName, setNewIncomeName] = useState<string>("");

  // Fixkosten (wiederkehrend)
  const [billName, setBillName] = useState("");
  const [billAmount, setBillAmount] = useState<number>(0);
  const [billDueDay, setBillDueDay] = useState<number>(1);
  const [billCategoryId, setBillCategoryId] = useState<string>("");
  const [billStartMonth, setBillStartMonth] = useState<YearMonth>(() => toYearMonth(new Date()));
  const [billChangeEffectiveMonth, setBillChangeEffectiveMonth] = useState<YearMonth>(() =>
    toYearMonth(new Date())
  );
  const [billChangeAmount, setBillChangeAmount] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    store
      .get()
      .then((d) => {
        if (!mounted) return;
        setData(d);
        setExpenseCategoryId(d.categories[0]?.id ?? "");
        setBillCategoryId(d.categories[0]?.id ?? "");
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
    return () => {
      mounted = false;
    };
  }, []);

  async function refresh() {
    const d = await store.get();
    setData(d);
    return d;
  }

  const currency = data?.currency ?? "EUR";

  const expensesForMonth = useMemo(() => {
    if (!data) return [] as Expense[];
    return data.expenses.filter((e) => e.date.slice(0, 7) === selectedMonth);
  }, [data, selectedMonth]);

  async function onQuickAddExpense() {
    if (!data) return;
    if (!expenseName.trim() || !expenseCategoryId) return;
    setError(null);
    try {
      if (!isISODate(expenseDate)) {
        throw new Error("Ungültiges Datumsformat. Bitte YYYY-MM-DD verwenden.");
      }
      const exp: Expense = {
        id: uid("exp"),
        name: expenseName.trim(),
        date: expenseDate,
        categoryId: expenseCategoryId,
        amount: { amount: Number(expenseAmount) || 0, currency },
      };
      await store.upsertExpense(exp);
      setExpenseName("");
      setExpenseAmount(0);
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function onAddCategory() {
    if (!newCategory.trim()) return;
    setError(null);
    try {
      await store.upsertCategory({ id: uid("cat"), name: newCategory.trim() });
      setNewCategory("");
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function onDeleteCategory(categoryId: string) {
    setError(null);
    try {
      await store.deleteCategory(categoryId);
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function newIncomeId() {
    return uid("inc");
  }

  async function onUpdateIncomeCell(args: { name: string; month: YearMonth; amount: number | null }) {
    try {
      setError(null);
      const base = await store.get();
      const existing = (base.incomes ?? []).find(
        (i) => i.name.trim() === args.name.trim() && i.date.slice(0, 7) === args.month
      );

      if (args.amount === null) {
        if (!existing) return;
        // optimistic
        setData((prev) => {
          if (!prev) return prev;
          return { ...prev, incomes: (prev.incomes ?? []).filter((x) => x.id !== existing.id) };
        });
        await store.deleteIncome(existing.id);
        await refresh();
        return;
      }

      const next: Income = {
        id: existing?.id ?? newIncomeId(),
        name: args.name.trim(),
        date: `${args.month}-01` as `${number}-${number}-${number}`,
        amount: { amount: args.amount, currency },
      };

      // optimistic
      setData((prev) => {
        if (!prev) return prev;
        const incomes = [...(prev.incomes ?? []).filter((x) => x.id !== next.id), next];
        incomes.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
        return { ...prev, incomes };
      });

      await store.upsertIncome(next);
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      await refresh();
    }
  }

  async function onAddIncomeName(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    await onUpdateIncomeCell({ name: trimmed, month: selectedMonth, amount: 0 });
    setNewIncomeName("");
  }

  async function onDeleteIncomeName(name: string) {
    try {
      setError(null);
      const base = await store.get();
      const toDelete = (base.incomes ?? []).filter((i) => i.name.trim() === name.trim());
      if (toDelete.length === 0) return;

      // optimistic
      setData((prev) => {
        if (!prev) return prev;
        const ids = new Set(toDelete.map((x) => x.id));
        return { ...prev, incomes: (prev.incomes ?? []).filter((x) => !ids.has(x.id)) };
      });

      for (const inc of toDelete) {
        await store.deleteIncome(inc.id);
      }
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      await refresh();
    }
  }

  async function onAddRecurringBill() {
    if (!data) return;
    if (!billName.trim() || !billCategoryId) return;
    setError(null);
    try {
      const bill = {
        id: uid("bill"),
        name: billName.trim(),
        categoryId: billCategoryId,
        dueDay: Math.min(31, Math.max(1, Math.floor(Number(billDueDay) || 1))),
        startMonth: billStartMonth,
        amountHistory: [
          {
            effectiveMonth: billStartMonth,
            amount: { amount: Number(billAmount) || 0, currency },
          },
        ],
        active: true,
      };
      await store.upsertRecurringBill(bill);
      setBillName("");
      setBillAmount(0);
      setBillDueDay(1);
      setBillStartMonth(toYearMonth(new Date()));
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function onToggleBill(bill: import("@/features/finance/types").RecurringBill) {
    setError(null);
    try {
      await store.upsertRecurringBill({ ...bill, active: !bill.active });
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function onDeleteBill(billId: string) {
    setError(null);
    try {
      await store.deleteRecurringBill(billId);
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function onAddBillAmountChange(bill: import("@/features/finance/types").RecurringBill) {
    setError(null);
    try {
      const next = {
        ...bill,
        amountHistory: [
          ...bill.amountHistory,
          {
            effectiveMonth: billChangeEffectiveMonth,
            amount: { amount: Number(billChangeAmount) || 0, currency },
          },
        ].sort((a, b) => (a.effectiveMonth < b.effectiveMonth ? -1 : a.effectiveMonth > b.effectiveMonth ? 1 : 0)),
      };
      await store.upsertRecurringBill(next);
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function onDeleteBillAmountChange(
    bill: import("@/features/finance/types").RecurringBill,
    effectiveMonth: YearMonth
  ) {
    setError(null);
    try {
      const next = {
        ...bill,
        amountHistory: bill.amountHistory.filter((h) => h.effectiveMonth !== effectiveMonth),
      };
      await store.upsertRecurringBill(next);
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function onDeleteExpense(expenseId: string) {
    setError(null);
    try {
      await store.deleteExpense(expenseId);
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function onAddNetWorthLine() {
    setError(null);
    try {
      if (!nwAccountName.trim()) return;
      const name = nwAccountName.trim();
      const amt = Number(nwAccountAmount) || 0;

      // Compute the next snapshot from the *latest* store data to avoid stale React state.
      const baseData = data ?? (await store.get());
      const base = getOrCreateSnapshot(baseData, snapshotMonth);
      const next: NetWorthSnapshotV2 = {
        ...base,
        groups: base.groups.map((g) => {
          if (g.id !== nwGroup) return g;

          const existing = g.lines.find((l) => l.name.trim() === name);
          if (existing) {
            return {
              ...g,
              lines: g.lines.map((l) =>
                l.id === existing.id ? { ...l, name, amount: { amount: amt, currency } } : l
              ),
            };
          }
          return { ...g, lines: [...g.lines, { id: uid("nw"), name, amount: { amount: amt, currency } }] };
        }),
      };

      // Optimistic UI update so it feels instant.
      setData((prev) => upsertNetWorthSnapshotInMemory(prev, next));

      // Persist and then rehydrate from store.
      await store.upsertNetWorthSnapshot(next);
      await refresh();

      setNwAccountName("");
      setNwAccountAmount(0);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const netWorthSnapshot = useMemo(() => {
    if (!data) return null;
    return getOrCreateSnapshot(data, snapshotMonth);
  }, [data, snapshotMonth]);

  const getSnapshot = (month: YearMonth) => getOrCreateSnapshot(data, month);

  async function onUpdateNetWorthCell(args: {
    month: YearMonth;
    groupId: string;
    groupName: string;
    accountName: string;
    amount: number | null;
  }) {
    setError(null);
    try {
      const accountName = args.accountName.trim();

      // Compute from latest store data to avoid stale snapshots (especially relevant for non-liquid groups).
      const baseData = data ?? (await store.get());
      const base = getOrCreateSnapshot(baseData, args.month);
      const next: NetWorthSnapshotV2 = {
        ...base,
        groups: base.groups.map((g) => {
          if (g.id !== args.groupId) return g;

          const existing = g.lines.find((l) => l.name.trim() === accountName);
          if (args.amount === null) {
            return { ...g, lines: g.lines.filter((l) => l.name.trim() !== accountName) };
          }

          const nextAmount = args.amount;
          if (existing) {
            return {
              ...g,
              lines: g.lines.map((l) =>
                l.id === existing.id ? { ...l, name: accountName, amount: { amount: nextAmount, currency } } : l
              ),
            };
          }
          return {
            ...g,
            lines: [...g.lines, { id: uid("nw"), name: accountName, amount: { amount: nextAmount, currency } }],
          };
        }),
      };

      // Optimistic UI update + persist + refresh.
      setData((prev) => upsertNetWorthSnapshotInMemory(prev, next));
      await store.upsertNetWorthSnapshot(next);
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <p className="text-gray-600">Finanzdaten werden geladen…</p>
      </div>
    );
  }

  const categories = data.categories as FinanceCategory[];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">Finanzen – Logging</h1>
          <p className="text-gray-700">Schnell Dinge eintragen (wie in Excel) und später in der Visualisierung anschauen.</p>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>
          )}

        </div>
          <QuickBillEntry
            categories={categories}
            categoryId={expenseCategoryId}
            setCategoryId={setExpenseCategoryId}
            name={expenseName}
            setName={setExpenseName}
            amount={expenseAmount}
            setAmount={setExpenseAmount}
            date={expenseDate}
            setDate={setExpenseDate}
            onAdd={onQuickAddExpense}
          />
        <div className="grid gap-6">
          <NetWorthManager
            currency={currency}
            snapshotMonth={snapshotMonth}
            setSnapshotMonth={setSnapshotMonth}
            snapshot={netWorthSnapshot ?? getOrCreateSnapshot(data, snapshotMonth)}
            getSnapshot={getSnapshot}
            group={nwGroup}
            setGroup={setNwGroup}
            accountName={nwAccountName}
            setAccountName={setNwAccountName}
            amount={nwAccountAmount}
            setAmount={setNwAccountAmount}
            onAddLine={onAddNetWorthLine}
            onUpdateCell={onUpdateNetWorthCell}
          />

          <CategoryManager
            categories={categories}
            newCategory={newCategory}
            setNewCategory={setNewCategory}
            onAddCategory={onAddCategory}
            onDeleteCategory={onDeleteCategory}
          />

          <IncomeMonthMatrix
            currency={currency}
            anchorMonth={selectedMonth}
            incomes={data.incomes ?? []}
            newIncomeName={newIncomeName}
            setNewIncomeName={setNewIncomeName}
            onAddIncomeName={onAddIncomeName}
            onUpdateCell={onUpdateIncomeCell}
            onDeleteIncomeName={onDeleteIncomeName}
          />

          <ExpenseLogTable
            currency={currency}
            categories={categories}
            rows={expensesForMonth}
            onDelete={onDeleteExpense}
          />

          <RecurringBillsManager
            categories={categories}
            bills={data.recurringBills}
            billName={billName}
            setBillName={setBillName}
            billAmount={billAmount}
            setBillAmount={setBillAmount}
            billDueDay={billDueDay}
            setBillDueDay={setBillDueDay}
            billCategoryId={billCategoryId}
            setBillCategoryId={setBillCategoryId}
            billStartMonth={billStartMonth}
            setBillStartMonth={setBillStartMonth}
            onAddBill={onAddRecurringBill}
            onToggleBill={onToggleBill}
            onDeleteBill={onDeleteBill}
            setChangeEffectiveMonth={setBillChangeEffectiveMonth}
            setChangeAmount={setBillChangeAmount}
            onAddChange={onAddBillAmountChange}
            onDeleteChange={onDeleteBillAmountChange}
          />


        </div>
      </div>
    </section>
  );
}
