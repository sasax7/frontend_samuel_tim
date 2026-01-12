import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type {
  Expense,
  FinanceCategory,
  Income,
  NetWorthSnapshotV2,
  RecurringBill,
  YearMonth,
} from "@/features/finance/types";
import { createLocalFinanceStore } from "@/features/finance/store";
import { uid } from "@/features/finance/id";
import { FinanceSankeyECharts } from "@/components/FinanceSankeyECharts";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const store = createLocalFinanceStore();

function toYearMonth(date: Date): YearMonth {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${y}-${m}` as YearMonth;
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatMoneyCompact(amount: number, currency: string) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 2,
  }).format(amount);
}

function sumBy<T>(items: T[], f: (t: T) => number) {
  return items.reduce((acc, x) => acc + f(x), 0);
}

function isISODate(value: string): value is `${number}-${number}-${number}` {
  // Minimal check, browser date input already returns YYYY-MM-DD.
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function daysInMonth(year: number, monthIndex0: number) {
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

function dateForMonthDueDay(month: YearMonth, dueDay: number): `${number}-${number}-${number}` {
  const [yStr, mStr] = month.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const maxDay = daysInMonth(y, m - 1);
  const day = Math.min(Math.max(1, Math.floor(dueDay)), maxDay);
  const dd = `${day}`.padStart(2, "0");
  return `${yStr}-${mStr}-${dd}` as `${number}-${number}-${number}`;
}

export default function FinancePage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof store.get>> | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<YearMonth>(() =>
    toYearMonth(new Date())
  );
  const [netWorthView, setNetWorthView] = useState<"chart" | "sankey">("chart");

  // Form states
  const [newCategory, setNewCategory] = useState("");
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseDate, setExpenseDate] = useState(() => {
    const d = new Date();
    const iso = d.toISOString().slice(0, 10);
    return iso;
  });
  const [expenseCategoryId, setExpenseCategoryId] = useState<string>("");

  // Einnahmen (Form)
  const [incomeName, setIncomeName] = useState("");
  const [incomeAmount, setIncomeAmount] = useState<number>(0);
  const [incomeDate, setIncomeDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });

  const [snapshotMonth, setSnapshotMonth] = useState<YearMonth>(() =>
    toYearMonth(new Date())
  );

  const defaultLiquidAccounts = [
    "VR Bank Fulda",
    "VISA Basic",
    "consors finance",
    "UBS Konto",
    "UBS Kreditkarte",
    "Bar geld",
    "Schulden an Maurice",
  ];
  const defaultInvestmentAccounts = [
    "IC Markets",
    "LeveX",
    "Kukoin",
    "Scalable",
    "Station wallet",
    "Bybit",
    "Binance",
    "BITMEX",
    "Coinbase",
  ];

  type NetWorthGroupKey = "liquid" | "investment" | "material";
  const [nwGroup, setNwGroup] = useState<NetWorthGroupKey>("liquid");
  const [nwAccountName, setNwAccountName] = useState("");
  const [nwAccountAmount, setNwAccountAmount] = useState<number>(0);

  // Recurring bills form
  const [billName, setBillName] = useState("");
  const [billAmount, setBillAmount] = useState<number>(0);
  const [billDueDay, setBillDueDay] = useState<number>(1);
  const [billCategoryId, setBillCategoryId] = useState<string>("");
  const [billStartMonth, setBillStartMonth] = useState<YearMonth>(() =>
    toYearMonth(new Date())
  );
  const [billChangeEffectiveMonth, setBillChangeEffectiveMonth] =
    useState<YearMonth>(() => toYearMonth(new Date()));
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

  const currency = data?.currency ?? "EUR";

  const categoriesById = useMemo(() => {
    const map = new Map<string, FinanceCategory>();
    (data?.categories ?? []).forEach((c) => map.set(c.id, c));
    return map;
  }, [data]);

  const expensesForMonth = useMemo(() => {
    if (!data) return [] as Expense[];
    return data.expenses.filter((e) => e.date.slice(0, 7) === selectedMonth);
  }, [data, selectedMonth]);

  const incomesForMonth = useMemo(() => {
    if (!data) return [] as Income[];
    return (data.incomes ?? []).filter((i) => i.date.slice(0, 7) === selectedMonth);
  }, [data, selectedMonth]);

  const expensesTotal = useMemo(() => {
    return sumBy(expensesForMonth, (e) => e.amount.amount);
  }, [expensesForMonth]);

  const incomeTotal = useMemo(() => {
    return sumBy(incomesForMonth, (i) => i.amount.amount);
  }, [incomesForMonth]);

  const projectedBillsForMonth = useMemo(() => {
    if (!data) return [] as Array<{ id: string; name: string; date: string; amount: number; categoryId: string }>;
    return data.recurringBills
      .filter((b) => b.active)
      .filter((b) => selectedMonth >= b.startMonth)
      .map((b) => ({
        // pick last amountHistory entry with effectiveMonth <= selectedMonth
        _amount:
          [...b.amountHistory]
            .sort((a, c) => (a.effectiveMonth < c.effectiveMonth ? -1 : a.effectiveMonth > c.effectiveMonth ? 1 : 0))
            .filter((h) => h.effectiveMonth <= selectedMonth)
            .slice(-1)[0]?.amount?.amount ?? 0,
        id: `bill_${b.id}_${selectedMonth}`,
        name: b.name,
        date: dateForMonthDueDay(selectedMonth, b.dueDay),
        amount: 0,
        categoryId: b.categoryId,
      }))
      .map((x) => ({
        ...x,
        amount: x._amount,
      }))
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  }, [data, selectedMonth]);

  const billsTotal = useMemo(() => {
    return sumBy(projectedBillsForMonth, (b) => b.amount);
  }, [projectedBillsForMonth]);

  const spendingByCategory = useMemo(() => {
    const bucket = new Map<string, number>();
    for (const e of expensesForMonth) {
      bucket.set(e.categoryId, (bucket.get(e.categoryId) ?? 0) + e.amount.amount);
    }
    for (const b of projectedBillsForMonth) {
      bucket.set(b.categoryId, (bucket.get(b.categoryId) ?? 0) + b.amount);
    }
    // sort desc
    return [...bucket.entries()]
      .map(([categoryId, total]) => ({ categoryId, total }))
      .sort((a, b) => b.total - a.total);
  }, [expensesForMonth, projectedBillsForMonth]);

  const spendingTotal = useMemo(() => expensesTotal + billsTotal, [expensesTotal, billsTotal]);

  const sankeyData = useMemo(() => {
    if (!data) return { nodes: [], links: [] };
    // Income -> Categories (spending) for selected month.
    // 1) Income total for month (can be 0)
    const income = sumBy((data.incomes ?? []).filter((i) => i.date.slice(0, 7) === selectedMonth), (i) => i.amount.amount);

    // 2) Allocate income across categories proportional to their spending.
    // If income is 0, we still show spending from a virtual “Einnahmen” source for visualization.
    const sourceValue = income > 0 ? income : spendingTotal;

    const balance = income - spendingTotal; // + => under budget, - => over budget
    const balanceNodeName = balance >= 0 ? "Unter Budget" : "Über Budget";
    const balanceNodeColor = balance >= 0 ? "#22c55e" : "#ef4444";

    const nodes = [
      { name: "Einnahmen", color: "#16a34a" },
      ...data.categories.map((c) => ({ name: c.name, color: c.color ?? "#94a3b8" })),
      { name: balanceNodeName, color: balanceNodeColor },
    ];

    const links = spendingByCategory
      .filter((x) => x.total > 0)
      .map((x) => {
        const catName = categoriesById.get(x.categoryId)?.name ?? "Unbekannt";
        const targetIndex = nodes.findIndex((n) => n.name === catName);
        const color = categoriesById.get(x.categoryId)?.color ?? "#94a3b8";

        const value =
          spendingTotal > 0 ? (x.total / spendingTotal) * sourceValue : 0;

        return {
          source: 0,
          target: targetIndex === -1 ? 0 : targetIndex,
          value,
          color,
        };
      })
      .filter((l) => l.target !== 0)
      .filter((l) => l.value > 0);

    // Add budget balance flow so total outflow from Einnahmen matches the month situation.
    // If income > spending: show leftover as "Unter Budget".
    // If spending > income: show the deficit as "Über Budget" (still sourced from Einnahmen to keep 1-source view).
    const balanceAbs = Math.abs(balance);
    const balanceIndex = nodes.findIndex((n) => n.name === balanceNodeName);
    if (balanceAbs > 0.0001 && balanceIndex > 0) {
      links.push({
        source: 0,
        target: balanceIndex,
        value: balanceAbs,
        color: balanceNodeColor,
      });
    }

    return { nodes, links };
  }, [data, spendingByCategory, categoriesById, selectedMonth, spendingTotal]);

  const netWorthSeries = useMemo(() => {
    if (!data) return [] as Array<{ month: string; total: number }>;
    return data.netWorth
      .map((s) => ({
        month: s.month,
        total:
          "groups" in s
            ? sumBy(s.groups.flatMap((g) => g.lines), (l) => l.amount.amount)
            : sumBy(s.lines, (l) => l.amount.amount),
      }))
      .sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0));
  }, [data]);

  const latestNetWorth = useMemo(() => {
    if (netWorthSeries.length === 0) return null;
    return netWorthSeries[netWorthSeries.length - 1];
  }, [netWorthSeries]);

  async function refresh() {
    const d = await store.get();
    setData(d);
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

  async function onAddExpense() {
    if (!expenseName.trim() || !expenseCategoryId) return;
    setError(null);
    try {
      if (!isISODate(expenseDate)) {
  throw new Error("Ungültiges Datumsformat. Bitte YYYY-MM-DD verwenden.");
      }
      const expense: Expense = {
        id: uid("exp"),
        name: expenseName.trim(),
        date: expenseDate,
        categoryId: expenseCategoryId,
        amount: { amount: Number(expenseAmount) || 0, currency },
      };
      await store.upsertExpense(expense);
      setExpenseName("");
      setExpenseAmount(0);
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function onAddIncome() {
    if (!incomeName.trim()) return;
    setError(null);
    try {
      if (!isISODate(incomeDate)) {
        throw new Error("Ungültiges Datumsformat. Bitte YYYY-MM-DD verwenden.");
      }
      const income: Income = {
        id: uid("inc"),
        name: incomeName.trim(),
        date: incomeDate,
        amount: { amount: Number(incomeAmount) || 0, currency },
      };
      await store.upsertIncome(income);
      setIncomeName("");
      setIncomeAmount(0);
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function onDeleteIncome(incomeId: string) {
    setError(null);
    try {
      await store.deleteIncome(incomeId);
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

  async function onAddRecurringBill() {
    if (!billName.trim() || !billCategoryId) return;
    setError(null);
    try {
      const bill: RecurringBill = {
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

  async function onAddBillAmountChange(bill: RecurringBill) {
    setError(null);
    try {
      const next: RecurringBill = {
        ...bill,
        amountHistory: [...bill.amountHistory, {
          effectiveMonth: billChangeEffectiveMonth,
          amount: { amount: Number(billChangeAmount) || 0, currency },
        }].sort((a, b) => (a.effectiveMonth < b.effectiveMonth ? -1 : a.effectiveMonth > b.effectiveMonth ? 1 : 0)),
      };
      await store.upsertRecurringBill(next);
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function onDeleteBillAmountChange(bill: RecurringBill, effectiveMonth: YearMonth) {
    setError(null);
    try {
      const next: RecurringBill = {
        ...bill,
        amountHistory: bill.amountHistory.filter((h) => h.effectiveMonth !== effectiveMonth),
      };
      await store.upsertRecurringBill(next);
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function onToggleBill(bill: RecurringBill) {
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

  function getOrCreateSnapshot(month: YearMonth): NetWorthSnapshotV2 {
    const existing = data?.netWorth.find((s) => s.month === month);
    if (existing && "groups" in existing) return existing;

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

  async function onAddNetWorthLine() {
    setError(null);
    try {
      if (!nwAccountName.trim()) return;
      const snapshot = getOrCreateSnapshot(snapshotMonth);
      const next: NetWorthSnapshotV2 = {
        ...snapshot,
        groups: snapshot.groups.map((g) => {
          if (g.id !== nwGroup) return g;
          return {
            ...g,
            lines: [
              ...g.lines,
              {
                id: uid("nw"),
                name: nwAccountName.trim(),
                amount: { amount: Number(nwAccountAmount) || 0, currency },
              },
            ],
          };
        }),
      };

      await store.upsertNetWorthSnapshot(next);
      setNwAccountName("");
      setNwAccountAmount(0);
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function onDeleteNetWorthLine(groupId: string, lineId: string) {
    setError(null);
    try {
      const snapshot = getOrCreateSnapshot(snapshotMonth);
      const next: NetWorthSnapshotV2 = {
        ...snapshot,
        groups: snapshot.groups.map((g) =>
          g.id !== groupId
            ? g
            : {
                ...g,
                lines: g.lines.filter((l) => l.id !== lineId),
              }
        ),
      };
      await store.upsertNetWorthSnapshot(next);
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function onSeedAccounts() {
    setError(null);
    try {
      const snapshot = getOrCreateSnapshot(snapshotMonth);
      const hasAny = snapshot.groups.some((g) => g.lines.length > 0);
      if (hasAny) return;

      const seeded: NetWorthSnapshotV2 = {
        ...snapshot,
        groups: snapshot.groups.map((g) => {
          if (g.id === "liquid") {
            return {
              ...g,
              lines: defaultLiquidAccounts.map((name) => ({
                id: uid("nw"),
                name,
                amount: { amount: 0, currency },
              })),
            };
          }
          if (g.id === "investment") {
            return {
              ...g,
              lines: defaultInvestmentAccounts.map((name) => ({
                id: uid("nw"),
                name,
                amount: { amount: 0, currency },
              })),
            };
          }
          return g;
        }),
      };

      await store.upsertNetWorthSnapshot(seeded);
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

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
            Finanzen
          </h1>
          <p className="text-gray-700">
            Nur Frontend (lokal in diesem Browser gespeichert). So aufgebaut,
            dass später leicht ein Backend angebunden werden kann.
          </p>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
              {error}
            </p>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle>Vermögen im Zeitverlauf</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant={netWorthView === "chart" ? "default" : "secondary"}
                    className="h-8 px-3"
                    onClick={() => setNetWorthView("chart")}
                  >
                    Chart
                  </Button>
                  <Button
                    variant={netWorthView === "sankey" ? "default" : "secondary"}
                    className="h-8 px-3"
                    onClick={() => setNetWorthView("sankey")}
                  >
                    Sankey
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="text-sm text-gray-600">
                  Letzter Stand: {latestNetWorth ? latestNetWorth.month : "—"}
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {latestNetWorth
                    ? formatMoney(latestNetWorth.total, currency)
                    : "Noch keine Stände"}
                </div>
              </div>

              {netWorthView === "chart" ? (
                <div className="w-full h-[260px] bg-white rounded-xl border p-3">
                  {netWorthSeries.length < 2 ? (
                    <p className="text-sm text-gray-600">
                      Füge mindestens 2 Monatsstände hinzu, um einen Trend zu sehen.
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={netWorthSeries}
                        margin={{ top: 10, right: 12, bottom: 0, left: 0 }}
                      >
                        <defs>
                          <linearGradient id="nwFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tickMargin={8} />
                        <YAxis
                          tickFormatter={(v) =>
                            formatMoneyCompact(Number(v) || 0, currency)
                          }
                          width={90}
                        />
                        <Tooltip
                          formatter={(value) =>
                            formatMoney(Number(value) || 0, currency)
                          }
                          labelFormatter={(label) => `Monat: ${label}`}
                        />
                        <Area
                          type="monotone"
                          dataKey="total"
                          stroke="#2563eb"
                          strokeWidth={2}
                          fill="url(#nwFill)"
                          name="Vermögen"
                          dot={false}
                          activeDot={{ r: 5 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <p className="text-sm font-medium text-gray-700">
                      Sankey (Monat: {selectedMonth})
                    </p>
                    <p className="text-xs text-gray-600">
                      Hinweis: Aktuell zeigt das Sankey die Ausgaben/ Fixkosten-
                      Verteilung.
                    </p>
                  </div>
                  {sankeyData.links.length === 0 ? (
                    <p className="text-sm text-gray-600">
                      Keine Daten für {selectedMonth}.
                    </p>
                  ) : (
                    <div className="w-full overflow-x-auto">
                      <div className="min-w-[720px] bg-white rounded-xl border p-2">
                        <FinanceSankeyECharts data={sankeyData} height={260} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Monat</label>
                  <input
                    value={snapshotMonth}
                    onChange={(e) => setSnapshotMonth(e.target.value as YearMonth)}
                    className="mt-1 w-full rounded-md border px-3 py-2"
                    placeholder="YYYY-MM"
                  />
                  <div className="mt-3">
                    <Button variant="secondary" onClick={onSeedAccounts}>
                      Konten für diesen Monat anlegen
                    </Button>
                    <p className="text-xs text-gray-600 mt-2">
                      Funktioniert nur, wenn für den Monat noch keine Einträge existieren.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Gruppe</label>
                  <select
                    value={nwGroup}
                    onChange={(e) => setNwGroup(e.target.value as NetWorthGroupKey)}
                    className="mt-1 w-full rounded-md border px-3 py-2"
                  >
                    <option value="liquid">Liquid</option>
                    <option value="investment">Investments</option>
                    <option value="material">Sachwerte</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Betrag</label>
                  <input
                    type="number"
                    value={nwAccountAmount}
                    onChange={(e) => setNwAccountAmount(Number(e.target.value))}
                    className="mt-1 w-full rounded-md border px-3 py-2"
                  />
                </div>
              </div>

              <div className="mt-4 grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Konto</label>
                  <input
                    value={nwAccountName}
                    onChange={(e) => setNwAccountName(e.target.value)}
                    className="mt-1 w-full rounded-md border px-3 py-2"
                    placeholder="z.B. VR Bank Fulda, Scalable …"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={onAddNetWorthLine}>Kontozeile hinzufügen</Button>
                </div>
              </div>

              <div className="mt-6 grid md:grid-cols-3 gap-4">
                {(() => {
                  const snap = getOrCreateSnapshot(snapshotMonth);
                  const groups = snap.groups;
                  return groups.map((g) => {
                    const gTotal = sumBy(g.lines, (l) => l.amount.amount);
                    return (
                      <div key={g.id} className="rounded-xl border bg-white">
                        <div className="p-4 border-b">
                          <div className="flex items-center justify-between">
                            <div className="font-semibold text-gray-900">{g.name}</div>
                            <div className="text-sm text-gray-700">
                              {formatMoney(gTotal, currency)}
                            </div>
                          </div>
                        </div>
                        <div className="p-4 space-y-2">
                          {g.lines.length === 0 ? (
                            <p className="text-sm text-gray-600">Noch keine Konten.</p>
                          ) : (
                            g.lines.map((l) => (
                              <div
                                key={l.id}
                                className="flex items-center justify-between rounded-md border px-3 py-2"
                              >
                                <div className="min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate">
                                    {l.name}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {formatMoney(l.amount.amount, currency)}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => onDeleteNetWorthLine(g.id, l.id)}
                                >
                                  Löschen
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kategorien</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="flex-1 rounded-md border px-3 py-2"
                  placeholder="Neue Kategorie"
                />
                <Button onClick={onAddCategory}>Hinzufügen</Button>
              </div>

              <div className="space-y-2">
                {data.categories.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-md border bg-white px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: c.color ?? "#94a3b8" }}
                      />
                      <span className="text-gray-900">{c.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => onDeleteCategory(c.id)}
                      aria-label={`${c.name} löschen`}
                    >
                      Löschen
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 mt-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Ausgaben (einmalige Ausgaben)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Monat
                  </label>
                  <input
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value as YearMonth)}
                    className="mt-1 w-full rounded-md border px-3 py-2"
                    placeholder="YYYY-MM"
                  />
                </div>
                <div className="text-gray-900 font-semibold md:ml-auto">
                  Gesamt (inkl. Fixkosten): {formatMoney(spendingTotal, currency)}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <div className="rounded-xl border bg-white p-4">
                  <div className="text-xs text-gray-600">Einnahmen in {selectedMonth}</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatMoney(incomeTotal, currency)}
                  </div>
                </div>
                <div className="rounded-xl border bg-white p-4">
                  <div className="text-xs text-gray-600">Ausgaben (inkl. Fixkosten) in {selectedMonth}</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatMoney(spendingTotal, currency)}
                  </div>
                </div>
              </div>

              {/* Real Sankey */}
              <div className="mb-10">
                <p className="text-sm font-medium text-gray-700 mb-3">Sankey</p>
                {sankeyData.links.length === 0 ? (
                  <p className="text-sm text-gray-600">Keine Daten für {selectedMonth}.</p>
                ) : (
                  <div className="w-full overflow-x-auto">
                    <div className="min-w-[720px] bg-white rounded-xl border p-2">
                      <FinanceSankeyECharts data={sankeyData} height={240} />
                    </div>
                  </div>
                )}
              </div>

              {/* Sankey-like visualization: category bars */}
              <div className="mb-8">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Nach Kategorie
                </p>
                {spendingByCategory.length === 0 ? (
                  <p className="text-sm text-gray-600">
                    Keine Ausgaben für {selectedMonth}.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {spendingByCategory.map(({ categoryId, total }) => {
                      const cat = categoriesById.get(categoryId);
                      const pct = spendingTotal > 0 ? (total / spendingTotal) * 100 : 0;
                      return (
                        <div key={categoryId} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-800">
                              {cat?.name ?? "Unbekannt"}
                            </span>
                            <span className="text-gray-600">
                              {formatMoney(total, currency)}
                            </span>
                          </div>
                          <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-3 rounded-full"
                              style={{
                                width: `${Math.max(2, pct)}%`,
                                backgroundColor: cat?.color ?? "#3b82f6",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-5 gap-3">
                <div className="md:col-span-5">
                  <p className="text-sm font-medium text-gray-700">Einnahmen erfassen</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Diese Einnahmen werden im Sankey als Quelle verwendet und proportional auf die Ausgaben-Kategorien verteilt.
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <input
                    value={incomeName}
                    onChange={(e) => setIncomeName(e.target.value)}
                    className="mt-1 w-full rounded-md border px-3 py-2"
                    placeholder="Gehalt, Bonus, Verkauf …"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Datum</label>
                  <input
                    type="date"
                    value={incomeDate}
                    onChange={(e) => setIncomeDate(e.target.value)}
                    className="mt-1 w-full rounded-md border px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Betrag</label>
                  <input
                    type="number"
                    value={incomeAmount}
                    onChange={(e) => setIncomeAmount(Number(e.target.value))}
                    className="mt-1 w-full rounded-md border px-3 py-2"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={onAddIncome}>Einnahme hinzufügen</Button>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <input
                    value={expenseName}
                    onChange={(e) => setExpenseName(e.target.value)}
                    className="mt-1 w-full rounded-md border px-3 py-2"
                    placeholder="Einkauf, Tierarzt, Gym …"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Datum</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="mt-1 w-full rounded-md border px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Betrag</label>
                  <input
                    type="number"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(Number(e.target.value))}
                    className="mt-1 w-full rounded-md border px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Kategorie
                  </label>
                  <select
                    value={expenseCategoryId}
                    onChange={(e) => setExpenseCategoryId(e.target.value)}
                    className="mt-1 w-full rounded-md border px-3 py-2"
                  >
                    {data.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <Button onClick={onAddExpense}>Ausgabe hinzufügen</Button>
              </div>

              <div className="mt-8">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Einnahmen in {selectedMonth}
                </p>
                {incomesForMonth.length === 0 ? (
                  <p className="text-sm text-gray-600">Noch keine Einnahmen.</p>
                ) : (
                  <div className="space-y-2">
                    {incomesForMonth.map((i) => (
                      <div
                        key={i.id}
                        className="flex items-center justify-between rounded-md border bg-white px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900 font-medium truncate">
                              {i.name}
                            </span>
                            <span className="text-xs text-gray-500">{i.date}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="font-semibold text-gray-900">
                            {formatMoney(i.amount.amount, currency)}
                          </div>
                          <Button
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => onDeleteIncome(i.id)}
                          >
                            Löschen
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-8">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Ausgaben + prognostizierte Fixkosten in {selectedMonth}
                </p>
                {expensesForMonth.length === 0 && projectedBillsForMonth.length === 0 ? (
                  <p className="text-sm text-gray-600">Noch keine Einträge.</p>
                ) : (
                  <div className="space-y-2">
                    {projectedBillsForMonth.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between rounded-md border bg-white px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900 font-medium truncate">
                              {b.name}
                            </span>
                            <span className="text-xs text-gray-500">{b.date}</span>
                            <span className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded px-2 py-0.5">
                              Fixkosten
                            </span>
                          </div>
                          <div className="text-xs text-gray-600">
                            {categoriesById.get(b.categoryId)?.name ?? "Unbekannt"}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="font-semibold text-gray-900">
                            {formatMoney(b.amount, currency)}
                          </div>
                        </div>
                      </div>
                    ))}
                    {expensesForMonth.map((e) => (
                      <div
                        key={e.id}
                        className="flex items-center justify-between rounded-md border bg-white px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900 font-medium truncate">
                              {e.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {e.date}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600">
                            {categoriesById.get(e.categoryId)?.name ?? "Unbekannt"}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="font-semibold text-gray-900">
                            {formatMoney(e.amount.amount, currency)}
                          </div>
                          <Button
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => onDeleteExpense(e.id)}
                          >
                            Löschen
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monatliche Fixkosten</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Füge Miete/Abos einmal hinzu — dann werden sie automatisch in den ausgewählten
                Monat projiziert.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <input
                    value={billName}
                    onChange={(e) => setBillName(e.target.value)}
                    className="mt-1 w-full rounded-md border px-3 py-2"
                    placeholder="Miete, Spotify …"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Startmonat</label>
                  <input
                    value={billStartMonth}
                    onChange={(e) => setBillStartMonth(e.target.value as YearMonth)}
                    className="mt-1 w-full rounded-md border px-3 py-2"
                    placeholder="YYYY-MM"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Betrag</label>
                  <input
                    type="number"
                    value={billAmount}
                    onChange={(e) => setBillAmount(Number(e.target.value))}
                    className="mt-1 w-full rounded-md border px-3 py-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Fälligkeitstag</label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={billDueDay}
                      onChange={(e) => setBillDueDay(Number(e.target.value))}
                      className="mt-1 w-full rounded-md border px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Kategorie</label>
                    <select
                      value={billCategoryId}
                      onChange={(e) => setBillCategoryId(e.target.value)}
                      className="mt-1 w-full rounded-md border px-3 py-2"
                    >
                      {data.categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <Button onClick={onAddRecurringBill}>Fixkosten hinzufügen</Button>
              </div>

              <div className="mt-6">
                <p className="text-sm font-medium text-gray-700 mb-3">Deine Fixkosten</p>
                {data.recurringBills.length === 0 ? (
                  <p className="text-sm text-gray-600">Noch keine Fixkosten.</p>
                ) : (
                  <div className="space-y-2">
                    {data.recurringBills.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between rounded-md border bg-white px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900 font-medium truncate">
                              {b.name}
                            </span>
                            {!b.active && (
                              <span className="text-xs text-gray-500 bg-gray-100 border rounded px-2 py-0.5">
                                pausiert
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600">
                            Start {b.startMonth} · Tag {b.dueDay} · {categoriesById.get(b.categoryId)?.name ?? "Unbekannt"}
                          </div>
                          <div className="mt-2 text-xs text-gray-600">
                            <div className="font-medium text-gray-700 mb-1">Betragsverlauf</div>
                            {b.amountHistory.length === 0 ? (
                              <div>Noch keine Beträge.</div>
                            ) : (
                              <div className="space-y-1">
                                {[...b.amountHistory]
                                  .sort((a, c) => (a.effectiveMonth < c.effectiveMonth ? -1 : a.effectiveMonth > c.effectiveMonth ? 1 : 0))
                                  .map((h) => (
                                    <div key={h.effectiveMonth} className="flex items-center justify-between gap-2">
                                      <span>
                                        {h.effectiveMonth}: {formatMoney(h.amount.amount, currency)}
                                      </span>
                                      <button
                                        type="button"
                                        className="text-red-600 hover:underline"
                                        onClick={() => onDeleteBillAmountChange(b, h.effectiveMonth)}
                                      >
                                        entfernen
                                      </button>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="hidden lg:flex flex-col gap-2 items-end mr-2">
                            <input
                              value={billChangeEffectiveMonth}
                              onChange={(e) => setBillChangeEffectiveMonth(e.target.value as YearMonth)}
                              className="w-[110px] rounded-md border px-2 py-1 text-xs"
                              placeholder="YYYY-MM"
                              aria-label="Gültiger Monat"
                            />
                            <input
                              type="number"
                              value={billChangeAmount}
                              onChange={(e) => setBillChangeAmount(Number(e.target.value))}
                              className="w-[110px] rounded-md border px-2 py-1 text-xs"
                              aria-label="Neuer Betrag"
                            />
                            <Button
                              variant="secondary"
                              className="h-8 px-3"
                              onClick={() => onAddBillAmountChange(b)}
                            >
                              Betrag setzen
                            </Button>
                          </div>
                          <Button variant="ghost" onClick={() => onToggleBill(b)}>
                            {b.active ? "Pausieren" : "Fortsetzen"}
                          </Button>
                          <Button
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => onDeleteBill(b.id)}
                          >
                            Löschen
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
