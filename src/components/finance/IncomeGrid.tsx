import { Button } from "@/components/ui/button";
import { formatMoney } from "@/components/finance/financeFormat";
import type { Income, ISODate } from "@/features/finance/types";
import { useCallback, useMemo, useState } from "react";

function parseLocaleNumber(input: string): number | null {
  const normalized = input.replace(/\s+/g, "").replace(/,/g, ".");
  if (normalized === "") return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function formatForEditing(n: number): string {
  return String(n);
}

function todayISO(): ISODate {
  const d = new Date();
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}` as ISODate;
}

export function IncomeGrid({
  currency,
  rows,
  defaultMonth,
  onUpsert,
  onDelete,
}: {
  currency: string;
  rows: Income[];
  defaultMonth: string; // YYYY-MM
  onUpsert: (income: Income) => void;
  onDelete: (id: string) => void;
}) {
  const sorted = useMemo(
    () => rows.slice().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)),
    [rows]
  );

  const total = useMemo(() => sorted.reduce((acc, r) => acc + r.amount.amount, 0), [sorted]);

  // Per-cell buffers so users can type intermediates like "12,".
  const [cellText, setCellText] = useState<Record<string, string>>({});

  const clearCellText = useCallback((key: string) => {
    setCellText((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const commit = useCallback(
    (row: Income, field: "name" | "date" | "amount", rawValue?: string) => {
      const value = (rawValue ?? "").trim();

      if (field === "amount") {
        const parsed = parseLocaleNumber(value);
        if (parsed === null) return;
        if (parsed !== row.amount.amount) {
          onUpsert({ ...row, amount: { ...row.amount, amount: parsed } });
        }
        return;
      }

      if (field === "name") {
        if (value !== (row.name ?? "")) onUpsert({ ...row, name: value });
        return;
      }

      if (field === "date") {
        // Keep existing date if input is invalid/empty.
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
        if (value !== row.date) onUpsert({ ...row, date: value as ISODate });
      }
    },
    [onUpsert]
  );

  const [newName, setNewName] = useState<string>("");
  const [newAmountText, setNewAmountText] = useState<string>("");
  const [newDate, setNewDate] = useState<ISODate>(() => {
    const t = todayISO();
    if (t.slice(0, 7) === defaultMonth) return t;
    // default to first day of selected month for quicker entry
    return `${defaultMonth}-01` as ISODate;
  });

  const onAdd = useCallback(() => {
    const name = newName.trim();
    const parsed = parseLocaleNumber(newAmountText);
    if (!name || parsed === null) return;

    const id = `inc_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    onUpsert({
      id,
      name,
      date: newDate,
      amount: { amount: parsed, currency },
    });

    setNewName("");
    setNewAmountText("");
  }, [currency, newAmountText, newDate, newName, onUpsert]);

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="px-4 py-3 border-b flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">Einnahmen</div>
          <div className="text-xs text-gray-600">Excel-Style: tippen, Enter/Blur speichert.</div>
        </div>
        <div className="text-sm font-semibold text-gray-900 tabular-nums">{formatMoney(total, currency)}</div>
      </div>

      <div className="p-4 border-b bg-gray-50">
        <div className="grid md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="text-sm font-medium text-gray-700">Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2"
              placeholder="z.B. Gehalt"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Betrag</label>
            <input
              inputMode="decimal"
              value={newAmountText}
              onChange={(e) => setNewAmountText(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2"
              placeholder="z.B. 2500,00"
              onKeyDown={(e) => {
                if (e.key === "Enter") onAdd();
              }}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Datum</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value as ISODate)}
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </div>
          <div className="flex md:justify-end">
            <Button onClick={onAdd} className="h-10 w-full md:w-auto">
              Hinzufügen
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[760px] w-full text-sm">
          <thead className="bg-white text-gray-700">
            <tr className="border-b">
              <th className="text-left font-medium px-4 py-2">Datum</th>
              <th className="text-left font-medium px-4 py-2">Name</th>
              <th className="text-right font-medium px-4 py-2">Betrag</th>
              <th className="text-right font-medium px-4 py-2">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-600">
                  Keine Einnahmen für diesen Monat.
                </td>
              </tr>
            ) : (
              sorted.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-2 whitespace-nowrap">
                    <input
                      type="date"
                      className="w-full rounded-md border px-2 py-1"
                      value={cellText[`date::${r.id}`] ?? r.date}
                      onChange={(e) => setCellText((prev) => ({ ...prev, [`date::${r.id}`]: e.target.value }))}
                      onBlur={(e) => {
                        commit(r, "date", e.currentTarget.value);
                        clearCellText(`date::${r.id}`);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
                      }}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      className="w-full rounded-md border px-2 py-1"
                      value={cellText[`name::${r.id}`] ?? r.name}
                      onChange={(e) => setCellText((prev) => ({ ...prev, [`name::${r.id}`]: e.target.value }))}
                      onBlur={(e) => {
                        commit(r, "name", e.currentTarget.value);
                        clearCellText(`name::${r.id}`);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
                      }}
                    />
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    <input
                      inputMode="decimal"
                      className="w-full rounded-md border px-2 py-1 text-right tabular-nums"
                      value={cellText[`amount::${r.id}`] ?? formatForEditing(r.amount.amount)}
                      onChange={(e) =>
                        setCellText((prev) => ({ ...prev, [`amount::${r.id}`]: e.target.value }))
                      }
                      onBlur={(e) => {
                        commit(r, "amount", e.currentTarget.value);
                        clearCellText(`amount::${r.id}`);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
                      }}
                    />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Button variant="secondary" className="h-8" onClick={() => onDelete(r.id)}>
                      Löschen
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {sorted.length > 0 && (
            <tfoot>
              <tr className="border-t bg-gray-50">
                <td className="px-4 py-2 font-medium text-gray-700" colSpan={2}>
                  Summe
                </td>
                <td className="px-4 py-2 text-right font-semibold tabular-nums">{formatMoney(total, currency)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
