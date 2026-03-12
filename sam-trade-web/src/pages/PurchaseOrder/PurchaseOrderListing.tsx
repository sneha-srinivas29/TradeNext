import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "@/components/Common/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DataTableRowActions } from "../../components/Common/DataTableRowActions";
import { DataTableToolbar } from "@/components/Common/DataTableToolbar";
import {
  Calendar, Plus, ArrowUpDown, RefreshCw, Building2,
  Search, SlidersHorizontal, X, ChevronDown, Check,
} from "lucide-react";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { parse, isValid, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/Authcontext";
import { useState, useEffect, useCallback, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────
interface PurchaseOrder {
  contractPo: string;
  poId:       string;
  buyerName:  string;
  date:       string;
  status:     string;
  items:      string[];
}

interface Supplier {
  customerId:   string;
  customerName: string;
  supplierId:   string;
  supplierName: string;
}

// ─── Cache ────────────────────────────────────────────────────
const PO_CACHE_PREFIX    = "po_listing_cache_";
const CACHE_TTL_MS       = 60 * 60 * 1000;
const SUPPLIER_CACHE_KEY = "po_supplier_list_cache";

interface PoCache  { orders: PurchaseOrder[]; fetchedAt: number; }
interface SupCache { suppliers: Supplier[];   fetchedAt: number; }

const readPoCache = (supplierId: string): PoCache | null => {
  try {
    const raw = sessionStorage.getItem(PO_CACHE_PREFIX + supplierId);
    if (!raw) return null;
    const entry: PoCache = JSON.parse(raw);
    if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) { sessionStorage.removeItem(PO_CACHE_PREFIX + supplierId); return null; }
    return entry;
  } catch { return null; }
};
const writePoCache = (supplierId: string, orders: PurchaseOrder[]) => {
  try { sessionStorage.setItem(PO_CACHE_PREFIX + supplierId, JSON.stringify({ orders, fetchedAt: Date.now() })); } catch {}
};
const bustPoCache = (supplierId?: string) => {
  if (supplierId) { sessionStorage.removeItem(PO_CACHE_PREFIX + supplierId); return; }
  Object.keys(sessionStorage).filter(k => k.startsWith(PO_CACHE_PREFIX)).forEach(k => sessionStorage.removeItem(k));
};
const readSupplierCache = (): SupCache | null => {
  try {
    const raw = sessionStorage.getItem(SUPPLIER_CACHE_KEY);
    if (!raw) return null;
    const entry: SupCache = JSON.parse(raw);
    if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) { sessionStorage.removeItem(SUPPLIER_CACHE_KEY); return null; }
    return entry;
  } catch { return null; }
};
const writeSupplierCache = (suppliers: Supplier[]) => {
  try { sessionStorage.setItem(SUPPLIER_CACHE_KEY, JSON.stringify({ suppliers, fetchedAt: Date.now() })); } catch {}
};
export const bustAllPoCache = () => {
  bustPoCache();
  sessionStorage.removeItem(SUPPLIER_CACHE_KEY);
};

// ─── Mappers ──────────────────────────────────────────────────
const mapPo = (po: any): PurchaseOrder => ({
  contractPo: po.contract_PO  || po.contractPo || "",
  poId:       String(po.po_id || po.poId || ""),
  buyerName:  po.buyer_name   || po.buyerName  || "",
  date:       po.date         || "",
  status:     po.status       || "",
  items:      Array.isArray(po.item) ? po.item.map((i: any) => i.item || i) : [],
});
const mapSupplier = (s: any): Supplier => ({
  customerId:   String(s.customerid   || s.customerId   || ""),
  customerName: s.customername        || s.customerName || "",
  supplierId:   String(s.supplierid   || s.supplierId   || ""),
  supplierName: s.suppliername        || s.supplierName || "",
});

// ─── Date helpers ─────────────────────────────────────────────
const AMBIGUOUS_SLASH = /^\d{1,2}\/\d{1,2}\/\d{4}/;
const tryParseDate = (raw: string): Date | null => {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!AMBIGUOUS_SLASH.test(trimmed)) {
    const native = new Date(trimmed);
    if (!isNaN(native.getTime())) return native;
  }
  const formats = ["d/M/yyyy", "dd/MM/yyyy", "dd-MM-yyyy", "d-M-yyyy", "yyyy-MM-dd"];
  for (const fmt of formats) {
    const d = parse(trimmed.split(" ")[0], fmt, new Date());
    if (!isNaN(d.getTime())) return d;
  }
  return null;
};
const parseFilterDate = (str: string) => parse(str, "dd-MM-yyyy", new Date());
const isValidDate     = (str: string) => isValid(parse(str, "dd-MM-yyyy", new Date()));

