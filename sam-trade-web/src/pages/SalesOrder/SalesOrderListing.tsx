

import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "@/components/Common/DashboardLayout";
import { Button } from "@/components/ui/button";
import { mapSo, useTableFilters } from "../../components/SalesOrder/Listing/useTableFilters";
import { DesktopToolbar } from "../../components/SalesOrder/Listing/DesktopToolbar";
import { MobileToolbar } from "../../components/SalesOrder/Listing/MobileToolbar";
import { SalesOrdersTable } from "../../components/SalesOrder/Listing/SalesOrdersTable";

//   Using shared cacheManager instead of local cache — fixes "orders is not iterable"
// Root cause: prefetchService writes { data: { orders: [...] }, fetchedAt }
// but old local readCache expected { orders: [...], fetchedAt }
// Now both read/write through the same cacheManager so format is always consistent.
import {
  readSoCache,
  writeSoCache,
} from "@/components/utils/cacheManager";

//   Export so other pages can bust the SO cache after creating an order
export const bustSoCache = () => {
  try { sessionStorage.removeItem("so_listing_cache"); } catch {}
};

// ── Wait for prefetch cache to be written (up to 12s) ────────────────────────
const waitForCache = (timeoutMs = 12_000): Promise<any[] | null> => {
  return new Promise((resolve) => {
    // Check immediately first
    const immediate = readSoCache();
    if (immediate) { resolve(immediate.orders); return; }

    const interval = 300;
    let elapsed    = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      const entry = readSoCache();
      if (entry) {
        clearInterval(timer);
        resolve(entry.orders);
        return;
      }
      if (elapsed >= timeoutMs) {
        clearInterval(timer);
        resolve(null);
      }
    }, interval);
  });
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonRow = ({ opacity = 1 }: { opacity?: number }) => (
  <div className="flex gap-4 px-4 py-[14px] border-t border-gray-200" style={{ opacity }}>
    {[112, 192, 160, 80, 128, 112, 24].map((w, i) => (
      <div key={i} className="h-4 bg-gray-300 rounded animate-pulse shrink-0" style={{ width: w }} />
    ))}
  </div>
);

const TableSkeleton = () => (
  <div className="mt-2 rounded-lg border border-gray-200 overflow-hidden">
    <div className="flex gap-4 px-4 py-3 bg-[#2d5a27]">
      {[112, 192, 160, 80, 128, 112, 24].map((w, i) => (
        <div key={i} className="h-4 bg-green-500/50 rounded animate-pulse" style={{ width: w }} />
      ))}
    </div>
    {Array.from({ length: 8 }).map((_, i) => (
      <SkeletonRow key={i} opacity={i < 5 ? 1 : 1 - (i - 4) * 0.28} />
    ))}
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────
const SalesOrders = () => {
  const location = useLocation();

  const [rawOrders,    setRawOrders]    = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [lastUpdated,  setLastUpdated]  = useState<Date | null>(null);
  const [pageSize,     setPageSize]     = useState(10);
  const [fromDate,     setFromDate]     = useState("");
  const [toDate,       setToDate]       = useState("");

  const fetchOrders = useCallback(async (force = false) => {
    if (!force) {
      //   Wait for cache — written by prefetchService after login/contract-select
      const cached = await waitForCache();
      if (cached && Array.isArray(cached) && cached.length > 0) {
        setRawOrders(cached);
        setLastUpdated(new Date());
        setLoading(false);
        return;
      }
    }

    const contractId = localStorage.getItem("selectedContract");
    if (!contractId) {
      setError("No contract selected.");
      setLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      const base = (import.meta as any).env.VITE_API_URL || "http://localhost:3001/api";
      const res  = await fetch(
        `${base}/proxy/trade/v1/so-listing?id=${encodeURIComponent(contractId)}`,
        { credentials: "include" }
      );
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const raw: any[] = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];

      const mapped = raw.map(mapSo);

      //   Write through cacheManager — same format prefetchService uses
      writeSoCache(mapped);

      setRawOrders(mapped);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      setError("Failed to load sales orders. Please try again.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (location.state?.refresh) {
      bustSoCache();
      fetchOrders(true);
      window.history.replaceState({}, "");
    } else {
      fetchOrders(false);
    }
  }, [fetchOrders, location.state?.refresh]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    bustSoCache();
    fetchOrders(true);
  };

  const {
    searchQuery, setSearchQuery,
    statusFilter, setStatusFilter,
    handleSort, handleReset: resetFilters,
    sortConfig, paginatedOrders,
    currentPage, setCurrentPage,
    totalPages, totalCount,
  } = useTableFilters(rawOrders, pageSize, fromDate, toDate);

  const showReset = searchQuery.length > 0 || statusFilter.size > 0;

  const handleReset = () => {
    resetFilters();
    setFromDate("");
    setToDate("");
  };

  if (loading) return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold tracking-tight mb-4">Sales Orders</h1>
      <TableSkeleton />
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500 font-medium">{error}</p>
        <Button variant="outline" onClick={() => { setError(null); setLoading(true); fetchOrders(true); }}>
          Retry
        </Button>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold tracking-tight mb-4">Sales Orders</h1>

      <DesktopToolbar
        searchQuery={searchQuery}   setSearchQuery={setSearchQuery}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
        onReset={handleReset}       showReset={showReset}
        fromDate={fromDate}         setFromDate={(v) => { setFromDate(v); setCurrentPage(1); }}
        toDate={toDate}             setToDate={(v)   => { setToDate(v);   setCurrentPage(1); }}
      />
      <MobileToolbar
        searchQuery={searchQuery}   setSearchQuery={setSearchQuery}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
        onReset={handleReset}       showReset={showReset}
        fromDate={fromDate}         setFromDate={setFromDate}
        toDate={toDate}             setToDate={setToDate}
      />

      <SalesOrdersTable
        orders={paginatedOrders}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(v) => { setPageSize(v); setCurrentPage(1); }}
        onSort={handleSort}
        sortConfig={sortConfig}
        lastUpdated={lastUpdated}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />
    </DashboardLayout>
  );
};

export default SalesOrders;