import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Expense, FinanceCategory, Income, NetWorthSnapshot, NetWorthSnapshotV2, RecurringBill, YearMonth } from "@/features/finance/types";
import type { FinanceStoreData } from "@/features/finance/store";
import { getActiveFinanceStore } from "@/features/finance/activeStore";
import { getAccessToken } from "@/features/auth/session";
import { FinanceSankeyECharts } from "@/components/FinanceSankeyECharts";
import { FinanceNetWorthStackedECharts } from "@/components/FinanceNetWorthStackedECharts";
import { formatMoney } from "@/components/finance/financeFormat";

// NOTE: don't bind the store at module load time, because login/logout can change
// which store is active (backend vs local). We'll obtain it inside the component.

function toYearMonth(date: Date): YearMonth {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${y}-${m}` as YearMonth;
}

function addMonths(month: YearMonth, delta: number): YearMonth {
  const [yStr, mStr] = month.split("-");
  const y = Number(yStr);
  const m0 = Number(mStr) - 1;
  const d = new Date(y, m0 + delta, 1);
  return toYearMonth(d);
}

function sumBy<T>(items: T[], f: (t: T) => number) {
  return items.reduce((acc, x) => acc + f(x), 0);
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

const MOCK_FINANCE_DATA: FinanceStoreData = {
  version: 1,
  currency: "EUR",
  categories: [
    { id: "cat_food", name: "Lebensmittel" },
    { id: "cat_home", name: "Miete" },
    { id: "cat_fun", name: "Freizeit" },
    { id: "cat_misc", name: "Sonstiges" },
  ],
  expenses: [
    { id: "exp1", name: "Wocheneinkauf", categoryId: "cat_food", date: "2025-12-12", amount: { amount: 180, currency: "EUR" } },
    { id: "exp2", name: "Restaurant", categoryId: "cat_food", date: "2025-12-05", amount: { amount: 90, currency: "EUR" } },
    { id: "exp3", name: "Kino", categoryId: "cat_fun", date: "2025-12-10", amount: { amount: 45, currency: "EUR" } },
  ],
  incomes: [
    { id: "inc1", name: "Gehalt", date: "2025-12-01", amount: { amount: 3180, currency: "EUR" } },
    { id: "inc2", name: "Freelance", date: "2025-12-15", amount: { amount: 420, currency: "EUR" } },
  ],
  recurringBills: [
    {
      id: "bill_rent",
      name: "Miete",
      categoryId: "cat_home",
      startMonth: "2025-01",
      dueDay: 1,
      active: true,
      amountHistory: [{ effectiveMonth: "2025-01", amount: { amount: 950, currency: "EUR" } }],
    } as RecurringBill,
  ],
  netWorth: [
    {
      id: "nw_2025-11",
      month: "2025-11",
      groups: [
        {
          id: "liquid",
          name: "Liquid",
          lines: [
            { id: "nw_line_1", name: "Giro", amount: { amount: 5200, currency: "EUR" } },
            { id: "nw_line_2", name: "Tagesgeld", amount: { amount: 3200, currency: "EUR" } },
          ],
        },
        {
          id: "investment",
          name: "Investments",
          lines: [{ id: "nw_line_3", name: "ETF", amount: { amount: 10800, currency: "EUR" } }],
        },
        { id: "material", name: "Sachwerte", lines: [] },
      ],
    } as NetWorthSnapshotV2,
    {
      id: "nw_2025-12",
      month: "2025-12",
      groups: [
        {
          id: "liquid",
          name: "Liquid",
          lines: [
            { id: "nw_line_1b", name: "Giro", amount: { amount: 5800, currency: "EUR" } },
            { id: "nw_line_2b", name: "Tagesgeld", amount: { amount: 3300, currency: "EUR" } },
          ],
        },
        {
          id: "investment",
          name: "Investments",
          lines: [{ id: "nw_line_3b", name: "ETF", amount: { amount: 11250, currency: "EUR" } }],
        },
        { id: "material", name: "Sachwerte", lines: [] },
      ],
    } as NetWorthSnapshotV2,
  ],
};

export default function FinanceVizPage() {
  const token = getAccessToken();
  const store = useMemo(() => getActiveFinanceStore(token ?? undefined), [token]);
  const [data, setData] = useState<Awaited<ReturnType<typeof store.get>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selectedMonth = useMemo<YearMonth>(() => toYearMonth(new Date()), []);
  const sankeyMonth = useMemo<YearMonth>(() => addMonths(selectedMonth, -1), [selectedMonth]);
  const sankeyMonths12 = useMemo<YearMonth[]>(() => {
    // rolling window: selectedMonth (current) inclusive, going back 11 months
    return Array.from({ length: 12 }, (_, i) => addMonths(selectedMonth, -(11 - i)));
  }, [selectedMonth]);
  const sankeyPeriodLabel = useMemo(() => {
    const start = sankeyMonths12[0];
    const end = sankeyMonths12[sankeyMonths12.length - 1];
    return start && end ? `${start}–${end}` : "letzte 12 Monate";
  }, [sankeyMonths12]);

  useEffect(() => {
    let mounted = true;
    store
      .get()
      .then((d) => {
        if (!mounted) return;
        if (!d || d.expenses.length === 0) {
          setError("Keine Finanzdaten gefunden – zeige Demo.");
          setData(MOCK_FINANCE_DATA);
          return;
        }
        setData(d);
      })
      .catch((e: unknown) => {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : String(e));
        setData(MOCK_FINANCE_DATA);
      });
    return () => {
      mounted = false;
    };
  }, [store]);

  const currency = data?.currency ?? "EUR";

  const categoriesById = useMemo(() => {
    const map = new Map<string, FinanceCategory>();
    (data?.categories ?? []).forEach((c) => map.set(c.id, c));
    return map;
  }, [data]);

  const expensesForMonth = useMemo(() => {
    if (!data) return [] as Expense[];
    return data.expenses.filter((e) => e.date.slice(0, 7) === sankeyMonth);
  }, [data, sankeyMonth]);

  const expensesForYear = useMemo(() => {
    if (!data) return [] as Expense[];
    const set = new Set(sankeyMonths12);
    return data.expenses.filter((e) => set.has(e.date.slice(0, 7) as YearMonth));
  }, [data, sankeyMonths12]);

  const incomesForMonth = useMemo(() => {
    if (!data) return [] as Income[];
    return (data.incomes ?? []).filter((i) => i.date.slice(0, 7) === sankeyMonth);
  }, [data, sankeyMonth]);

  const incomesForYear = useMemo(() => {
    if (!data) return [] as Income[];
    const set = new Set(sankeyMonths12);
    return (data.incomes ?? []).filter((i) => set.has(i.date.slice(0, 7) as YearMonth));
  }, [data, sankeyMonths12]);

  const incomeTotal = useMemo(() => sumBy(incomesForMonth, (i) => i.amount.amount), [incomesForMonth]);
  const incomeTotalYear = useMemo(() => sumBy(incomesForYear, (i) => i.amount.amount), [incomesForYear]);

  const projectedBillsForMonth = useMemo(() => {
    if (!data) return [] as Array<{ id: string; name: string; date: string; amount: number; categoryId: string }>;
    return data.recurringBills
      .filter((b) => b.active)
      .filter((b) => sankeyMonth >= b.startMonth)
      .map((b) => ({
        _amount:
          [...b.amountHistory]
            .sort((a, c) =>
              a.effectiveMonth < c.effectiveMonth ? -1 : a.effectiveMonth > c.effectiveMonth ? 1 : 0
            )
            .filter((h) => h.effectiveMonth <= sankeyMonth)
            .slice(-1)[0]?.amount?.amount ?? 0,
        id: `bill_${b.id}_${sankeyMonth}`,
        name: b.name,
        date: dateForMonthDueDay(sankeyMonth, b.dueDay),
        amount: 0,
        categoryId: b.categoryId,
      }))
      .map((x) => ({ ...x, amount: x._amount }))
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  }, [data, sankeyMonth]);

  const projectedBillsForYear = useMemo(() => {
    if (!data) return [] as Array<{ id: string; name: string; date: string; amount: number; categoryId: string }>; 
    // Aggregate recurring bills per month across the rolling last-12-months window.
    const activeBills = data.recurringBills.filter((b) => b.active);
    const months = sankeyMonths12;

    return months
      .flatMap((m) =>
        activeBills
          .filter((b) => m >= b.startMonth)
          .map((b) => {
            const amount =
              [...b.amountHistory]
                .sort((a, c) => (a.effectiveMonth < c.effectiveMonth ? -1 : a.effectiveMonth > c.effectiveMonth ? 1 : 0))
                .filter((h) => h.effectiveMonth <= m)
                .slice(-1)[0]?.amount?.amount ?? 0;

            return {
              id: `bill_${b.id}_${m}`,
              name: b.name,
              date: dateForMonthDueDay(m, b.dueDay),
              amount,
              categoryId: b.categoryId,
            };
          })
      )
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  }, [data, sankeyMonths12]);

  const expensesTotal = useMemo(() => sumBy(expensesForMonth, (e) => e.amount.amount), [expensesForMonth]);
  const billsTotal = useMemo(() => sumBy(projectedBillsForMonth, (b) => b.amount), [projectedBillsForMonth]);
  const spendingTotal = useMemo(() => expensesTotal + billsTotal, [expensesTotal, billsTotal]);
  const profitTotal = useMemo(() => incomeTotal - spendingTotal, [incomeTotal, spendingTotal]);

  const expensesTotalYear = useMemo(() => sumBy(expensesForYear, (e) => e.amount.amount), [expensesForYear]);
  const billsTotalYear = useMemo(() => sumBy(projectedBillsForYear, (b) => b.amount), [projectedBillsForYear]);
  const spendingTotalYear = useMemo(() => expensesTotalYear + billsTotalYear, [expensesTotalYear, billsTotalYear]);

  const spendingByCategory = useMemo(() => {
    const bucket = new Map<string, number>();
    for (const e of expensesForMonth) {
      bucket.set(e.categoryId, (bucket.get(e.categoryId) ?? 0) + e.amount.amount);
    }
    for (const b of projectedBillsForMonth) {
      bucket.set(b.categoryId, (bucket.get(b.categoryId) ?? 0) + b.amount);
    }
    return [...bucket.entries()]
      .map(([categoryId, total]) => ({ categoryId, total }))
      .sort((a, b) => b.total - a.total);
  }, [expensesForMonth, projectedBillsForMonth]);

  const spendingByCategoryYear = useMemo(() => {
    const bucket = new Map<string, number>();
    for (const e of expensesForYear) {
      bucket.set(e.categoryId, (bucket.get(e.categoryId) ?? 0) + e.amount.amount);
    }
    for (const b of projectedBillsForYear) {
      bucket.set(b.categoryId, (bucket.get(b.categoryId) ?? 0) + b.amount);
    }
    return [...bucket.entries()]
      .map(([categoryId, total]) => ({ categoryId, total }))
      .sort((a, b) => b.total - a.total);
  }, [expensesForYear, projectedBillsForYear]);

  const sankeyData = useMemo(() => {
    if (!data) return { nodes: [], links: [] };
    const income = incomeTotal;
    const balance = income - spendingTotal;
    const balanceNodeName = balance >= 0 ? "Unter Budget" : "Über Budget";
    const balanceNodeColor = balance >= 0 ? "#22c55e" : "#ef4444";
    // Ignore categories without flow so ECharts doesn't render phantom nodes that overlap "Einnahmen".
    const activeCategoryIds = new Set(spendingByCategory.filter((x) => x.total > 0).map((x) => x.categoryId));
    const nodeIndexByCategoryId = new Map<string, number>();

    const nodes = [
      { name: "Einnahmen", color: "#16a34a" },
      ...data.categories
        .filter((c) => activeCategoryIds.has(c.id))
        .map((c, idx) => {
          nodeIndexByCategoryId.set(c.id, idx + 1);
          return { name: c.name, color: c.color ?? "#94a3b8" };
        }),
      { name: balanceNodeName, color: balanceNodeColor },
    ];

    const links = spendingByCategory
      .filter((x) => x.total > 0)
      .map((x) => {
        const targetIndex = nodeIndexByCategoryId.get(x.categoryId);
        if (targetIndex === undefined) return null;
        const color = categoriesById.get(x.categoryId)?.color ?? "#94a3b8";
        return { source: 0, target: targetIndex, value: x.total, color };
      })
      .filter((l): l is { source: number; target: number; value: number; color: string } => Boolean(l));

    const balanceAbs = Math.abs(balance);
    const balanceIndex = nodes.length - 1;
    if (balanceAbs > 0.0001) {
      links.push({ source: 0, target: balanceIndex, value: balanceAbs, color: balanceNodeColor });
    }

    return { nodes, links };
  }, [data, spendingByCategory, categoriesById, incomeTotal, spendingTotal]);

  const sankeyDataYear = useMemo(() => {
    if (!data) return { nodes: [], links: [] };
    const income = incomeTotalYear;
    const balance = income - spendingTotalYear;
    const balanceNodeName = balance >= 0 ? "Unter Budget" : "Über Budget";
    const balanceNodeColor = balance >= 0 ? "#22c55e" : "#ef4444";
    const activeCategoryIds = new Set(spendingByCategoryYear.filter((x) => x.total > 0).map((x) => x.categoryId));
    const nodeIndexByCategoryId = new Map<string, number>();

    const nodes = [
      { name: "Einnahmen", color: "#16a34a" },
      ...data.categories
        .filter((c) => activeCategoryIds.has(c.id))
        .map((c, idx) => {
          nodeIndexByCategoryId.set(c.id, idx + 1);
          return { name: c.name, color: c.color ?? "#94a3b8" };
        }),
      { name: balanceNodeName, color: balanceNodeColor },
    ];

    const links = spendingByCategoryYear
      .filter((x) => x.total > 0)
      .map((x) => {
        const targetIndex = nodeIndexByCategoryId.get(x.categoryId);
        if (targetIndex === undefined) return null;
        const color = categoriesById.get(x.categoryId)?.color ?? "#94a3b8";
        return { source: 0, target: targetIndex, value: x.total, color };
      })
      .filter((l): l is { source: number; target: number; value: number; color: string } => Boolean(l));

    const balanceAbs = Math.abs(balance);
    const balanceIndex = nodes.length - 1;
    if (balanceAbs > 0.0001) {
      links.push({ source: 0, target: balanceIndex, value: balanceAbs, color: balanceNodeColor });
    }

    return { nodes, links };
  }, [data, categoriesById, incomeTotalYear, spendingByCategoryYear, spendingTotalYear]);

  const netWorthSeries = useMemo(() => {
    if (!data)
      return [] as Array<{ month: string; liquid: number; investment: number; material: number; total: number }>;

    function sumGroup(snapshot: NetWorthSnapshot, groupId: string): number {
      if ("groups" in snapshot) {
        const g = snapshot.groups.find((x) => x.id === groupId);
        return g ? sumBy(g.lines, (l) => l.amount.amount) : 0;
      }
      // legacy snapshots treat everything as liquid
      if (groupId === "liquid") return sumBy(snapshot.lines, (l) => l.amount.amount);
      return 0;
    }

    return data.netWorth
      .map((s) => {
        const liquid = sumGroup(s, "liquid");
        const investment = sumGroup(s, "investment");
        const material = sumGroup(s, "material");
        const total = liquid + investment + material;
        return { month: s.month, liquid, investment, material, total };
      })
      .sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0));
  }, [data]);

  const latestNetWorth = useMemo(() => {
    if (netWorthSeries.length === 0) return null;
    return netWorthSeries[netWorthSeries.length - 1];
  }, [netWorthSeries]);

  const netWorthChange = useMemo(() => {
    if (netWorthSeries.length < 2) return null;
    const latest = netWorthSeries[netWorthSeries.length - 1];
    const prev = netWorthSeries[netWorthSeries.length - 2];
    return {
      latest,
      prev,
      delta: latest.total - prev.total,
    };
  }, [netWorthSeries]);

  const netWorthVsProfit = useMemo(() => {
    if (!netWorthChange) return null;
    return netWorthChange.delta - profitTotal;
  }, [netWorthChange, profitTotal]);


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
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">Finanzen – Visualisierung</h1>
          <p className="text-gray-700">Charts & Auswertungen (ohne viel Tippen).</p>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>
          )}
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle>Vermögen im Zeitverlauf</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="text-sm text-gray-600">
                  {latestNetWorth ? (
                    <>
                      Letzter Stand <span className="font-medium text-gray-900">{latestNetWorth.month}</span>: {" "}
                      <span className="font-semibold text-gray-900">
                        {formatMoney(latestNetWorth.total, currency)}
                      </span>
                    </>
                  ) : (
                    "Noch keine Vermögens-Snapshots vorhanden."
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  Monat: <span className="font-medium text-gray-900">{selectedMonth}</span>
                </div>
              </div>

              <div className="w-full h-[420px]">
                {netWorthSeries.length === 0 ? (
                  <p className="text-sm text-gray-600">Keine Daten.</p>
                ) : (
                  <FinanceNetWorthStackedECharts data={netWorthSeries} height={420} currency={currency} />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Monatliche Übersicht</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border bg-white p-4">
                  <div className="text-xs text-gray-600">Einnahmen in {selectedMonth}</div>
                  <div className="text-lg font-semibold text-gray-900">{formatMoney(incomeTotal, currency)}</div>
                </div>
                <div className="rounded-xl border bg-white p-4">
                  <div className="text-xs text-gray-600">Ausgaben (inkl. Fixkosten) in {selectedMonth}</div>
                  <div className="text-lg font-semibold text-gray-900">{formatMoney(spendingTotal, currency)}</div>
                </div>
                <div className="rounded-xl border bg-white p-4">
                  <div className="text-xs text-gray-600">Gewinn / Cashflow ({selectedMonth})</div>
                  <div
                    className={`text-lg font-semibold ${profitTotal >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                  >
                    {formatMoney(profitTotal, currency)}
                  </div>
                  <p className="text-xs text-gray-600">Einnahmen minus Ausgaben</p>
                </div>
              </div>

              {netWorthChange ? (
                <div className="mt-4 rounded-xl border bg-white p-4">
                  <div className="text-xs text-gray-600">
                    Vermögensveränderung {netWorthChange.prev.month} → {netWorthChange.latest.month}
                  </div>
                  <div
                    className={`text-lg font-semibold ${netWorthChange.delta >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                  >
                    {formatMoney(netWorthChange.delta, currency)}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {(() => {
                      if (netWorthVsProfit === null) return null;
                      const diffAbs = Math.abs(netWorthVsProfit);
                      if (diffAbs < 1) {
                        return "Der Vermögenssprung deckt sich nahezu mit dem ausgewiesenen Gewinn.";
                      }
                      if (netWorthVsProfit > 0) {
                        return `Vermögen stieg ${formatMoney(diffAbs, currency)} stärker als der Gewinn (z.B. Kursgewinne oder externe Zuflüsse).`;
                      }
                      return `Vermögen wuchs ${formatMoney(diffAbs, currency)} weniger als der Gewinn (mögliche Sonderausgaben oder offene Buchungen).`;
                    })()}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-gray-500 mt-3">Noch keine Vermögensdaten zum Vergleichen vorhanden.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Ausgaben – Sankey (Monat {sankeyMonth})</CardTitle>
            </CardHeader>
            <CardContent>
              {sankeyData.links.length === 0 ? (
                <p className="text-sm text-gray-600">Keine Daten für {sankeyMonth}.</p>
              ) : (
                <div className="w-full overflow-x-auto">
                  <div className="min-w-[720px] bg-white rounded-xl border p-2">
                    <FinanceSankeyECharts data={sankeyData} height={240} />
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-600 mt-3">
                Unter Budget = Einnahmen waren höher als Ausgaben. Über Budget = Ausgaben waren höher als Einnahmen.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Ausgaben – Sankey (letzte 12 Monate: {sankeyPeriodLabel})</CardTitle>
            </CardHeader>
            <CardContent>
              {sankeyDataYear.links.length === 0 ? (
                <p className="text-sm text-gray-600">Keine Daten für {sankeyPeriodLabel}.</p>
              ) : (
                <div className="w-full overflow-x-auto">
                  <div className="min-w-[720px] bg-white rounded-xl border p-2">
                    <FinanceSankeyECharts data={sankeyDataYear} height={240} />
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-600 mt-3">
                Rolling 12 Monate: Einnahmen (Summe) → Kategorien + Unter/Über Budget.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
