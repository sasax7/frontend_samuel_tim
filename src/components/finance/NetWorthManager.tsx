import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import type { NetWorthSnapshotV2, YearMonth } from "@/features/finance/types";
import { formatMoney } from "@/components/finance/financeFormat";

export type NetWorthGroupKey = "liquid" | "investment" | "material";

type NetWorthAccountKey = string;

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

function accountKey(groupId: string, accountName: string): NetWorthAccountKey {
  return `${groupId}::${accountName.trim()}`;
}

function parseLocaleNumber(input: string): number | null {
  const normalized = input.replace(/\s+/g, "").replace(/,/g, ".");
  if (normalized === "") return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function formatForEditing(n: number): string {
  // Keep it simple: show raw number for editing. (Display formatting is handled elsewhere.)
  return String(n);
}

export function NetWorthManager({
  currency,
  snapshotMonth,
  setSnapshotMonth,
  snapshot,
  getSnapshot,
  group,
  setGroup,
  accountName,
  setAccountName,
  amount,
  setAmount,
  onAddLine,
  onUpdateCell,
}: {
  currency: string;
  snapshotMonth: YearMonth;
  setSnapshotMonth: (m: YearMonth) => void;
  snapshot: NetWorthSnapshotV2;
  getSnapshot: (month: YearMonth) => NetWorthSnapshotV2;

  group: NetWorthGroupKey;
  setGroup: (g: NetWorthGroupKey) => void;

  accountName: string;
  setAccountName: (s: string) => void;
  amount: number;
  setAmount: (n: number) => void;

  onAddLine: () => void;
  onUpdateCell: (args: {
    month: YearMonth;
    groupId: string;
    groupName: string;
    accountName: string;
    amount: number | null;
  }) => void;
}) {
  const months = useMemo(() => getLast12Months(snapshotMonth), [snapshotMonth]);

  // Row model is the union of all accounts present across the last 12 months.
  const accounts = useMemo(() => {
    const map = new Map<NetWorthAccountKey, { groupId: string; groupName: string; name: string }>();

    for (const m of months) {
      const s = m === snapshot.month ? snapshot : getSnapshot(m);
      for (const g of s.groups) {
        for (const l of g.lines) {
          const key = accountKey(g.id, l.name);
          if (!map.has(key)) map.set(key, { groupId: g.id, groupName: g.name, name: l.name });
        }
      }
    }

    // Also include whatever the user is currently typing so they can fill it directly.
    if (accountName.trim()) {
      const gid = group;
      const gname = group === "liquid" ? "Liquid" : group === "investment" ? "Investment" : "Material";
      map.set(accountKey(gid, accountName), { groupId: gid, groupName: gname, name: accountName.trim() });
    }

    return [...map.values()].sort(
      (a, b) => a.groupName.localeCompare(b.groupName) || a.name.localeCompare(b.name)
    );
  }, [accountName, getSnapshot, group, months, snapshot]);

  const valueByMonthGroupAccount = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of months) {
      const s = m === snapshot.month ? snapshot : getSnapshot(m);
      for (const g of s.groups) {
        for (const l of g.lines) {
          map.set(`${m}::${accountKey(g.id, l.name)}`, l.amount.amount);
        }
      }
    }
    return map;
  }, [getSnapshot, months, snapshot]);

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
      for (const a of accounts) {
        const v = valueByMonthGroupAccount.get(`${m}::${accountKey(a.groupId, a.name)}`);
        sum += typeof v === "number" ? v : 0;
      }
      return sum;
    });
  }, [accounts, months, valueByMonthGroupAccount]);

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">Vermögen</div>
          <div className="text-xs text-gray-600">Konten/Assets (Liquid · Investments · Sachwerte)</div>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-3 mb-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Monat (YYYY-MM)</label>
          <input
            value={snapshotMonth}
            onChange={(e) => setSnapshotMonth(e.target.value as YearMonth)}
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="YYYY-MM"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Gruppe</label>
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value as NetWorthGroupKey)}
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
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>
        <div className="md:col-span-1">
          <label className="text-sm font-medium text-gray-700">Konto / Asset</label>
          <input
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="z.B. VR Bank, Scalable …"
          />
        </div>
      </div>

      <div className="flex items-center justify-end mb-4">
        <Button onClick={onAddLine} className="h-10">
          Hinzufügen
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full table-fixed text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="text-left font-medium px-3 py-2 w-52">Konto/Asset</th>
              {months.map((m) => (
                <th key={m} className="text-right font-medium px-2 py-2 whitespace-nowrap">
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 ? (
              <tr>
                <td colSpan={months.length + 1} className="px-4 py-6 text-center text-gray-600">
                  Noch keine Vermögens-Einträge in den letzten 12 Monaten.
                </td>
              </tr>
            ) : (
              accounts.map((a) => {
                const rowKey = accountKey(a.groupId, a.name);
                return (
                  <tr key={rowKey} className="border-t">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{a.name}</div>
                      <div className="text-xs text-gray-600">{a.groupName}</div>
                    </td>

                    {months.map((m) => {
                      const key = `${m}::${rowKey}`;
                      const raw = valueByMonthGroupAccount.get(key);
                      const display = cellText[key] ?? (typeof raw === "number" ? formatForEditing(raw) : "");

                      return (
                        <td key={m} className="px-2 py-2 text-right">
                          <input
                            inputMode="decimal"
                            className="w-full rounded-md border px-2 py-1 text-right tabular-nums"
                            value={display}
                            onChange={(e) => {
                              const v = e.target.value;
                              setCellText((prev) => ({ ...prev, [key]: v }));
                            }}
                            onBlur={(e) => {
                              const v = e.currentTarget.value.trim();
                              if (v === "") {
                                onUpdateCell({
                                  month: m,
                                  groupId: a.groupId,
                                  groupName: a.groupName,
                                  accountName: a.name,
                                  amount: null,
                                });
                              } else {
                                const parsed = parseLocaleNumber(v);
                                if (parsed !== null) {
                                  onUpdateCell({
                                    month: m,
                                    groupId: a.groupId,
                                    groupName: a.groupName,
                                    accountName: a.name,
                                    amount: parsed,
                                  });
                                }
                              }
                              clearCellText(key);
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
          {accounts.length > 0 && (
            <tfoot>
              <tr className="border-t bg-gray-50">
                <td className="px-3 py-2 font-medium text-gray-700 whitespace-nowrap">Summe</td>
                {colTotals.map((t, idx) => (
                  <td key={months[idx]} className="px-2 py-2 text-right font-semibold tabular-nums whitespace-nowrap">
                    {formatMoney(t, currency)}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
