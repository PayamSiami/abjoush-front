/**
 * Small presentational pieces for the dashboard. Kept dependency-free: the
 * charts are CSS bars rather than a charting library, so the storefront
 * bundle does not grow for an internal page.
 */

import type { HealthStatus } from "@/lib/api";

/* ─── Status styling ────────────────────────────────────────────────────── */

export const healthStyles: Record<
  HealthStatus,
  { label: string; dot: string; text: string; badge: string }
> = {
  healthy: {
    label: "سالم",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  warning: {
    label: "هشدار",
    dot: "bg-amber-500",
    text: "text-amber-700",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
  critical: {
    label: "بحرانی",
    dot: "bg-red-500",
    text: "text-red-700",
    badge: "bg-red-50 text-red-700 border-red-200",
  },
  down: {
    label: "قطع",
    dot: "bg-neutral-500",
    text: "text-neutral-700",
    badge: "bg-neutral-100 text-neutral-700 border-neutral-300",
  },
};

function fallbackHealthStyle(status: string) {
  return healthStyles[status as HealthStatus] ?? healthStyles.down;
}

/* ─── Stat card ─────────────────────────────────────────────────────────── */

export function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-latte bg-foam p-5 shadow-sm">
      <div className="text-xs font-medium text-mocha">{label}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-ink tracking-tight tabular-nums">
          {value}
        </span>
        {accent}
      </div>
      {hint && <div className="mt-1 text-xs text-clay">{hint}</div>}
    </div>
  );
}

/* ─── Bar list ──────────────────────────────────────────────────────────── */

export interface BarDatum {
  label: string;
  value: number;
}

export function BarList({
  data,
  emptyMessage,
  barClassName = " bg-caramel",
}: {
  data: BarDatum[];
  emptyMessage: string;
  barClassName?: string;
}) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-mocha">{emptyMessage}</p>;
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <ul className="space-y-3">
      {data.map((datum) => (
        <li key={datum.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium text-ink" title={datum.label}>
              {datum.label}
            </span>
            <span className="shrink-0 tabular-nums text-clay">{datum.value}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-beige">
            <div
              className={`h-full rounded-full${barClassName}`}
              style={{ width: `${Math.max((datum.value / max) * 100, 2)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ─── Health table ──────────────────────────────────────────────────────── */

export function HealthTable({
  records,
}: {
  records: {
    timestamp: string;
    component: string;
    status: string;
    message: string;
  }[];
}) {
  if (records.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-mocha">
        در ۲۴ ساعت گذشته رکورد سلامت‌ی ثبت نشده است.
      </p>
    );
  }

  // Newest first — the API returns oldest first for charting use cases.
  const newestFirst = [...records].reverse();

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-latte text-xs uppercase tracking-wide text-mocha">
            <th className="py-2 pe-4 text-start font-medium">سرویس</th>
            <th className="py-2 pe-4 text-start font-medium">وضعیت</th>
            <th className="py-2 pe-4 text-start font-medium">پیام</th>
            <th className="py-2 text-start font-medium">زمان</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-latte/60">
          {newestFirst.map((record, index) => {
            const style = fallbackHealthStyle(record.status);
            return (
              <tr key={`${record.component}-${record.timestamp}-${index}`}>
                <td className="py-2.5 pe-4 font-medium text-ink">{record.component}</td>
                <td className="py-2.5 pe-4">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold ${style.badge}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                    {style.label}
                  </span>
                </td>
                <td className="py-2.5 pe-4 text-clay">
                  {record.message || <span className="text-mocha">—</span>}
                </td>
                <td className="py-2.5 whitespace-nowrap tabular-nums text-mocha">
                  {formatTimestamp(record.timestamp)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */

/** Formats an ISO timestamp as a stable, locale-independent date/time. */
export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    ` ${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}
