"use client";

/**
 * Keeps the dashboard numbers live without a full page reload: refreshes the
 * dashboard datasets on an interval and exposes the latest snapshot.
 */

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { loadDashboardData, type DashboardData } from "@/lib/api";

const DEFAULT_INTERVAL_MS = 30_000;

export function useLiveDashboard(
  initialData: DashboardData,
  intervalMs: number = DEFAULT_INTERVAL_MS,
) {
  const [data, setData] = useState<DashboardData>(initialData);
  const [isRefreshing, startRefresh] = useTransition();
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [lastSynced, setLastSynced] = useState<number>(() => Date.now());
  const isMounted = useRef(true);

  const refresh = useCallback(() => {
    startRefresh(async () => {
      try {
        const next = await loadDashboardData();
        if (!isMounted.current) return;

        setData(next);
        // Treat a refresh that lost every dataset as a failed sync.
        const lostEverything =
          next.overview === null &&
          next.pageStats === null &&
          next.eventStats === null &&
          next.healthRecords === null;

        setRefreshFailed(lostEverything);
        if (!lostEverything) setLastSynced(Date.now());
      } catch {
        if (isMounted.current) setRefreshFailed(true);
      }
    });
  }, []);

  useEffect(() => {
    isMounted.current = true;
    const timer = setInterval(refresh, intervalMs);

    return () => {
      isMounted.current = false;
      clearInterval(timer);
    };
  }, [refresh, intervalMs]);

  return { data, isRefreshing, refreshFailed, refresh, lastSynced };
}
