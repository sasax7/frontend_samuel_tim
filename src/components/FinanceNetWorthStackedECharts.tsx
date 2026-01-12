import ReactECharts from "echarts-for-react";

export type NetWorthStackedPoint = {
  month: string; // YearMonth
  liquid: number;
  investment: number;
  material: number;
};

export function FinanceNetWorthStackedECharts({
  data,
  height,
  currency,
}: {
  data: NetWorthStackedPoint[];
  height: number;
  currency: string;
}) {
  const hasData = data.length > 0;

  // Keep colors consistent between legend and series.
  const COLORS = {
    liquid: "#2563eb", // blue
    investment: "#7c3aed", // purple
    material: "#f59e0b", // orange
  } as const;

  type TooltipParams = {
    axisValue?: unknown;
    seriesName?: unknown;
    value?: unknown;
    marker?: unknown;
  };

  const option = {
    backgroundColor: "transparent",
    animation: false,
    // ECharts uses this palette for legend markers and tooltips;
    // we align it with our series colors below.
    color: [COLORS.liquid, COLORS.investment, COLORS.material],
    grid: { left: 8, right: 8, top: 10, bottom: 28, containLabel: true },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "line" },
      formatter: (params: unknown) => {
        const ps = Array.isArray(params) ? (params as TooltipParams[]) : [];
        const month = typeof ps[0]?.axisValue === "string" ? (ps[0].axisValue as string) : "";

        const fmt = (n: number) =>
          new Intl.NumberFormat("de-DE", { style: "currency", currency, maximumFractionDigits: 2 }).format(n);

        const rows = ps
          .map((p) => {
            const name = String(p.seriesName ?? "");
            const val = typeof p.value === "number" ? (p.value as number) : 0;
            const marker = typeof p.marker === "string" ? (p.marker as string) : "";
            return `${marker}${name}: <b>${fmt(val)}</b>`;
          })
          .join("<br/>");

        const total = ps.reduce((acc, p) => (acc + (typeof p.value === "number" ? (p.value as number) : 0)), 0);
        return `<b>${month}</b><br/>${rows}<br/><span style="color:#334155">Summe: <b>${fmt(total)}</b></span>`;
      },
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: data.map((d) => d.month),
      axisLabel: { color: "#334155" },
      axisLine: { lineStyle: { color: "#cbd5e1" } },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: "#334155",
        formatter: (v: unknown) => {
          const n = typeof v === "number" ? v : Number(v);
          if (!Number.isFinite(n)) return "";
          return new Intl.NumberFormat("de-DE", { notation: "compact", maximumFractionDigits: 1 }).format(n);
        },
      },
      splitLine: { lineStyle: { color: "#e2e8f0" } },
    },
    legend: {
      bottom: 0,
      textStyle: { color: "#334155" },
      data: ["Liquid", "Investment", "Sachwerte"],
    },
    series: [
      {
        name: "Liquid",
        type: "line",
        stack: "total",
        smooth: true,
        symbol: "none",
        lineStyle: { width: 2, color: COLORS.liquid },
        areaStyle: { opacity: 0.28, color: COLORS.liquid },
        data: data.map((d) => d.liquid),
      },
      {
        name: "Investment",
        type: "line",
        stack: "total",
        smooth: true,
        symbol: "none",
        lineStyle: { width: 2, color: COLORS.investment },
        areaStyle: { opacity: 0.24, color: COLORS.investment },
        data: data.map((d) => d.investment),
      },
      {
        name: "Sachwerte",
        type: "line",
        stack: "total",
        smooth: true,
        symbol: "none",
        lineStyle: { width: 2, color: COLORS.material },
        areaStyle: { opacity: 0.22, color: COLORS.material },
        data: data.map((d) => d.material),
      },
    ],
  } as const;

  type EChartsOption = Record<string, unknown>;

  return (
    <div style={{ height }} className="min-w-0">
      {hasData ? (
        <ReactECharts style={{ height: "100%", width: "100%" }} option={option as unknown as EChartsOption} notMerge lazyUpdate />
      ) : null}
    </div>
  );
}
