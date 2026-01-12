import { Button } from "@/components/ui/button";
import { formatMoney } from "@/components/finance/financeFormat";
import type { Income, ISODate, YearMonth } from "@/features/finance/types";
import { useMemo, useState } from "react";

type IncomeRowKey = string;

function monthToNumber(m: YearMonth): number {
  const [yy, mm] = m.split("-").map((x) => Number(x));
  return yy * 12 + (mm - 1);
}

function numberToMonth(n: number): YearMonth {
  const y = Math.floor(n / 12);
  const m = (n % 12) + 1;
  return `${y}-${`${m}`.padStart(2, "0")}` as YearMonth;
}

function getLast12Months(anchor: YearMonth): YearMonth[] {
  const a = monthToNumber(anchor);
  return Array.from({ length: 12 }, (_, i) => numberToMonth(a - (11 - i)));
}

function parseLocaleNumber(input: string): number | null {
  const normalized = input.replace(/\s+/g, "").replace(/,/g, ".");
  if (normalized === "") return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function formatForEditing(n: number): string {
  return String(n);
}

function keyForName(name: string): IncomeRowKey {
  return name.trim().toLowerCase();
}

function dateForMonth(month: YearMonth): ISODate {
  // we use the 1st of the month as the canonical date for matrix entries
  return `${month}-01` as ISODate;
}

export function IncomeMonthMatrix({
  currency,
  anchorMonth,
  incomes,
  newIncomeName,
  setNewIncomeName,
  onAddIncomeName,
  onUpdateCell,
  onDeleteIncomeName,
}: {
  currency: string;
  anchorMonth: YearMonth;
  incomes: Income[];

  // “row creation” controls (kept outside so parent can persist row creation in the store)
  newIncomeName: string;
  setNewIncomeName: (v: string) => void;
  onAddIncomeName: (name: string) => void;

  // called when a cell is committed; amount=null means delete the entry for that month
  onUpdateCell: (args: { name: string; month: YearMonth; amount: number | null }) => void;

  // delete entire row (all months)
  onDeleteIncomeName: (name: string) => void;
}) {
  const months = useMemo(() => getLast12Months(anchorMonth), [anchorMonth]);

  // Aggregate by name+month. If multiple entries exist, sum them.
  const amountByNameMonth = useMemo(() => {
    const map = new Map<string, number>();
    for (const inc of incomes) {
      const m = inc.date.slice(0, 7) as YearMonth;
      const name = inc.name?.trim() ?? "";
      if (!name) continue;
      const k = `${keyForName(name)}::${m}`;
      map.set(k, (map.get(k) ?? 0) + inc.amount.amount);
    }
    return map;
  }, [incomes]);

  const rowNames = useMemo(() => {
    const set = new Map<IncomeRowKey, string>();
    for (const inc of incomes) {
      const name = inc.name?.trim() ?? "";
      if (!name) continue;
      set.set(keyForName(name), name);
    }
    return [...set.values()].sort((a, b) => a.localeCompare(b));
  }, [incomes]);

  // Local text buffers so users can type freely (e.g. "12," as an intermediate state).
  const [cellText, setCellText] = useState<Record<string, string>>({});

  function clearCellText(key: string) {
    setCellText((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  const colTotals = useMemo(() => {
    return months.map((m) => {
      let sum = 0;
      for (const name of rowNames) {
        sum += amountByNameMonth.get(`${keyForName(name)}::${m}`) ?? 0;
      }
      return sum;
    });
  }, [amountByNameMonth, months, rowNames]);

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">Einnahmen</div>
          <div className="text-xs text-gray-600">Kategorien links (z.B. Gehalt), Monate als Spalten.</div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3 mb-4">
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-700">Neue Einnahme-Kategorie</label>
          <input
            value={newIncomeName}
            onChange={(e) => setNewIncomeName(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="z.B. Gehalt, Nebenjob, Kindergeld"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const name = newIncomeName.trim();
                if (name) onAddIncomeName(name);
              }
            }}
          />
        </div>
        <div className="flex items-end md:justify-end">
          <Button
            className="h-10 w-full md:w-auto"
            onClick={() => {
              const name = newIncomeName.trim();
              if (name) onAddIncomeName(name);
            }}
          >
            Hinzufügen
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full table-fixed text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="text-left font-medium px-3 py-2 w-52">Einnahme</th>
              {months.map((m) => (
                <th key={m} className="text-right font-medium px-2 py-2 whitespace-nowrap">
                  {m}
                </th>
              ))}
              <th className="text-right font-medium px-2 py-2 whitespace-nowrap w-24">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {rowNames.length === 0 ? (
              <tr>
                <td colSpan={months.length + 2} className="px-4 py-6 text-center text-gray-600">
                  Noch keine Einnahmen-Kategorien.
                </td>
              </tr>
            ) : (
              rowNames.map((name) => {
                const rowKey = keyForName(name);
                return (
                  <tr key={rowKey} className="border-t">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{name}</div>
                      <div className="text-xs text-gray-600">Wert pro Monat</div>
                    </td>

                    {months.map((m) => {
                      const id = `${rowKey}::${m}`;
                      const raw = amountByNameMonth.get(id);
                      const display = cellText[id] ?? (typeof raw === "number" && raw !== 0 ? formatForEditing(raw) : "");

                      return (
                        <td key={m} className="px-2 py-2 text-right">
                          <input
                            inputMode="decimal"
                            className="w-full rounded-md border px-2 py-1 text-right tabular-nums"
                            value={display}
                            onChange={(e) => {
                              const v = e.target.value;
                              setCellText((prev) => ({ ...prev, [id]: v }));
                            }}
                            onBlur={(e) => {
                              const v = e.currentTarget.value.trim();
                              if (v === "") {
                                onUpdateCell({ name, month: m, amount: null });
                              } else {
                                const parsed = parseLocaleNumber(v);
                                if (parsed !== null) {
                                  onUpdateCell({ name, month: m, amount: parsed });
                                }
                              }
                              clearCellText(id);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                (e.currentTarget as HTMLInputElement).blur();
                              }
                            }}
                          />
                        </td>
                      );
                    })}

                    <td className="px-2 py-2 text-right">
                      <Button variant="secondary" className="h-8" onClick={() => onDeleteIncomeName(name)}>
                        Löschen
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {rowNames.length > 0 && (
            <tfoot>
              <tr className="border-t bg-gray-50">
                <td className="px-3 py-2 font-medium text-gray-700 whitespace-nowrap">Summe</td>
                {colTotals.map((t, idx) => (
                  <td key={months[idx]} className="px-2 py-2 text-right font-semibold tabular-nums whitespace-nowrap">
                    {formatMoney(t, currency)}
                  </td>
                ))}
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <p className="text-xs text-gray-500 mt-3">
        Hinweis: Pro Name+Monat wird ein Eintrag gespeichert (Datum wird intern auf den 1. gesetzt: {dateForMonth(anchorMonth)}).
      </p>
    </div>
  );
}
