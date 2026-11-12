"use client";

import type { DashboardData } from "@/lib/api";
import {
  BarList,
  HealthTable,
  StatCard,
  formatTimestamp,
  healthStyles,
} from "@/components/dashboard/DashboardCards";
import { useLiveDashboard } from "@/components/dashboard/use-live-dashboard";

const REFRESH_INTERVAL_MS = 30_000;

export function DashboardView({ initialData }: { initialData: DashboardData }) {
  const { data, isRefreshing, refreshFailed, refresh, lastSynced } =
    useLiveDashboard(initialData, REFRESH_INTERVAL_MS);

  const { overview, pageStats, eventStats, widgets, healthRecords, errors } = data;
  const healthStyle = overview ? healthStyles[overview.system_health] : healthStyles.down;

  return (
    <div className="space-y-8">
      {/* Status strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-latte bg-beige/60 px-4 py-3 text-sm">
        <div className="flex flex-wrap items-center gap-2 text-clay">
          <span className="relative flex h-2 w-2">
            <span
              className={`h-2 w-2 rounded-full ${refreshFailed ? "bg-red-500" : "bg-emerald-500"}`}
            />
          </span>
          <span>
            {refreshFailed
              ? "ارتباط با بک‌اند برقرار نشد"
              : `آخرین همگام‌سازی: ${formatTimestamp(new Date(lastSynced).toISOString())}`}
          </span>
          <span className="text-mocha">·</span>
          <span className="text-mocha">به‌روزرسانی خودکار هر ۳۰ ثانیه</span>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={isRefreshing}
          className="rounded-full border border-latte bg-foam px-4 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-beige-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRefreshing ? "در حال به‌روزرسانی…" : "به‌روزرسانی"}
        </button>
      </div>

      {/* Partial-failure notice */}
      {errors.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          بعضی بخش‌ها در دسترس نبودند: {errors.join("، ")}. دارایی Django و آدرس
          <code className="mx-1 rounded bg-amber-100 px-1">/dashboard/api</code>
          را بررسی کنید.
        </div>
      )}

      {/* Overview cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="بازدید صفحه (۲۴ ساعت)"
          value={overview ? overview.recent_views.toLocaleString("fa-IR") : "—"}
          hint="بر اساس مدل PageView"
        />
        <StatCard
          label="رویداد کاربر (۲۴ ساعت)"
          value={overview ? overview.recent_events.toLocaleString("fa-IR") : "—"}
          hint="بر اساس مدل UserEvent"
        />
        <StatCard
          label="ویجت فعال"
          value={overview ? overview.active_widgets.toLocaleString("fa-IR") : "—"}
          hint="ویجت‌های پیکربندی‌شده"
        />
        <StatCard
          label="وضعیت سیستم"
          value={overview ? healthStyle.label : "—"}
          accent={
            overview && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold ${healthStyle.badge}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${healthStyle.dot}`} />
                {overview.system_health}
              </span>
            )
          }
          hint={overview ? "بر پایه آخرین رکورد سلامت" : undefined}
        />
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-latte bg-foam p-5 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-ink">بازدید صفحات (۷ روز)</h2>
          <BarList
            data={(pageStats ?? []).map((p) => ({ label: p.page, value: p.views }))}
            emptyMessage="در ۷ روز گذشته بازدیدی ثبت نشده است."
          />
        </div>

        <div className="rounded-2xl border border-latte bg-foam p-5 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-ink">نوع رویدادها (۷ روز)</h2>
          <BarList
            data={(eventStats ?? []).map((e) => ({ label: e.event_type, value: e.count }))}
            emptyMessage="در ۷ روز گذشته رویدادی ثبت نشده است."
            barClassName=" bg-roast"
          />
        </div>
      </section>

      {/* Health */}
      <section className="rounded-2xl border border-latte bg-foam p-5 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-ink">سلامت سیستم (۲۴ ساعت)</h2>
        <HealthTable records={healthRecords ?? []} />
      </section>

      {/* Widgets */}
      <section className="rounded-2xl border border-latte bg-foam p-5 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-ink">ویجت‌های پیکربندی‌شده</h2>
        {widgets && widgets.length > 0 ? (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {widgets.map((widget) => (
              <li
                key={widget.id}
                className="rounded-xl border border-latte/80 bg-cream px-4 py-3"
              >
                <div className="text-sm font-semibold text-ink">{widget.name}</div>
                <div className="mt-1 text-xs text-mocha">{widget.widget_type}</div>
                <pre className="mt-2 overflow-x-auto rounded bg-beige/70 p-2 text-[0.65rem] leading-relaxed text-clay">
                  {JSON.stringify(widget.config, null, 2)}
                </pre>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-6 text-center text-sm text-mocha">ویجتی ثبت نشده است.</p>
        )}
      </section>
    </div>
  );
}
