/**
 * Typed client for the Django dashboard API.
 *
 * Two transports, one type surface:
 * - Server Components call Django directly. A relative URL cannot be resolved
 *   during server rendering, so the absolute Django origin is required here.
 * - The browser calls the same-origin `/dashboard/api/...` path, which
 *   Next.js rewrites to Django (see `next.config.ts`), avoiding CORS.
 */

const PROXY_PATH = "/dashboard/api";
const DJANGO_ORIGIN = process.env.DJANGO_API_ORIGIN ?? "http://127.0.0.1:8000";

/** Django's absolute URL on the server, same-origin proxy path in the browser. */
const API_BASE =
  typeof window === "undefined" ? `${DJANGO_ORIGIN}${PROXY_PATH}` : PROXY_PATH;

/* ─── Payload shapes (mirror dashboard/views.py) ─────────────────────────── */

export type HealthStatus = "healthy" | "warning" | "critical" | "down";

export interface AnalyticsOverview {
  recent_views: number;
  recent_events: number;
  active_widgets: number;
  system_health: HealthStatus;
  last_updated: string;
}

export interface PageStat {
  page: string;
  views: number;
}

export interface EventStat {
  event_type: string;
  count: number;
}

export interface DashboardWidgetInfo {
  id: number;
  name: string;
  widget_type: string;
  config: Record<string, unknown>;
}

export interface SystemHealthRecord {
  timestamp: string;
  component: string;
  status: HealthStatus;
  message: string;
}

export interface HealthCheck {
  status: string;
  timestamp: string;
  service: string;
}

/* ─── Fetch helper ──────────────────────────────────────────────────────── */

export class DashboardApiError extends Error {
  constructor(
    message: string,
    readonly endpoint: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "DashboardApiError";
  }
}

async function getJson<T>(endpoint: string): Promise<T> {
  // In the browser, `/dashboard/api/foo/` is normalised by Next.js to the
  // no-trailing-slash form before the rewrite runs, costing one redirect.
  // Asking for the exact canonical form that resolves in a single hop keeps
  // the 30s refresh loop cheap.
  const suffix =
    typeof window === "undefined" ? endpoint : endpoint.replace(/\/$/, "");

  const url = `${API_BASE}${suffix}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      // Dashboard numbers are live; never serve them from a cache.
      cache: "no-store",
    });
  } catch {
    throw new DashboardApiError(
      `Could not reach the dashboard API at ${url}. Is the Django server running?`,
      endpoint,
    );
  }

  if (!response.ok) {
    throw new DashboardApiError(
      `Dashboard API returned ${response.status} for ${url}`,
      endpoint,
      response.status,
    );
  }

  return (await response.json()) as T;
}

/* ─── Endpoints ─────────────────────────────────────────────────────────── */

export const getAnalyticsOverview = () =>
  getJson<AnalyticsOverview>("/analytics-overview/");

export const getPageStats = () => getJson<{ page_stats: PageStat[] }>("/page-stats/");

export const getEventStats = () => getJson<{ events: EventStat[] }>("/event-types/");

export const getWidgets = () => getJson<{ widgets: DashboardWidgetInfo[] }>("/widgets/");

export const getSystemHealth = () =>
  getJson<{ health_records: SystemHealthRecord[] }>("/system-health/");

export const getHealthCheck = () => getJson<HealthCheck>("/health-check/");

/**
 * Loads every dashboard dataset in parallel.
 * Individual failures are reported instead of failing the whole page, so a
 * single broken endpoint still leaves the rest of the dashboard usable.
 */
export async function loadDashboardData() {
  const [overview, pages, events, widgets, health] = await Promise.allSettled([
    getAnalyticsOverview(),
    getPageStats(),
    getEventStats(),
    getWidgets(),
    getSystemHealth(),
  ]);

  return {
    overview: overview.status === "fulfilled" ? overview.value : null,
    pageStats: pages.status === "fulfilled" ? pages.value.page_stats : null,
    eventStats: events.status === "fulfilled" ? events.value.events : null,
    widgets: widgets.status === "fulfilled" ? widgets.value.widgets : null,
    healthRecords: health.status === "fulfilled" ? health.value.health_records : null,
    errors: [
      overview.status === "rejected" ? "analytics overview" : null,
      pages.status === "rejected" ? "page stats" : null,
      events.status === "rejected" ? "event stats" : null,
      widgets.status === "rejected" ? "widgets" : null,
      health.status === "rejected" ? "system health" : null,
    ].filter((name): name is string => name !== null),
  };
}

export type DashboardData = Awaited<ReturnType<typeof loadDashboardData>>;
