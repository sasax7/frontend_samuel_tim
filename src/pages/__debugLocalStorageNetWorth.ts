import { createLocalFinanceStore } from "@/features/finance/store";
import { uid } from "@/features/finance/id";

/**
 * Dev-only debug helper to validate that net worth snapshots are written to localStorage.
 * Not imported anywhere in production.
 */
export async function debugNetWorthWriteRead() {
  const store = createLocalFinanceStore();
  const data = await store.get();
  const month = (new Date().toISOString().slice(0, 7) as `${number}-${number}`);

  const snapshot = {
    id: `nw_${month}`,
    month,
    groups: [
      {
        id: "liquid",
        name: "Liquid",
        lines: [
          {
            id: uid("nw"),
            name: "__debug_row__",
            amount: { amount: 123.45, currency: data.currency ?? "EUR" },
          },
        ],
      },
      { id: "investment", name: "Investment", lines: [] },
      { id: "material", name: "Material", lines: [] },
    ],
  };

  await store.upsertNetWorthSnapshot(snapshot);
  const after = await store.get();
  const written = after.netWorth.find((s) => s.month === month);

  console.log("[debugNetWorthWriteRead] month=", month, "written=", written);
}
