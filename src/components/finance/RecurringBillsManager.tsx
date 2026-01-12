import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import type { FinanceCategory, RecurringBill, YearMonth } from "@/features/finance/types";

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

function amountForMonth(bill: RecurringBill, month: YearMonth): number | null {
  if (month < bill.startMonth) return null;
  const sorted = bill.amountHistory
    .slice()
    .sort((a, b) => (a.effectiveMonth < b.effectiveMonth ? -1 : a.effectiveMonth > b.effectiveMonth ? 1 : 0));
  let current: number | null = null;
  for (const h of sorted) {
    if (h.effectiveMonth <= month) current = h.amount.amount;
  }
  return current;
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

export function RecurringBillsManager({
  categories,
  bills,
  billName,
  setBillName,
  billAmount,
  setBillAmount,
  billDueDay,
  setBillDueDay,
  billCategoryId,
  setBillCategoryId,
  billStartMonth,
  setBillStartMonth,
  onAddBill,
  onToggleBill,
  onDeleteBill,
  setChangeEffectiveMonth,
  setChangeAmount,
  onAddChange,
  onDeleteChange,
}: {
  categories: FinanceCategory[];
  bills: RecurringBill[];

  billName: string;
  setBillName: (v: string) => void;
  billAmount: number;
  setBillAmount: (v: number) => void;
  billDueDay: number;
  setBillDueDay: (v: number) => void;
  billCategoryId: string;
  setBillCategoryId: (v: string) => void;
  billStartMonth: YearMonth;
  setBillStartMonth: (v: YearMonth) => void;

  onAddBill: () => void;
  onToggleBill: (b: RecurringBill) => void;
  onDeleteBill: (id: string) => void;

  setChangeEffectiveMonth: (v: YearMonth) => void;
  setChangeAmount: (v: number) => void;
  onAddChange: (b: RecurringBill) => void;
  onDeleteChange: (b: RecurringBill, effectiveMonth: YearMonth) => void;
}) {
  const months = useMemo(() => getLast12Months(billStartMonth), [billStartMonth]);

  const sortedBills = useMemo(
    () => bills.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [bills]
  );

  // Local text buffers per cell so users can type intermediate states ("12,", "12.").
  const [cellText, setCellText] = useState<Record<string, string>>({});

  function clearCellText(key: string) {
    setCellText((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  // We use a simple strategy:
  // - Editing a cell creates/overwrites an amountHistory entry effective at that month.
  // - Clearing a cell removes the history entry *for that exact month* (falls back to previous).
  async function onCommitCell(b: RecurringBill, month: YearMonth, value: string) {
    if (month < b.startMonth) return; // not active yet

    const trimmed = value.trim();
    if (trimmed === "") {
      onDeleteChange(b, month);
      return;
    }

    const parsed = parseLocaleNumber(trimmed);
    if (parsed === null) return;

    // Use provided change inputs/callback to avoid changing store logic here.
    setChangeEffectiveMonth(month);
    setChangeAmount(parsed);
    onAddChange(b);
  }

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">Wiederkehrende Zahlungen (Fixkosten)</div>
          <div className="text-xs text-gray-600">Monatlich/regelmäßig mit Startmonat + Betragsänderungen</div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border mb-6">
        <table className="w-full table-fixed text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="text-left font-medium px-3 py-2 w-64">Fixkosten</th>
              {months.map((m) => (
                <th key={m} className="text-right font-medium px-2 py-2 whitespace-nowrap">
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedBills.length === 0 ? (
              <tr>
                <td colSpan={months.length + 1} className="px-4 py-6 text-center text-gray-600">
                  Noch keine Fixkosten angelegt.
                </td>
              </tr>
            ) : (
              sortedBills.map((b) => {
                  const cat = categories.find((c) => c.id === b.categoryId);
                  return (
                    <tr key={b.id} className="border-t">
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-900">{b.name}</div>
                        <div className="text-xs text-gray-600">
                          {cat?.name ?? "Unbekannt"} · Tag {b.dueDay} · Start {b.startMonth}
                          {b.active ? "" : " · pausiert"}
                        </div>
                      </td>
                      {months.map((m) => {
                        const id = `${b.id}::${m}`;
                        const v = amountForMonth(b, m);
                        const isDisabled = m < b.startMonth || !b.active;
                        return (
                          <td key={m} className="px-2 py-2 text-right">
                            <input
                              inputMode="decimal"
                              disabled={isDisabled}
                              className={
                                "w-full rounded-md border px-2 py-1 text-right tabular-nums " +
                                (isDisabled ? "bg-gray-50 text-gray-400" : "")
                              }
                              value={cellText[id] ?? (typeof v === "number" ? formatForEditing(v) : "")}
                              onChange={(e) => setCellText((prev) => ({ ...prev, [id]: e.target.value }))}
                              onBlur={(e) => {
                                onCommitCell(b, m, e.currentTarget.value);
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
                    </tr>
                  );
                })
            )}
          </tbody>
        </table>
      </div>

      <div className="grid md:grid-cols-5 gap-3 mb-4">
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-700">Name</label>
          <input
            value={billName}
            onChange={(e) => setBillName(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="z.B. Miete"
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
        <div>
          <label className="text-sm font-medium text-gray-700">Fälligkeit (Tag)</label>
          <input
            type="number"
            value={billDueDay}
            onChange={(e) => setBillDueDay(Number(e.target.value))}
            className="mt-1 w-full rounded-md border px-3 py-2"
            min={1}
            max={31}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Start (YYYY-MM)</label>
          <input
            value={billStartMonth}
            onChange={(e) => setBillStartMonth(e.target.value as YearMonth)}
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="YYYY-MM"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-5 gap-3 mb-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Kategorie</label>
          <select
            value={billCategoryId}
            onChange={(e) => setBillCategoryId(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-4 flex items-end">
          <Button onClick={onAddBill} className="h-10">Fixkosten hinzufügen</Button>
        </div>
      </div>

      <div className="space-y-3">
        {sortedBills.length > 0 && (
          <div className="rounded-lg border p-3">
            <div className="text-xs font-medium text-gray-700 mb-2">Schnellaktionen</div>
            <div className="flex flex-wrap items-center gap-2">
              {sortedBills.map((b) => (
                  <div key={b.id} className="flex items-center gap-2 rounded-md border bg-white px-2 py-1">
                    <div className="text-sm text-gray-900 font-medium">{b.name}</div>
                    <Button variant="secondary" className="h-8" onClick={() => onToggleBill(b)}>
                      {b.active ? "Pausieren" : "Aktivieren"}
                    </Button>
                    <Button variant="secondary" className="h-8" onClick={() => onDeleteBill(b.id)}>
                      Löschen
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
