import type { YearMonth } from "@/features/finance/types";

export function MonthPicker({
  label,
  value,
  onChange,
  placeholder = "YYYY-MM",
}: {
  label: string;
  value: YearMonth;
  onChange: (value: YearMonth) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value as YearMonth)}
        className="mt-1 w-full rounded-md border px-3 py-2"
        placeholder={placeholder}
      />
    </div>
  );
}
