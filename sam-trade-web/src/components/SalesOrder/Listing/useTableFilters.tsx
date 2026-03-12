
import { useState, useMemo } from "react";
import { parse, isWithinInterval, endOfDay, startOfDay } from "date-fns";

export interface SalesOrder {
  id:          string;
  internalId:  string;
  customer:    string;
  vendor:      string;
  amount:      string;
  status:      string;
  dateCreated: string;
}

export const mapSo = (so: any): SalesOrder => ({
  id:          so.DocumentNumber || so.doc_number   || so.internal_id || "",
  internalId:  so.InternalID     || so.internal_id  || "",
  customer:    so.Contract       || so.sub_customer || so.customer || "",
  vendor:      so.supplier       || so.Supplier     || so.vendor || "",
  amount:      so.SOAmount       || so.amount || "",
  status:      so.Status         || so.status || so.approval_status || "",
  dateCreated: so.DateCreated    || so.date_created || "",
});

// ─── Date helpers ─────────────────────────────────────────────

const parseFilterDate = (d: string) => parse(d, "dd-MM-yyyy", new Date());

// Matches "6/3/2026 10:45 am" or "12/1/2026 6:02 pm" — ambiguous for new Date()
// Chrome reads d/M as M/d (US format), so "6/3/2026" becomes June 3, not March 6.
// We NEVER use native Date() for these — go straight to date-fns with explicit format.
const AMBIGUOUS_SLASH_DATE = /^\d{1,2}\/\d{1,2}\/\d{4}/;

const tryParseDate = (raw: string): Date | null => {
  if (!raw) return null;
  const trimmed = raw.trim();

  //   Only use native parse for unambiguous ISO strings e.g. "2026-03-06T10:45:00"
  if (!AMBIGUOUS_SLASH_DATE.test(trimmed)) {
    const native = new Date(trimmed);
    if (!isNaN(native.getTime())) return native;
  }

  //   Full datetime — D/M/YYYY first (Indian API format)
  const fullFormats = [
    "d/M/yyyy h:mm a",    // 6/3/2026 10:45 am  ← primary API format
    "d/M/yyyy hh:mm a",
    "dd/MM/yyyy h:mm a",
    "dd/MM/yyyy hh:mm a",
    "d/M/yyyy H:mm",      // 24-hour
    "dd/MM/yyyy H:mm",
    "d-M-yyyy h:mm a",
    "dd-MM-yyyy h:mm a",
  ];

  for (const fmt of fullFormats) {
    const d = parse(trimmed, fmt, new Date());
    if (!isNaN(d.getTime())) return d;
  }

  //   Date-only fallback
  const datePart = trimmed.split(" ")[0];
  const dateOnlyFormats = [
    "d/M/yyyy", "dd/MM/yyyy",
    "dd-MM-yyyy", "d-M-yyyy",
    "yyyy-MM-dd", "yyyy/MM/dd",
  ];

  for (const fmt of dateOnlyFormats) {
    const d = parse(datePart, fmt, new Date());
    if (!isNaN(d.getTime())) return d;
  }

  return null;
};

// ─── Main hook ────────────────────────────────────────────────

export function useTableFilters(
  orders: SalesOrder[],
  pageSize = 10,
  fromDate = "",
  toDate = "",
) {
  const [searchQueryRaw,  setSearchQueryRaw]  = useState("");
  const [statusFilterRaw, setStatusFilterRaw] = useState<Set<string>>(new Set());
  const [sortConfig,      setSortConfig]      = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "dateCreated",
    direction: "desc",   // newest first by default
  });
  const [currentPage, setCurrentPage] = useState(1);

  const filteredOrders = useMemo(() => {
    let list = [...orders];

    // Search
    if (searchQueryRaw) {
      const q = searchQueryRaw.toLowerCase();
      list = list.filter((o) =>
        o.id.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q) ||
        o.vendor.toLowerCase().includes(q)
      );
    }

    // Status
    if (statusFilterRaw.size > 0) {
      list = list.filter((o) => statusFilterRaw.has(o.status));
    }

    // Date range
    if (fromDate && toDate) {
      const from = startOfDay(parseFilterDate(fromDate));
      const to   = endOfDay(parseFilterDate(toDate));
      list = list.filter((o) => {
        if (!o.dateCreated) return true;
        const d = tryParseDate(o.dateCreated);
        if (!d) return true;
        return isWithinInterval(d, { start: from, end: to });
      });
    }

    // Sort
    list.sort((a, b) => {
      const { key, direction } = sortConfig;
      const mul = direction === "asc" ? 1 : -1;

      if (key === "amount") {
        return ((parseFloat(a.amount) || 0) - (parseFloat(b.amount) || 0)) * mul;
      }

      if (key === "dateCreated") {
        const ad = tryParseDate(a.dateCreated);
        const bd = tryParseDate(b.dateCreated);
        if (!ad && !bd) return 0;
        if (!ad) return 1 * mul;
        if (!bd) return -1 * mul;
        return (ad.getTime() - bd.getTime()) * mul;
      }

      const av = (a[key as keyof SalesOrder] as string) ?? "";
      const bv = (b[key as keyof SalesOrder] as string) ?? "";
      return av.localeCompare(bv, undefined, { sensitivity: "base" }) * mul;
    });

    return list;
  }, [orders, searchQueryRaw, statusFilterRaw, sortConfig, fromDate, toDate]);

  const totalPages      = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const safePage        = Math.min(currentPage, totalPages);
  const paginatedOrders = filteredOrders.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleSort = (key: string) =>
    setSortConfig((prev) =>
      prev?.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "desc" }
    );

  const handleReset = () => {
    setSearchQueryRaw("");
    setStatusFilterRaw(new Set());
    setSortConfig({ key: "dateCreated", direction: "desc" });
    setCurrentPage(1);
  };

  const setSearchQuery  = (v: string)      => { setSearchQueryRaw(v);  setCurrentPage(1); };
  const setStatusFilter = (v: Set<string>) => { setStatusFilterRaw(v); setCurrentPage(1); };

  return {
    searchQuery: searchQueryRaw,
    setSearchQuery,
    statusFilter: statusFilterRaw,
    setStatusFilter,
    sortConfig,
    handleSort,
    handleReset,
    filteredOrders,
    paginatedOrders,
    currentPage,
    setCurrentPage,
    totalPages,
    totalCount: filteredOrders.length,
    pageSize,
  };
}