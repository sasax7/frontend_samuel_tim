import { Button } from "@/components/ui/button";
import type { FinanceCategory } from "@/features/finance/types";

export function QuickBillEntry({
  categories,
  categoryId,
  setCategoryId,
  name,
  setName,
  amount,
  setAmount,
  date,
  setDate,
  onAdd,
}: {
  categories: FinanceCategory[];
  categoryId: string;
  setCategoryId: (id: string) => void;
  name: string;
  setName: (v: string) => void;
  amount: number;
  setAmount: (v: number) => void;
  date: string;
  setDate: (v: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-900">Schnell buchen</div>
            <div className="text-xs text-gray-600">Einzelne Rechnung/Ausgabe eintragen</div>
          </div>
          <Button onClick={onAdd} className="shrink-0">Hinzufügen</Button>
        </div>

        <div className="grid md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2"
              placeholder="z.B. Strom, Essen, Tanken"
            />
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
          <div>
            <label className="text-sm font-medium text-gray-700">Datum</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Kategorie</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