// ─── Status badge ─────────────────────────────────────────────
const statusBadgeClass = (status: string) => {
  const s = status.toLowerCase();
  if (s.includes("fully") || s.includes("closed"))    return "bg-green-50 text-green-700 border-green-200";
  if (s.includes("partial") || s.includes("pending")) return "bg-amber-50 text-amber-600 border-amber-200";
  if (s.includes("reject"))                           return "bg-red-50 text-red-600 border-red-200";
  return "bg-gray-50 text-gray-600 border-gray-200";
};

// ─── Skeletons ────────────────────────────────────────────────
const SkeletonRow = ({ opacity = 1 }: { opacity?: number }) => (
  <div className="flex gap-4 px-4 py-[14px] border-t border-gray-200" style={{ opacity }}>
    {[112, 260, 140, 100, 160, 24].map((w, i) => (
      <div key={i} className="h-4 bg-gray-300 rounded animate-pulse shrink-0" style={{ width: w }} />
    ))}
  </div>
);
const TableSkeleton = () => (
  <div className="mt-2 rounded-lg border border-gray-200 overflow-hidden">
    <div className="flex gap-4 px-4 py-3 bg-[#2d5a27]">
      {[112, 260, 140, 100, 160, 24].map((w, i) => (
        <div key={i} className="h-4 bg-green-500/50 rounded animate-pulse" style={{ width: w }} />
      ))}
    </div>
    {Array.from({ length: 8 }).map((_, i) => (
      <SkeletonRow key={i} opacity={i < 5 ? 1 : 1 - (i - 4) * 0.28} />
    ))}
  </div>
);
const SupplierSkeleton = () => (
  <div className="h-9 w-56 bg-gray-200 rounded-lg animate-pulse" />
);

