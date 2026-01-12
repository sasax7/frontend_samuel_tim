import { Button } from "@/components/ui/button";
import type { FinanceCategory } from "@/features/finance/types";

export function CategoryManager({
  categories,
  newCategory,
  setNewCategory,
  onAddCategory,
  onDeleteCategory,
}: {
  categories: FinanceCategory[];
  newCategory: string;
  setNewCategory: (v: string) => void;
  onAddCategory: () => void;
  onDeleteCategory: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">Kategorien</div>
          <div className="text-xs text-gray-600">Für Ausgaben & Fixkosten</div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end gap-3 mb-4">
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-700">Neue Kategorie</label>
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="z.B. Lebensmittel"
          />
        </div>
        <Button onClick={onAddCategory} className="h-10">Hinzufügen</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.length === 0 ? (
          <span className="text-sm text-gray-600">Noch keine Kategorien.</span>
        ) : (
          categories.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-2 rounded-full border bg-gray-50 px-3 py-1 text-sm"
              title={c.id}
            >
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: c.color ?? "#94a3b8" }} />
              <span className="text-gray-800">{c.name}</span>
              <button
                type="button"
                className="text-gray-500 hover:text-red-600"
                onClick={() => onDeleteCategory(c.id)}
                aria-label={`Kategorie löschen: ${c.name}`}
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  );
}
