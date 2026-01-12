import { Button } from "@/components/ui/button";
import type { Income } from "@/features/finance/types";
import { formatMoney } from "@/components/finance/financeFormat";

export function IncomeTable({
  currency,
  rows,
  onDelete,
}: {
  currency: string;
  rows: Income[];
  onDelete: (id: string) => void;
}) {
  const sorted = rows
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const total = sorted.reduce((acc, r) => acc + r.amount.amount, 0);

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-900">Einnahmen (Tabelle)</div>
          <div className="text-xs text-gray-600">Übersicht für den Monat</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[700px] w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
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
                  <td className="px-4 py-2 whitespace-nowrap">{r.date}</td>
                  <td className="px-4 py-2">{r.name}</td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {formatMoney(r.amount.amount, currency)}
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
                <td className="px-4 py-2 text-right font-semibold tabular-nums">
                  {formatMoney(total, currency)}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
