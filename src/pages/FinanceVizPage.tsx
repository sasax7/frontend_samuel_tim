import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  Expense,
  FinanceCategory,
  Income,
  NetWorthSnapshot,
  YearMonth,
} from "@/features/finance/types";
import { getActiveFinanceStore } from "@/features/finance/activeStore";
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

export default function FinanceVizPage() {
  const store = getActiveFinanceStore();
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
        setData(d);
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
        const value = x.total;
        return { source: 0, target: targetIndex === -1 ? 0 : targetIndex, value, color };
      })
      .filter((l) => l.target !== 0)
      .filter((l) => l.value > 0);

    const balanceAbs = Math.abs(balance);
    const balanceIndex = nodes.findIndex((n) => n.name === balanceNodeName);
    if (balanceAbs > 0.0001 && balanceIndex > 0) {
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

    const nodes = [
      { name: "Einnahmen", color: "#16a34a" },
      ...data.categories.map((c) => ({ name: c.name, color: c.color ?? "#94a3b8" })),
      { name: balanceNodeName, color: balanceNodeColor },
    ];

    const links = spendingByCategoryYear
      .filter((x) => x.total > 0)
      .map((x) => {
        const catName = categoriesById.get(x.categoryId)?.name ?? "Unbekannt";
        const targetIndex = nodes.findIndex((n) => n.name === catName);
        const color = categoriesById.get(x.categoryId)?.color ?? "#94a3b8";
        const value = x.total;
        return { source: 0, target: targetIndex === -1 ? 0 : targetIndex, value, color };
      })
      .filter((l) => l.target !== 0)
      .filter((l) => l.value > 0);

    const balanceAbs = Math.abs(balance);
    const balanceIndex = nodes.findIndex((n) => n.name === balanceNodeName);
    if (balanceAbs > 0.0001 && balanceIndex > 0) {
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
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border bg-white p-4">
                  <div className="text-xs text-gray-600">Einnahmen in {selectedMonth}</div>
                  <div className="text-lg font-semibold text-gray-900">{formatMoney(incomeTotal, currency)}</div>
                </div>
                <div className="rounded-xl border bg-white p-4">
                  <div className="text-xs text-gray-600">Ausgaben (inkl. Fixkosten) in {selectedMonth}</div>
                  <div className="text-lg font-semibold text-gray-900">{formatMoney(spendingTotal, currency)}</div>
                </div>
              </div>
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
