import { Button } from "@/components/ui/button";

export function IncomeEntry({
  name,
  setName,
  amount,
  setAmount,
  date,
  setDate,
  onAdd,
}: {
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
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">Einnahmen</div>
          <div className="text-xs text-gray-600">Gehalt, Nebenjob, Rückerstattung …</div>
        </div>
        <Button onClick={onAdd} className="shrink-0">Hinzufügen</Button>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="z.B. Gehalt"
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
    </div>
  );
}