// ─── Status options ───────────────────────────────────────────
const statusOptions = [
  { label: "Fully Billed",                       value: "Fully Billed" },
  { label: "Partially Received",                 value: "Partially Received" },
  { label: "Pending Receipt",                    value: "Pending Receipt" },
  { label: "Pending Bill",                       value: "Pending Bill" },
  { label: "Pending Billing/Partially Received", value: "Pending Billing/Partially Received" },
  { label: "Pending Supervisor Approval",        value: "Pending Supervisor Approval" },
  { label: "Closed",                             value: "Closed" },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// ─── Component ────────────────────────────────────────────────
const PurchaseOrderListing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const base = (import.meta as any).env.VITE_API_URL || "http://localhost:3001/api";

  const [suppliers,          setSuppliers]          = useState<Supplier[]>([]);
  const [suppliersLoading,   setSuppliersLoading]   = useState(true);
  const [suppliersError,     setSuppliersError]     = useState<string | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");

  const [rawOrders,    setRawOrders]    = useState<PurchaseOrder[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [lastUpdated,  setLastUpdated]  = useState<Date | null>(null);

  const [pageSize,     setPageSize]     = useState(10);
  const [currentPage,  setCurrentPage]  = useState(1);
  const [fromDate,     setFromDate]     = useState("");
  const [toDate,       setToDate]       = useState("");
  const [draftFrom,    setDraftFrom]    = useState("");
  const [draftTo,      setDraftTo]      = useState("");
  const [dateOpen,     setDateOpen]     = useState(false);
  const [searchQuery,  setSearchQuery]  = useState("");
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [sortConfig,   setSortConfig]   = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "date", direction: "desc",
  });

  // ── Mobile date state ────────────────────────────────────
  const [mobileDateOpen, setMobileDateOpen] = useState(false);
  const [mobileDraftFrom, setMobileDraftFrom] = useState("");
  const [mobileDraftTo,   setMobileDraftTo]   = useState("");

  const fetchSuppliers = useCallback(async () => {
    const customerId = (user as any)?.netsuiteCustomerId;
    if (!customerId) {
      setSuppliersError("No customer account linked.");
      setSuppliersLoading(false);
      return;
    }
    const cached = readSupplierCache();
    if (cached) {
      setSuppliers(cached.suppliers);
      setSelectedSupplierId(cached.suppliers[0]?.supplierId ?? "");
      setSuppliersLoading(false);
      return;
    }
    try {
      const res = await fetch(
        `${base}/proxy/trade/v1/supplier-details-vendor-master?customerid=${encodeURIComponent(customerId)}`,
        { credentials: "include" }
      );
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.message || `HTTP ${res.status}`); }
      const data = await res.json();
      const raw: any[] = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      const mapped = raw.map(mapSupplier);
      writeSupplierCache(mapped);
      setSuppliers(mapped);
      setSelectedSupplierId(mapped[0]?.supplierId ?? "");
    } catch { setSuppliersError("Failed to load suppliers. Please try again."); }
    finally { setSuppliersLoading(false); }
  }, [base, user]);

  const fetchOrders = useCallback(async (supplierId: string, force = false) => {
    if (!supplierId) return;
    if (!force) {
      const cached = readPoCache(supplierId);
      if (cached) { setRawOrders(cached.orders); setLastUpdated(new Date(cached.fetchedAt)); setLoading(false); return; }
    }
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${base}/proxy/trade/v1/po-listing?id=${encodeURIComponent(supplierId)}`, { credentials: "include" });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.message || `HTTP ${res.status}`); }
      const data = await res.json();
      const raw: any[] = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      const mapped = raw.map(mapPo);
      writePoCache(supplierId, mapped);
      setRawOrders(mapped);
      setLastUpdated(new Date());
    } catch { setError("Failed to load purchase orders. Please try again."); }
    finally { setLoading(false); setIsRefreshing(false); }
  }, [base]);

  useEffect(() => {
    if (location.state?.refresh) { bustAllPoCache(); window.history.replaceState({}, ""); }
    fetchSuppliers();
  }, [fetchSuppliers, location.state?.refresh]);

  useEffect(() => {
    if (selectedSupplierId) { setRawOrders([]); setCurrentPage(1); fetchOrders(selectedSupplierId); }
  }, [selectedSupplierId, fetchOrders]);

  const handleRefresh = () => { setIsRefreshing(true); bustPoCache(selectedSupplierId); fetchOrders(selectedSupplierId, true); };
  const handleSupplierChange = (supplierId: string) => {
    setSelectedSupplierId(supplierId);
    setSearchQuery(""); setStatusFilter(new Set()); setFromDate(""); setToDate(""); setCurrentPage(1);
  };

  const filteredOrders = useMemo(() => {
    let list = [...rawOrders];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((o) =>
        o.contractPo.toLowerCase().includes(q) || o.buyerName.toLowerCase().includes(q) || o.items.join(" ").toLowerCase().includes(q)
      );
    }
    if (statusFilter.size > 0) list = list.filter((o) => statusFilter.has(o.status));
    if (fromDate && toDate && isValidDate(fromDate) && isValidDate(toDate)) {
      const from = startOfDay(parseFilterDate(fromDate));
      const to   = endOfDay(parseFilterDate(toDate));
      list = list.filter((o) => {
        if (!o.date) return true;
        const d = tryParseDate(o.date);
        if (!d) return true;
        return isWithinInterval(d, { start: from, end: to });
      });
    }
    list.sort((a, b) => {
      const { key, direction } = sortConfig;
      const mul = direction === "asc" ? 1 : -1;
      if (key === "date") {
        const ad = tryParseDate(a.date); const bd = tryParseDate(b.date);
        if (!ad && !bd) return 0; if (!ad) return 1 * mul; if (!bd) return -1 * mul;
        return (ad.getTime() - bd.getTime()) * mul;
      }
      const av = (a[key as keyof PurchaseOrder] as string) ?? "";
      const bv = (b[key as keyof PurchaseOrder] as string) ?? "";
      return av.localeCompare(bv, undefined, { sensitivity: "base" }) * mul;
    });
    return list;
  }, [rawOrders, searchQuery, statusFilter, sortConfig, fromDate, toDate]);

  const totalPages      = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const safePage        = Math.min(currentPage, totalPages);
  const paginatedOrders = filteredOrders.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleSort = (key: string) => {
    setSortConfig((prev) => prev?.key === key ? { key, direction: prev.direction === "asc" ? "desc" : "asc" } : { key, direction: "desc" });
    setCurrentPage(1);
  };
  const handleReset = () => {
    setSearchQuery(""); setStatusFilter(new Set()); setSortConfig({ key: "date", direction: "desc" });
    setFromDate(""); setToDate(""); setCurrentPage(1);
  };

  // Desktop date handlers
  const applyDate   = () => { setFromDate(draftFrom); setToDate(draftTo); setDateOpen(false); setCurrentPage(1); };
  const clearDate   = () => { setDraftFrom(""); setDraftTo(""); setFromDate(""); setToDate(""); setDateOpen(false); };
  const isDateActive = !!(fromDate || toDate);
  const showReset    = searchQuery.length > 0 || statusFilter.size > 0 || isDateActive;

  // Mobile date handlers
  const openMobileDate = (open: boolean) => {
    if (open) { setMobileDraftFrom(fromDate); setMobileDraftTo(toDate); }
    setMobileDateOpen(open);
  };
  const applyMobileDate = () => { setFromDate(mobileDraftFrom); setToDate(mobileDraftTo); setMobileDateOpen(false); setCurrentPage(1); };
  const resetMobileDate = () => { setMobileDraftFrom(""); setMobileDraftTo(""); setFromDate(""); setToDate(""); setMobileDateOpen(false); };

  const selectedSupplierName = suppliers.find(s => s.supplierId === selectedSupplierId)?.supplierName ?? "Select supplier";

  const SupplierSelector = ({ mobile = false }: { mobile?: boolean }) => {
    if (suppliersLoading) return <SupplierSkeleton />;
    if (suppliersError || suppliers.length === 0) return null;
    if (suppliers.length === 1) return (
      <div className={cn("flex items-center gap-2 px-3 h-9 rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-700 font-medium", mobile && "rounded-xl w-full")}>
        <Building2 className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
        <span className="truncate">{suppliers[0].supplierName}</span>
      </div>
    );
    return (
      <Select value={selectedSupplierId} onValueChange={handleSupplierChange}>
        <SelectTrigger className={cn("h-9 border-zinc-200 bg-white text-sm font-medium", mobile ? "rounded-xl w-full" : "rounded-lg w-64")}>
          <div className="flex items-center gap-2 min-w-0 overflow-hidden">
            <Building2 className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span className="truncate">{selectedSupplierName}</span>
          </div>
        </SelectTrigger>
        <SelectContent className="max-w-xs">
          {suppliers.map((s) => (
            <SelectItem key={s.supplierId} value={s.supplierId} className="py-2">
              <div className="flex flex-col">
                <span className="font-medium text-sm leading-snug">{s.supplierName}</span>
                <span className="text-[11px] text-zinc-400 leading-snug">ID: {s.supplierId}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  if (suppliersError) return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold tracking-tight mb-4">Purchase Orders</h1>
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500 font-medium">{suppliersError}</p>
        <Button variant="outline" onClick={() => { setSuppliersError(null); setSuppliersLoading(true); fetchSuppliers(); }}>Retry</Button>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold tracking-tight mb-4">Purchase Orders</h1>

      {/* ── DESKTOP TOOLBAR ───────────────────────────────── */}
      <div className="hidden sm:flex items-center gap-2 flex-wrap mb-4">
        <SupplierSelector />
        <div className="flex-1 min-w-0">
          <DataTableToolbar
            filterValue={searchQuery}
            onFilterChange={(v) => { setSearchQuery(v); setCurrentPage(1); }}
            filterPlaceholder="Filter orders..."
            filters={[{ id: "status", title: "Status", options: statusOptions, selectedValues: statusFilter, onSelectionChange: (v) => { setStatusFilter(v); setCurrentPage(1); } }]}
            onReset={handleReset}
            showReset={showReset}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Popover open={dateOpen} onOpenChange={(o) => { if (o) { setDraftFrom(fromDate); setDraftTo(toDate); } setDateOpen(o); }}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("h-9 gap-1.5", isDateActive && "border-primary text-primary")}>
                <Calendar className="h-3.5 w-3.5" />
                {isDateActive ? `${fromDate} → ${toDate}` : "Date range"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4" align="end">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">Date Range</p>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">From (dd-mm-yyyy)</Label>
                  <Input placeholder="01-01-2024" value={draftFrom} onChange={(e) => setDraftFrom(e.target.value)} className={cn("h-9 text-sm", draftFrom && !isValidDate(draftFrom) && "border-red-400")} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">To (dd-mm-yyyy)</Label>
                  <Input placeholder="31-12-2024" value={draftTo} onChange={(e) => setDraftTo(e.target.value)} className={cn("h-9 text-sm", draftTo && !isValidDate(draftTo) && "border-red-400")} />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1" onClick={clearDate}>Clear</Button>
                <Button size="sm" className="flex-1" onClick={applyDate} disabled={!!(draftFrom && !isValidDate(draftFrom)) || !!(draftTo && !isValidDate(draftTo))}>Apply</Button>
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm" className="h-9 px-2.5" onClick={handleRefresh} disabled={isRefreshing || loading || !selectedSupplierId} title="Refresh">
            <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
          </Button>
          <Button size="sm" className="h-9 shadow-sm" onClick={() => navigate("/purchase-orders/create")}>
            <Plus className="h-4 w-4 mr-1" /> Create
          </Button>
        </div>
      </div>

      {/* ── MOBILE TOOLBAR ────────────────────────────────── */}
      <div className="sm:hidden space-y-2.5 mb-5">

        {/* Row 1 — Supplier selector */}
        <SupplierSelector mobile />

        {/* Row 2 — Search + Create */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[15px] w-[15px] text-zinc-400 pointer-events-none" />
            <Input
              placeholder="Search by PO, buyer, item…"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="h-10 pl-9 pr-9 text-[13px] rounded-xl border-zinc-200 bg-zinc-50 focus:bg-white text-zinc-900 placeholder:text-zinc-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button onClick={() => navigate("/purchase-orders/create")}
            className="h-10 px-4 rounded-xl text-[13px] font-semibold bg-primary text-white hover:bg-primary/90 shadow-sm shrink-0">
            <Plus className="h-4 w-4 mr-1" /> Create
          </Button>
        </div>

        {/* Row 3 — Status filter + Date range */}
        <div className="flex gap-2">

          {/* Status */}
          <Popover>
            <PopoverTrigger asChild>
              <button className={cn(
                "flex items-center gap-1.5 h-9 px-3 rounded-xl border text-[13px] font-medium transition-colors shrink-0",
                statusFilter.size > 0 ? "bg-primary text-white border-primary" : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300"
              )}>
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filter
                {statusFilter.size > 0 && (
                  <span className="bg-white/25 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                    {statusFilter.size}
                  </span>
                )}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0 rounded-xl border-zinc-200 shadow-lg" align="start" sideOffset={6}>
              <div className="p-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 px-2 py-1.5">Status</p>
                {statusOptions.map((opt) => {
                  const active = statusFilter.has(opt.value);
                  return (
                    <button key={opt.value}
                      onClick={() => { const n = new Set(statusFilter); active ? n.delete(opt.value) : n.add(opt.value); setStatusFilter(n); setCurrentPage(1); }}
                      className={cn("w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors text-left",
                        active ? "bg-primary/10 text-primary" : "hover:bg-zinc-50 text-zinc-800")}>
                      {opt.label}
                      {active && <Check className="h-3.5 w-3.5 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>

          {/* Date range */}
          <Popover open={mobileDateOpen} onOpenChange={openMobileDate}>
            <PopoverTrigger asChild>
              <button className={cn(
                "flex items-center gap-1.5 h-9 px-3 rounded-xl border text-[13px] font-medium transition-colors shrink-0",
                isDateActive ? "bg-primary text-white border-primary" : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300"
              )}>
                <Calendar className="h-3.5 w-3.5" />
                {isDateActive ? "Date filtered" : "Date"}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[min(calc(100vw-2rem),320px)] p-0 rounded-2xl border-zinc-200 shadow-2xl" align="start" sideOffset={6}>
              <div className="px-4 pt-3.5 pb-3 border-b border-zinc-100">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">Date Range</p>
                <p className="text-sm text-zinc-600">
                  {mobileDraftFrom || mobileDraftTo ? `${mobileDraftFrom || "Any"} → ${mobileDraftTo || "Any"}` : "No date filter applied"}
                </p>
              </div>
              <div className="p-4 space-y-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">From</Label>
                  <Input type="text" placeholder="dd-mm-yyyy" value={mobileDraftFrom} onChange={(e) => setMobileDraftFrom(e.target.value)} className="h-9 text-sm rounded-lg" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">To</Label>
                  <Input type="text" placeholder="dd-mm-yyyy" value={mobileDraftTo} onChange={(e) => setMobileDraftTo(e.target.value)} className="h-9 text-sm rounded-lg" />
                </div>
              </div>
              <div className="flex gap-2 px-4 pb-4">
                <button onClick={resetMobileDate} className="flex-1 h-9 rounded-lg border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors">Clear</button>
                <button onClick={applyMobileDate} className="flex-1 h-9 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">Apply</button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Active filter chips */}
        {(showReset) && (
          <div className="flex flex-wrap gap-1.5 items-center">
            {searchQuery && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200 px-2.5 py-1 rounded-full">
                "{searchQuery}"
                <button onClick={() => setSearchQuery("")}><X className="h-2.5 w-2.5" /></button>
              </span>
            )}
            {Array.from(statusFilter).map((s) => (
              <span key={s} className="inline-flex items-center gap-1 text-[11px] font-medium bg-primary/10 text-primary border border-primary/15 px-2.5 py-1 rounded-full">
                {s}
                <button onClick={() => { const n = new Set(statusFilter); n.delete(s); setStatusFilter(n); }}>
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
            {isDateActive && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-primary/10 text-primary border border-primary/15 px-2.5 py-1 rounded-full">
                {fromDate || "Any"} → {toDate || "Any"}
                <button onClick={resetMobileDate}><X className="h-2.5 w-2.5" /></button>
              </span>
            )}
            <button onClick={handleReset} className="ml-auto text-[11px] text-zinc-400 hover:text-red-400 transition-colors">
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── TABLE ─────────────────────────────────────────── */}
      {loading && !isRefreshing ? (
        <TableSkeleton />
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-red-500 font-medium">{error}</p>
          <Button variant="outline" onClick={() => fetchOrders(selectedSupplierId, true)}>Retry</Button>
        </div>
      ) : (
        <Card className="rounded-xl border-border/60 shadow-sm p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary hover:bg-primary">
                  {[
                    { label: "PO No",  key: "contractPo" },
                    { label: "Buyer",  key: "buyerName"  },
                    { label: "Items",  key: null         },
                    { label: "Date",   key: "date"       },
                    { label: "Status", key: "status"     },
                    { label: "Action", key: null         },
                  ].map(({ label, key }) => (
                    <TableHead key={label}
                      className={cn("font-semibold text-white whitespace-nowrap", key && "cursor-pointer")}
                      onClick={() => key && handleSort(key)}
                    >
                      <div className="flex items-center gap-1">
                        {label}
                        {key && <ArrowUpDown className={cn("h-3.5 w-3.5", sortConfig?.key === key ? "opacity-100" : "opacity-40")} />}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-zinc-400">
                      {suppliersLoading ? "Loading suppliers…" : "No purchase orders found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedOrders.map((order) => (
                    <TableRow key={order.poId} className="hover:bg-gray-50 transition-colors">
                      <TableCell
                        className="font-medium text-primary underline underline-offset-2 cursor-pointer whitespace-nowrap"
                        onClick={() => navigate(`/purchase-orders/view/${order.poId}`)}
                      >
                        {order.contractPo}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate text-sm" title={order.buyerName}>
                        {order.buyerName}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-zinc-600">
                        {order.items.join(", ") || "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{order.date}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="secondary" className={cn("font-medium text-xs border", statusBadgeClass(order.status))}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <DataTableRowActions
                          onView={() => navigate(`/purchase-orders/view/${order.poId}`)}
                          onEdit={() => console.log("Edit", order.poId)}
                          onCopy={() => navigator.clipboard.writeText(order.contractPo)}
                          onDelete={() => console.log("Delete", order.poId)}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* ── Pagination footer ──────────────────────────── */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-white flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <span>Rows per page:</span>
              <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="border border-zinc-200 rounded-md px-2 py-1 text-sm text-zinc-700 focus:outline-none focus:ring-1 focus:ring-primary/30">
                {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="text-zinc-400">
                {filteredOrders.length === 0 ? "0" : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filteredOrders.length)}`} of {filteredOrders.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => setCurrentPage(1)}          disabled={safePage === 1}>«</Button>
              <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => setCurrentPage(p => p - 1)} disabled={safePage === 1}>‹</Button>
              <span className="text-sm text-zinc-600 px-2">Page {safePage} of {totalPages}</span>
              <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => setCurrentPage(p => p + 1)} disabled={safePage === totalPages}>›</Button>
              <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => setCurrentPage(totalPages)} disabled={safePage === totalPages}>»</Button>
            </div>
            {lastUpdated && (
              <button onClick={handleRefresh} disabled={isRefreshing || loading}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
                <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
                {lastUpdated.toLocaleTimeString()}
              </button>
            )}
          </div>
        </Card>
      )}
    </DashboardLayout>
  );
};

export default PurchaseOrderListing;