import ReactECharts from "echarts-for-react";

export type FinanceSankeyNode = {
  name: string;
  color?: string;
};

export type FinanceSankeyLink = {
  source: number;
  target: number;
  value: number;
  color?: string;
};

export type FinanceSankeyData = {
  nodes: FinanceSankeyNode[];
  links: FinanceSankeyLink[];
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function formatEUR(value: number) {
  // Keep it compact for labels while still readable.
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function FinanceSankeyECharts({
  data,
  height,
}: {
  data: FinanceSankeyData;
  height: number;
}) {
  const hasData = data.links.length > 0 && data.nodes.length > 1;

  const nodeTotals = (() => {
    const totals = new Map<string, number>();
    for (const n of data.nodes) totals.set(n.name, 0);

    // For node labels, show the larger of incoming vs outgoing flow.
    for (const l of data.links) {
      const s = data.nodes[l.source]?.name;
      const t = data.nodes[l.target]?.name;
      if (s) totals.set(s, Math.max(totals.get(s) ?? 0, l.value));
      if (t) totals.set(t, Math.max(totals.get(t) ?? 0, l.value));
    }
    return totals;
  })();

  type TooltipParams = {
    dataType?: "edge" | "node" | string;
    name?: string;
    data?: { value?: unknown; source?: unknown; target?: unknown };
  };

  const option = {
    backgroundColor: "transparent",
    animation: false,
    tooltip: {
      trigger: "item",
      formatter: (params: unknown) => {
        const p = params as TooltipParams;
        if (p?.dataType === "edge") {
          const v = typeof p?.data?.value === "number" ? (p.data.value as number) : 0;
          const s = typeof p?.data?.source === "string" ? (p.data.source as string) : "";
          const t = typeof p?.data?.target === "string" ? (p.data.target as string) : "";
          return `${s} → ${t}<br/>${new Intl.NumberFormat("de-DE", {
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 2,
          }).format(v)}`;
        }
        if (p?.dataType === "node") {
          const name = p.name ?? "";
          const total = nodeTotals.get(name) ?? 0;
          return total > 0 ? `${name}<br/>${formatEUR(total)}` : name;
        }
        return "";
      },
    },
    series: [
      {
        type: "sankey",
        // Reserve extra space on the right so labels on the last column don't get clipped.
        left: 8,
        right: 120,
        top: 8,
        bottom: 8,
        emphasis: { focus: "adjacency" },
        data: data.nodes.map((n) => ({
          name: n.name,
          itemStyle: {
            color: n.color ?? "#94a3b8",
          },
        })),
        links: data.links.map((l) => ({
          source: data.nodes[l.source]?.name ?? String(l.source),
          target: data.nodes[l.target]?.name ?? String(l.target),
          value: l.value,
          lineStyle: {
            color: l.color ?? "#94a3b8",
            opacity: clamp(0.55, 0.1, 0.95),
          },
        })),
        nodeWidth: 14,
        nodeGap: 18,
        draggable: false,
        lineStyle: {
          curveness: 0.5,
        },
        // Help ECharts auto-resolve label overlaps and keep them within bounds.
        labelLayout: {
          hideOverlap: true,
          moveOverlap: "shiftY",
        },
        label: {
          color: "#0f172a",
          fontSize: 12,
          // Don't cut off the right-side labels; we already reserve space via series.right.
          overflow: "none",
          width: 260,
          formatter: (params: unknown) => {
            const p = params as { name?: string };
            const name = p?.name ?? "";
            const total = nodeTotals.get(name) ?? 0;
            return total > 0 ? `${name}  ${formatEUR(total)}` : name;
          },
        },
      },
    ],
  } as const;

  // echarts-for-react accepts a plain JS object; keep the type local and lightweight.
  type EChartsOption = Record<string, unknown>;

  return (
    <div style={{ height }} className="min-w-0">
      {hasData ? (
        <ReactECharts
          style={{ height: "100%", width: "100%" }}
          option={option as unknown as EChartsOption}
          notMerge
          lazyUpdate
        />
      ) : null}
    </div>
  );
}
