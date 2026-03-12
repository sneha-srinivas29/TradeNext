// import { useState, useEffect, useCallback, useMemo } from "react";
// import { useParams } from "react-router-dom";
// import DashboardLayout from "@/components/Common/DashboardLayout";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Card } from "@/components/ui/card";
// import {
//   Popover, PopoverContent, PopoverTrigger,
// } from "@/components/ui/popover";
// import { Calendar, ArrowUpDown, Filter, RefreshCw, Search, FileText } from "lucide-react";
// import {
//   Table, TableBody, TableCell,
//   TableHead, TableHeader, TableRow,
// } from "@/components/ui/table";
// import { parse, isValid, isWithinInterval, startOfDay, endOfDay } from "date-fns";
// import { cn } from "@/lib/utils";

// // ─── Types ────────────────────────────────────────────────────
// interface ItemFulfillment {
//   ifId:        string;
//   ifName:      string;
//   status:      string;
//   amount:      string;
//   contract:    string;
//   salesOrder:  string;
//   placedOn:    string;
// }

// // ─── Cache ────────────────────────────────────────────────────
// const IF_CACHE_PREFIX = "if_listing_cache_";
// const CACHE_TTL_MS    = 60 * 60 * 1000;

// interface IfCache { fulfillments: ItemFulfillment[]; fetchedAt: number; }

// const readIfCache = (id: string): IfCache | null => {
//   try {
//     const raw = sessionStorage.getItem(IF_CACHE_PREFIX + id);
//     if (!raw) return null;
//     const entry: IfCache = JSON.parse(raw);
//     if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
//       sessionStorage.removeItem(IF_CACHE_PREFIX + id);
//       return null;
//     }
//     return entry;
//   } catch { return null; }
// };

// const writeIfCache = (id: string, fulfillments: ItemFulfillment[]) => {
//   try {
//     sessionStorage.setItem(
//       IF_CACHE_PREFIX + id,
//       JSON.stringify({ fulfillments, fetchedAt: Date.now() })
//     );
//   } catch {}
// };

// const bustIfCache = (id: string) =>
//   sessionStorage.removeItem(IF_CACHE_PREFIX + id);

// // ─── Extract array — also detects error objects ────────────────
// const extractList = (raw: any): { list: any[]; apiError: string | null } => {
//   console.debug("[ItemFulfillments] raw response:", JSON.stringify(raw)?.slice(0, 500));

//   // ── Detect NetSuite / backend error payloads ────────────────
//   // Shape: { error: "...", message: "..." }  or  { errorCode: "...", errorMessage: "..." }
//   const isErrorObj =
//     raw &&
//     typeof raw === "object" &&
//     !Array.isArray(raw) &&
//     (raw.error || raw.errorCode || raw.errorMessage ||
//       (typeof raw.message === "string" && raw.message.toLowerCase().includes("error")));

//   if (isErrorObj) {
//     const msg =
//       raw.errorMessage || raw.error || raw.message || "Unknown API error";
//     console.warn("[ItemFulfillments] API returned error object:", msg);
//     return { list: [], apiError: String(msg) };
//   }

//   if (Array.isArray(raw)) return { list: raw, apiError: null };

//   const wrapperKeys = ["data", "fulfillments", "result", "results", "items", "records", "list"];
//   for (const key of wrapperKeys) {
//     if (Array.isArray(raw?.[key])) return { list: raw[key], apiError: null };
//   }

//   if (raw && typeof raw === "object" && (raw.DocumentNumber || raw.ID)) {
//     return { list: [raw], apiError: null };
//   }

//   if (raw && typeof raw === "object") {
//     for (const key of Object.keys(raw)) {
//       if (Array.isArray(raw[key])) {
//         console.debug(`[ItemFulfillments] found array under key: "${key}"`);
//         return { list: raw[key], apiError: null };
//       }
//     }
//   }

//   return { list: [], apiError: null };
// };

// // ─── Mapper ───────────────────────────────────────────────────
// const mapIf = (f: any): ItemFulfillment => ({
//   ifId:       String(f.ID             || f.id             || Math.random()),
//   ifName:     String(f.DocumentNumber || f.documentNumber || ""),
//   status:     String(f.Status         || f.status         || ""),
//   amount:     String(f.amount         || f.Amount         || "0"),
//   contract:   String(f.Contract       || f.contract       || ""),
//   salesOrder: String(f.salesorder     || f.SalesOrder     || f.salesOrder || ""),
//   placedOn:   String(f.tran_date      || f.tranDate       || f.placedOn   || ""),
// });

// // ─── Date helpers ─────────────────────────────────────────────
// const AMBIGUOUS_SLASH = /^\d{1,2}\/\d{1,2}\/\d{4}/;

// const tryParseDate = (raw: string): Date | null => {
//   if (!raw) return null;
//   const trimmed = raw.trim();
//   if (!AMBIGUOUS_SLASH.test(trimmed)) {
//     const native = new Date(trimmed);
//     if (!isNaN(native.getTime())) return native;
//   }
//   const formats = ["d/M/yyyy", "dd/MM/yyyy", "dd-MM-yyyy", "d-M-yyyy", "yyyy-MM-dd"];
//   for (const fmt of formats) {
//     const d = parse(trimmed.split(" ")[0], fmt, new Date());
//     if (!isNaN(d.getTime())) return d;
//   }
//   return null;
// };

// const parseFilterDate = (str: string) => parse(str, "dd-MM-yyyy", new Date());
// const isValidDate     = (str: string) => isValid(parse(str, "dd-MM-yyyy", new Date()));

// // ─── Status badge ─────────────────────────────────────────────
// const statusBadgeClass = (status: string) => {
//   const s = (status || "").toLowerCase();
//   if (s === "shipped")   return "bg-blue-50 text-blue-700 border-blue-200";
//   if (s === "delivered") return "bg-green-50 text-green-700 border-green-200";
//   if (s === "pending")   return "bg-amber-50 text-amber-600 border-amber-200";
//   if (s === "cancelled") return "bg-red-50 text-red-600 border-red-200";
//   return "bg-gray-50 text-gray-600 border-gray-200";
// };

// // ─── Skeleton ─────────────────────────────────────────────────
// const SkeletonRow = ({ opacity = 1 }: { opacity?: number }) => (
//   <div className="flex gap-4 px-4 py-[14px] border-t border-gray-200" style={{ opacity }}>
//     {[100, 110, 110, 110, 220, 200].map((w, i) => (
//       <div key={i} className="h-4 bg-gray-300 rounded animate-pulse shrink-0" style={{ width: w }} />
//     ))}
//   </div>
// );

// const TableSkeleton = () => (
//   <div className="mt-2 rounded-lg border border-gray-200 overflow-hidden">
//     <div className="flex gap-4 px-4 py-3 bg-[#2d5a27]">
//       {[100, 110, 110, 110, 220, 200].map((w, i) => (
//         <div key={i} className="h-4 bg-green-500/50 rounded animate-pulse" style={{ width: w }} />
//       ))}
//     </div>
//     {Array.from({ length: 6 }).map((_, i) => (
//       <SkeletonRow key={i} opacity={i < 4 ? 1 : 1 - (i - 3) * 0.35} />
//     ))}
//   </div>
// );

// const statusOptions = [
//   { label: "Shipped",   value: "Shipped"   },
//   { label: "Delivered", value: "Delivered" },
//   { label: "Pending",   value: "Pending"   },
//   { label: "Cancelled", value: "Cancelled" },
// ];

// const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// const COLUMNS = [
//   { label: "IF No",       key: "ifName"     },
//   { label: "Status",      key: "status"     },
//   { label: "Amount (₹)",  key: "amount"     },
//   { label: "Date",        key: "placedOn"   },
//   { label: "Contract",    key: "contract"   },
//   { label: "Sales Order", key: "salesOrder" },
// ];

// // ─── Component ────────────────────────────────────────────────
// const ItemFulfillments = () => {
//   const { soId, poId } = useParams<{ soId?: string; poId?: string }>();
//   const base = (import.meta as any).env.VITE_API_URL || "http://localhost:3001/api";

//   const [inputSoId,  setInputSoId]  = useState(soId || poId || "");
//   const [activeSoId, setActiveSoId] = useState("");

//   const [rawData,      setRawData]      = useState<ItemFulfillment[]>([]);
//   const [loading,      setLoading]      = useState(false);
//   const [isRefreshing, setIsRefreshing] = useState(false);
//   const [error,        setError]        = useState<string | null>(null);
//   const [hasFetched,   setHasFetched]   = useState(false);
//   const [lastUpdated,  setLastUpdated]  = useState<Date | null>(null);

//   const [searchQuery,  setSearchQuery]  = useState("");
//   const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
//   const [sortConfig,   setSortConfig]   = useState<{ key: string; direction: "asc" | "desc" }>({
//     key: "placedOn", direction: "desc",
//   });
//   const [pageSize,    setPageSize]    = useState(10);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [fromDate,    setFromDate]    = useState("");
//   const [toDate,      setToDate]      = useState("");
//   const [draftFrom,   setDraftFrom]   = useState("");
//   const [draftTo,     setDraftTo]     = useState("");
//   const [dateOpen,    setDateOpen]    = useState(false);

//   //   FIX 5: On mount, purge any stale empty-array cache entries left by old buggy code
//   // This is why the API was never being hit — sessionStorage had [] cached from the broken session
//   useCallback(() => {
//     try {
//       Object.keys(sessionStorage)
//         .filter(k => k.startsWith(IF_CACHE_PREFIX))
//         .forEach(k => {
//           const raw = sessionStorage.getItem(k);
//           if (!raw) return;
//           const entry = JSON.parse(raw) as IfCache;
//           if (!entry.fulfillments || entry.fulfillments.length === 0) {
//             sessionStorage.removeItem(k);
//           }
//         });
//     } catch {}
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [])();

//   // ── Fetch ─────────────────────────────────────────────────
//   const fetchFulfillments = useCallback(async (soId: string, force = false) => {
//     const id = soId.trim();
//     if (!id) return;

//     //   FIX 1: Set activeSoId immediately so empty/error states show the correct ID
//     setActiveSoId(id);

//     if (!force) {
//       const cached = readIfCache(id);
//       if (cached) {
//         setRawData(cached.fulfillments);
//         setLastUpdated(new Date(cached.fetchedAt));
//         setHasFetched(true);
//         setLoading(false);
//         return;
//       }
//     }

//     setLoading(true);
//     setError(null);

//     try {
//       const res = await fetch(
//         `${base}/proxy/trade/v1/if-listing?salesorderid=${encodeURIComponent(id)}`,
//         { credentials: "include" }
//       );

//       //   FIX 2: Parse body regardless of status, detect error shapes
//       const data = await res.json().catch(() => ({}));

//       if (!res.ok) {
//         const msg =
//           data?.message || data?.error || data?.errorMessage || `HTTP ${res.status}`;
//         throw new Error(String(msg));
//       }

//       const { list, apiError } = extractList(data);

//       //   FIX 3: If the body itself is an error object, surface it as an error
//       if (apiError) {
//         throw new Error(apiError);
//       }

//       const mapped = list.map(mapIf);
//       console.debug(`[ItemFulfillments] ${mapped.length} records for SO: ${id}`);

//       //   FIX 5: Never cache empty results — stale empty cache blocks future fetches
//       if (mapped.length > 0) {
//         writeIfCache(id, mapped);
//       }
//       setRawData(mapped);
//       setLastUpdated(new Date());
//     } catch (err: any) {
//       console.error("[ItemFulfillments] fetch error:", err);
//       setError(err?.message || "Failed to load item fulfillments. Please try again.");
//       setRawData([]);
//     } finally {
//       //   FIX 4: Always mark as fetched so UI shows correct state (error or empty)
//       setLoading(false);
//       setIsRefreshing(false);
//       setHasFetched(true);
//     }
//   }, [base]);

//   // ── Search submit ─────────────────────────────────────────
//   const handleSearch = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!inputSoId.trim()) return;
//     setSearchQuery(""); setStatusFilter(new Set());
//     setFromDate(""); setToDate(""); setCurrentPage(1);
//     fetchFulfillments(inputSoId.trim());
//   };

//   const handleRefresh = () => {
//     if (!activeSoId) return;
//     setIsRefreshing(true);
//     bustIfCache(activeSoId);
//     fetchFulfillments(activeSoId, true);
//   };

//   // ── Filter + Sort ─────────────────────────────────────────
//   const filteredData = useMemo(() => {
//     let list = [...rawData];

//     if (searchQuery) {
//       const q = searchQuery.toLowerCase();
//       list = list.filter((f) =>
//         f.ifName.toLowerCase().includes(q)    ||
//         f.contract.toLowerCase().includes(q)  ||
//         f.salesOrder.toLowerCase().includes(q)
//       );
//     }

//     if (statusFilter.size > 0) {
//       list = list.filter((f) => statusFilter.has(f.status));
//     }

//     if (fromDate && toDate && isValidDate(fromDate) && isValidDate(toDate)) {
//       const from = startOfDay(parseFilterDate(fromDate));
//       const to   = endOfDay(parseFilterDate(toDate));
//       list = list.filter((f) => {
//         const d = tryParseDate(f.placedOn);
//         if (!d) return true;
//         return isWithinInterval(d, { start: from, end: to });
//       });
//     }

//     list.sort((a, b) => {
//       const { key, direction } = sortConfig;
//       const mul = direction === "asc" ? 1 : -1;
//       if (key === "amount") {
//         return ((parseFloat(a.amount) || 0) - (parseFloat(b.amount) || 0)) * mul;
//       }
//       if (key === "placedOn") {
//         const ad = tryParseDate(a.placedOn);
//         const bd = tryParseDate(b.placedOn);
//         if (!ad && !bd) return 0;
//         if (!ad) return 1 * mul;
//         if (!bd) return -1 * mul;
//         return (ad.getTime() - bd.getTime()) * mul;
//       }
//       const av = (a[key as keyof ItemFulfillment] as string) ?? "";
//       const bv = (b[key as keyof ItemFulfillment] as string) ?? "";
//       return av.localeCompare(bv, undefined, { sensitivity: "base" }) * mul;
//     });

//     return list;
//   }, [rawData, searchQuery, statusFilter, sortConfig, fromDate, toDate]);

//   const totalAmount = useMemo(() =>
//     filteredData.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0),
//   [filteredData]);

//   const totalPages    = Math.max(1, Math.ceil(filteredData.length / pageSize));
//   const safePage      = Math.min(currentPage, totalPages);
//   const paginatedData = filteredData.slice((safePage - 1) * pageSize, safePage * pageSize);

//   const handleSort = (key: string) => {
//     setSortConfig((prev) =>
//       prev?.key === key
//         ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
//         : { key, direction: "desc" }
//     );
//     setCurrentPage(1);
//   };

//   const handleReset = () => {
//     setSearchQuery(""); setStatusFilter(new Set());
//     setSortConfig({ key: "placedOn", direction: "desc" });
//     setFromDate(""); setToDate(""); setCurrentPage(1);
//   };

//   const applyDate = () => {
//     setFromDate(draftFrom); setToDate(draftTo);
//     setDateOpen(false); setCurrentPage(1);
//   };
//   const clearDate = () => {
//     setDraftFrom(""); setDraftTo("");
//     setFromDate(""); setToDate(""); setDateOpen(false);
//   };

//   const isDateActive = !!(fromDate || toDate);
//   const showReset    = searchQuery.length > 0 || statusFilter.size > 0 || isDateActive;

//   return (
//     <DashboardLayout>
//       <div className="space-y-6">

//         {/* ── Page Header ───────────────────────────────────── */}
//         <div className="flex items-center justify-between flex-wrap gap-3">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900">Item Fulfillments</h1>
//             <p className="text-sm text-muted-foreground mt-0.5">
//               Enter a Sales Order ID to view its item fulfillments
//             </p>
//           </div>
//           {activeSoId && (
//             <Button variant="outline" size="sm"
//               onClick={handleRefresh} disabled={isRefreshing || loading}
//               className="flex items-center gap-2">
//               <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
//               Refresh
//             </Button>
//           )}
//         </div>

//         {/* ── Search Bar ────────────────────────────────────── */}
//         <Card>
//           <div className="p-4">
//             <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
//               <div className="flex flex-col gap-1 min-w-[220px] flex-1">
//                 <Label className="text-xs text-gray-600">Sales Order ID</Label>
//                 <Input
//                   type="text"
//                   value={inputSoId}
//                   onChange={(e) => setInputSoId(e.target.value)}
//                   placeholder="e.g. 3168954"
//                   className="h-9 text-sm"
//                 />
//               </div>
//               <Button type="submit" disabled={loading || !inputSoId.trim()}
//                 className="h-9 flex items-center gap-2">
//                 {loading
//                   ? <RefreshCw className="w-4 h-4 animate-spin" />
//                   : <Search className="w-4 h-4" />}
//                 Search
//               </Button>
//             </form>
//           </div>
//         </Card>

//         {/* ── Error ─────────────────────────────────────────── */}
//         {error && (
//           <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
//             <span>{error}</span>
//             <Button size="sm" variant="outline"
//               className="shrink-0 border-red-300 text-red-600 hover:bg-red-100"
//               onClick={() => fetchFulfillments(activeSoId, true)}>
//               Retry
//             </Button>
//           </div>
//         )}

//         {/* ── Empty prompt (before any search) ──────────────── */}
//         {!hasFetched && !loading && !error && (
//           <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
//             <FileText className="w-10 h-10 opacity-20" />
//             <p className="text-sm">Enter a Sales Order ID above and click Search</p>
//           </div>
//         )}

//         {/* ── Loading skeleton ──────────────────────────────── */}
//         {loading && <TableSkeleton />}

//         {/* ── Results ───────────────────────────────────────── */}
//         {!loading && hasFetched && !error && (
//           <>
//             {/* Filter toolbar */}
//             <div className="hidden sm:flex items-center gap-2 flex-wrap">
//               <Input
//                 placeholder="Search IF no, contract…"
//                 value={searchQuery}
//                 onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
//                 className="h-9 w-56 text-sm"
//               />

//               <Popover>
//                 <PopoverTrigger asChild>
//                   <Button variant="outline" size="sm"
//                     className={cn("h-9 gap-1.5", statusFilter.size > 0 && "border-primary text-primary")}>
//                     <Filter className="h-3.5 w-3.5" /> Status
//                     {statusFilter.size > 0 && (
//                       <span className="bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
//                         {statusFilter.size}
//                       </span>
//                     )}
//                   </Button>
//                 </PopoverTrigger>
//                 <PopoverContent className="w-48 p-2" align="start">
//                   {statusOptions.map((opt) => (
//                     <button key={opt.value}
//                       onClick={() => {
//                         const n = new Set(statusFilter);
//                         n.has(opt.value) ? n.delete(opt.value) : n.add(opt.value);
//                         setStatusFilter(n); setCurrentPage(1);
//                       }}
//                       className={cn(
//                         "w-full flex items-center px-3 py-2 rounded-lg text-sm text-left",
//                         statusFilter.has(opt.value)
//                           ? "bg-primary/10 text-primary font-medium"
//                           : "hover:bg-zinc-50 text-zinc-800"
//                       )}>
//                       {opt.label}
//                     </button>
//                   ))}
//                 </PopoverContent>
//               </Popover>

//               <Popover open={dateOpen} onOpenChange={(o) => {
//                 if (o) { setDraftFrom(fromDate); setDraftTo(toDate); }
//                 setDateOpen(o);
//               }}>
//                 <PopoverTrigger asChild>
//                   <Button variant="outline" size="sm"
//                     className={cn("h-9 gap-1.5", isDateActive && "border-primary text-primary")}>
//                     <Calendar className="h-3.5 w-3.5" />
//                     {isDateActive ? `${fromDate} → ${toDate}` : "Date range"}
//                   </Button>
//                 </PopoverTrigger>
//                 <PopoverContent className="w-72 p-4" align="start">
//                   <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">
//                     Date Range
//                   </p>
//                   <div className="space-y-3">
//                     <div className="space-y-1">
//                       <Label className="text-xs">From (dd-mm-yyyy)</Label>
//                       <Input placeholder="01-01-2025" value={draftFrom}
//                         onChange={(e) => setDraftFrom(e.target.value)}
//                         className={cn("h-9 text-sm", draftFrom && !isValidDate(draftFrom) && "border-red-400")} />
//                     </div>
//                     <div className="space-y-1">
//                       <Label className="text-xs">To (dd-mm-yyyy)</Label>
//                       <Input placeholder="31-12-2025" value={draftTo}
//                         onChange={(e) => setDraftTo(e.target.value)}
//                         className={cn("h-9 text-sm", draftTo && !isValidDate(draftTo) && "border-red-400")} />
//                     </div>
//                   </div>
//                   <div className="flex gap-2 mt-4">
//                     <Button variant="outline" size="sm" className="flex-1" onClick={clearDate}>Clear</Button>
//                     <Button size="sm" className="flex-1" onClick={applyDate}
//                       disabled={
//                         !!(draftFrom && !isValidDate(draftFrom)) ||
//                         !!(draftTo   && !isValidDate(draftTo))
//                       }>
//                       Apply
//                     </Button>
//                   </div>
//                 </PopoverContent>
//               </Popover>

//               {showReset && (
//                 <Button variant="ghost" size="sm"
//                   className="h-9 text-zinc-400 hover:text-red-400"
//                   onClick={handleReset}>
//                   Reset
//                 </Button>
//               )}

//               <div className="ml-auto flex items-center gap-2">
//                 {filteredData.length > 0 && (
//                   <>
//                     <span className="text-xs text-zinc-500 bg-zinc-100 px-2 py-1 rounded-md">
//                       {filteredData.length} records
//                     </span>
//                     <span className="text-xs text-zinc-500 bg-zinc-100 px-2 py-1 rounded-md">
//                       Total: ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
//                     </span>
//                   </>
//                 )}
//               </div>
//             </div>

//             {/* Empty state after search */}
//             {filteredData.length === 0 ? (
//               <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
//                 <FileText className="w-10 h-10 opacity-30" />
//                 <p className="text-sm">No item fulfillments found for SO: <strong>{activeSoId}</strong></p>
//               </div>
//             ) : (
//               <Card className="rounded-xl border-border/60 shadow-sm p-0 overflow-hidden">
//                 <div className="overflow-x-auto">
//                   <Table>
//                     <TableHeader>
//                       <TableRow className="bg-primary hover:bg-primary">
//                         {COLUMNS.map(({ label, key }) => (
//                           <TableHead key={key}
//                             className="font-semibold text-white whitespace-nowrap cursor-pointer"
//                             onClick={() => handleSort(key)}>
//                             <div className="flex items-center gap-1">
//                               {label}
//                               <ArrowUpDown className={cn("h-3.5 w-3.5",
//                                 sortConfig?.key === key ? "opacity-100" : "opacity-40")} />
//                             </div>
//                           </TableHead>
//                         ))}
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {paginatedData.map((f, idx) => (
//                         <TableRow key={f.ifId || idx} className="hover:bg-gray-50 transition-colors">
//                           <TableCell className="font-medium text-primary whitespace-nowrap">
//                             {f.ifName || f.ifId || "—"}
//                           </TableCell>
//                           <TableCell className="whitespace-nowrap">
//                             <Badge variant="secondary"
//                               className={cn("font-medium text-xs border", statusBadgeClass(f.status))}>
//                               {f.status || "—"}
//                             </Badge>
//                           </TableCell>
//                           <TableCell className="whitespace-nowrap font-medium">
//                             ₹{parseFloat(f.amount || "0").toLocaleString("en-IN", { minimumFractionDigits: 2 })}
//                           </TableCell>
//                           <TableCell className="whitespace-nowrap text-sm">{f.placedOn || "—"}</TableCell>
//                           <TableCell className="max-w-[240px] truncate text-sm" title={f.contract}>
//                             {f.contract || "—"}
//                           </TableCell>
//                           <TableCell className="max-w-[200px] truncate text-sm" title={f.salesOrder}>
//                             {f.salesOrder || "—"}
//                           </TableCell>
//                         </TableRow>
//                       ))}
//                     </TableBody>

//                     {/* Totals footer */}
//                     <tfoot>
//                       <tr className="bg-zinc-50 border-t-2 border-zinc-200">
//                         <td className="px-4 py-2 text-sm font-semibold text-zinc-600" colSpan={2}>
//                           Total ({filteredData.length} records)
//                         </td>
//                         <td className="px-4 py-2 text-sm font-bold text-zinc-800">
//                           ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
//                         </td>
//                         <td colSpan={3} className="px-4 py-2" />
//                       </tr>
//                     </tfoot>
//                   </Table>
//                 </div>

//                 {/* Pagination */}
//                 <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-white flex-wrap gap-2">
//                   <div className="flex items-center gap-2 text-sm text-zinc-500">
//                     <span>Rows per page:</span>
//                     <select value={pageSize}
//                       onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
//                       className="border border-zinc-200 rounded-md px-2 py-1 text-sm focus:outline-none">
//                       {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
//                     </select>
//                     <span className="text-zinc-400">
//                       {filteredData.length === 0 ? "0"
//                         : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filteredData.length)}`
//                       } of {filteredData.length}
//                     </span>
//                   </div>

//                   <div className="flex items-center gap-1">
//                     <Button variant="outline" size="sm" className="h-8 px-2"
//                       onClick={() => setCurrentPage(1)} disabled={safePage === 1}>«</Button>
//                     <Button variant="outline" size="sm" className="h-8 px-2"
//                       onClick={() => setCurrentPage(p => p - 1)} disabled={safePage === 1}>‹</Button>
//                     <span className="text-sm text-zinc-600 px-2">
//                       Page {safePage} of {totalPages}
//                     </span>
//                     <Button variant="outline" size="sm" className="h-8 px-2"
//                       onClick={() => setCurrentPage(p => p + 1)} disabled={safePage === totalPages}>›</Button>
//                     <Button variant="outline" size="sm" className="h-8 px-2"
//                       onClick={() => setCurrentPage(totalPages)} disabled={safePage === totalPages}>»</Button>
//                   </div>

//                   {lastUpdated && (
//                     <button onClick={handleRefresh} disabled={isRefreshing || loading}
//                       className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
//                       <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
//                       {lastUpdated.toLocaleTimeString()}
//                     </button>
//                   )}
//                 </div>
//               </Card>
//             )}
//           </>
//         )}
//       </div>
//     </DashboardLayout>
//   );
// };

// export default ItemFulfillments;


import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/Common/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar, ArrowUpDown, Filter, RefreshCw, Search, FileText, Plus } from "lucide-react";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { parse, isValid, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────
interface ItemFulfillment {
  ifId:        string;
  ifName:      string;
  status:      string;
  amount:      string;
  contract:    string;
  salesOrder:  string;
  placedOn:    string;
}

// ─── Cache ────────────────────────────────────────────────────
const IF_CACHE_PREFIX = "if_listing_cache_";
const CACHE_TTL_MS    = 60 * 60 * 1000;

interface IfCache { fulfillments: ItemFulfillment[]; fetchedAt: number; }

const readIfCache = (id: string): IfCache | null => {
  try {
    const raw = sessionStorage.getItem(IF_CACHE_PREFIX + id);
    if (!raw) return null;
    const entry: IfCache = JSON.parse(raw);
    if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
      sessionStorage.removeItem(IF_CACHE_PREFIX + id);
      return null;
    }
    return entry;
  } catch { return null; }
};

const writeIfCache = (id: string, fulfillments: ItemFulfillment[]) => {
  try {
    sessionStorage.setItem(
      IF_CACHE_PREFIX + id,
      JSON.stringify({ fulfillments, fetchedAt: Date.now() })
    );
  } catch {}
};

const bustIfCache = (id: string) =>
  sessionStorage.removeItem(IF_CACHE_PREFIX + id);

// ─── Extract array — also detects error objects ────────────────
const extractList = (raw: any): { list: any[]; apiError: string | null } => {
  console.debug("[ItemFulfillments] raw response:", JSON.stringify(raw)?.slice(0, 500));

  const isErrorObj =
    raw &&
    typeof raw === "object" &&
    !Array.isArray(raw) &&
    (raw.error || raw.errorCode || raw.errorMessage ||
      (typeof raw.message === "string" && raw.message.toLowerCase().includes("error")));

  if (isErrorObj) {
    const msg =
      raw.errorMessage || raw.error || raw.message || "Unknown API error";
    console.warn("[ItemFulfillments] API returned error object:", msg);
    return { list: [], apiError: String(msg) };
  }

  if (Array.isArray(raw)) return { list: raw, apiError: null };

  const wrapperKeys = ["data", "fulfillments", "result", "results", "items", "records", "list"];
  for (const key of wrapperKeys) {
    if (Array.isArray(raw?.[key])) return { list: raw[key], apiError: null };
  }

  if (raw && typeof raw === "object" && (raw.DocumentNumber || raw.ID)) {
    return { list: [raw], apiError: null };
  }

  if (raw && typeof raw === "object") {
    for (const key of Object.keys(raw)) {
      if (Array.isArray(raw[key])) {
        console.debug(`[ItemFulfillments] found array under key: "${key}"`);
        return { list: raw[key], apiError: null };
      }
    }
  }

  return { list: [], apiError: null };
};

// ─── Mapper ───────────────────────────────────────────────────
const mapIf = (f: any): ItemFulfillment => ({
  ifId:       String(f.ID             || f.id             || Math.random()),
  ifName:     String(f.DocumentNumber || f.documentNumber || ""),
  status:     String(f.Status         || f.status         || ""),
  amount:     String(f.amount         || f.Amount         || "0"),
  contract:   String(f.Contract       || f.contract       || ""),
  salesOrder: String(f.salesorder     || f.SalesOrder     || f.salesOrder || ""),
  placedOn:   String(f.tran_date      || f.tranDate       || f.placedOn   || ""),
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
  const s = (status || "").toLowerCase();
  if (s === "shipped")   return "bg-blue-50 text-blue-700 border-blue-200";
  if (s === "delivered") return "bg-green-50 text-green-700 border-green-200";
  if (s === "pending")   return "bg-amber-50 text-amber-600 border-amber-200";
  if (s === "cancelled") return "bg-red-50 text-red-600 border-red-200";
  return "bg-gray-50 text-gray-600 border-gray-200";
};

// ─── Skeleton ─────────────────────────────────────────────────
const SkeletonRow = ({ opacity = 1 }: { opacity?: number }) => (
  <div className="flex gap-4 px-4 py-[14px] border-t border-gray-200" style={{ opacity }}>
    {[100, 110, 110, 110, 220, 200].map((w, i) => (
      <div key={i} className="h-4 bg-gray-300 rounded animate-pulse shrink-0" style={{ width: w }} />
    ))}
  </div>
);

const TableSkeleton = () => (
  <div className="mt-2 rounded-lg border border-gray-200 overflow-hidden">
    <div className="flex gap-4 px-4 py-3 bg-[#2d5a27]">
      {[100, 110, 110, 110, 220, 200].map((w, i) => (
        <div key={i} className="h-4 bg-green-500/50 rounded animate-pulse" style={{ width: w }} />
      ))}
    </div>
    {Array.from({ length: 6 }).map((_, i) => (
      <SkeletonRow key={i} opacity={i < 4 ? 1 : 1 - (i - 3) * 0.35} />
    ))}
  </div>
);

const statusOptions = [
  { label: "Shipped",   value: "Shipped"   },
  { label: "Delivered", value: "Delivered" },
  { label: "Pending",   value: "Pending"   },
  { label: "Cancelled", value: "Cancelled" },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const COLUMNS = [
  { label: "IF No",       key: "ifName"     },
  { label: "Status",      key: "status"     },
  { label: "Amount (₹)",  key: "amount"     },
  { label: "Date",        key: "placedOn"   },
  { label: "Contract",    key: "contract"   },
  { label: "Sales Order", key: "salesOrder" },
];

// ─── Component ────────────────────────────────────────────────
const ItemFulfillments = () => {
  const { soId, poId } = useParams<{ soId?: string; poId?: string }>();
  const navigate = useNavigate();
  const base = (import.meta as any).env.VITE_API_URL || "http://localhost:3001/api";

  const [inputSoId,  setInputSoId]  = useState(soId || poId || "");
  const [activeSoId, setActiveSoId] = useState("");

  const [rawData,      setRawData]      = useState<ItemFulfillment[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [hasFetched,   setHasFetched]   = useState(false);
  const [lastUpdated,  setLastUpdated]  = useState<Date | null>(null);

  const [searchQuery,  setSearchQuery]  = useState("");
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [sortConfig,   setSortConfig]   = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "placedOn", direction: "desc",
  });
  const [pageSize,    setPageSize]    = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [fromDate,    setFromDate]    = useState("");
  const [toDate,      setToDate]      = useState("");
  const [draftFrom,   setDraftFrom]   = useState("");
  const [draftTo,     setDraftTo]     = useState("");
  const [dateOpen,    setDateOpen]    = useState(false);

  // Purge stale empty-array cache entries on mount
  useCallback(() => {
    try {
      Object.keys(sessionStorage)
        .filter(k => k.startsWith(IF_CACHE_PREFIX))
        .forEach(k => {
          const raw = sessionStorage.getItem(k);
          if (!raw) return;
          const entry = JSON.parse(raw) as IfCache;
          if (!entry.fulfillments || entry.fulfillments.length === 0) {
            sessionStorage.removeItem(k);
          }
        });
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])();

  // ── Fetch ─────────────────────────────────────────────────
  const fetchFulfillments = useCallback(async (soId: string, force = false) => {
    const id = soId.trim();
    if (!id) return;

    setActiveSoId(id);

    if (!force) {
      const cached = readIfCache(id);
      if (cached) {
        setRawData(cached.fulfillments);
        setLastUpdated(new Date(cached.fetchedAt));
        setHasFetched(true);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${base}/proxy/trade/v1/if-listing?salesorderid=${encodeURIComponent(id)}`,
        { credentials: "include" }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          data?.message || data?.error || data?.errorMessage || `HTTP ${res.status}`;
        throw new Error(String(msg));
      }

      const { list, apiError } = extractList(data);

      if (apiError) {
        throw new Error(apiError);
      }

      const mapped = list.map(mapIf);
      console.debug(`[ItemFulfillments] ${mapped.length} records for SO: ${id}`);

      if (mapped.length > 0) {
        writeIfCache(id, mapped);
      }
      setRawData(mapped);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error("[ItemFulfillments] fetch error:", err);
      setError(err?.message || "Failed to load item fulfillments. Please try again.");
      setRawData([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setHasFetched(true);
    }
  }, [base]);

  // ── Search submit ─────────────────────────────────────────
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputSoId.trim()) return;
    setSearchQuery(""); setStatusFilter(new Set());
    setFromDate(""); setToDate(""); setCurrentPage(1);
    fetchFulfillments(inputSoId.trim());
  };

  const handleRefresh = () => {
    if (!activeSoId) return;
    setIsRefreshing(true);
    bustIfCache(activeSoId);
    fetchFulfillments(activeSoId, true);
  };

  // ── Filter + Sort ─────────────────────────────────────────
  const filteredData = useMemo(() => {
    let list = [...rawData];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((f) =>
        f.ifName.toLowerCase().includes(q)    ||
        f.contract.toLowerCase().includes(q)  ||
        f.salesOrder.toLowerCase().includes(q)
      );
    }

    if (statusFilter.size > 0) {
      list = list.filter((f) => statusFilter.has(f.status));
    }

    if (fromDate && toDate && isValidDate(fromDate) && isValidDate(toDate)) {
      const from = startOfDay(parseFilterDate(fromDate));
      const to   = endOfDay(parseFilterDate(toDate));
      list = list.filter((f) => {
        const d = tryParseDate(f.placedOn);
        if (!d) return true;
        return isWithinInterval(d, { start: from, end: to });
      });
    }

    list.sort((a, b) => {
      const { key, direction } = sortConfig;
      const mul = direction === "asc" ? 1 : -1;
      if (key === "amount") {
        return ((parseFloat(a.amount) || 0) - (parseFloat(b.amount) || 0)) * mul;
      }
      if (key === "placedOn") {
        const ad = tryParseDate(a.placedOn);
        const bd = tryParseDate(b.placedOn);
        if (!ad && !bd) return 0;
        if (!ad) return 1 * mul;
        if (!bd) return -1 * mul;
        return (ad.getTime() - bd.getTime()) * mul;
      }
      const av = (a[key as keyof ItemFulfillment] as string) ?? "";
      const bv = (b[key as keyof ItemFulfillment] as string) ?? "";
      return av.localeCompare(bv, undefined, { sensitivity: "base" }) * mul;
    });

    return list;
  }, [rawData, searchQuery, statusFilter, sortConfig, fromDate, toDate]);

  const totalAmount = useMemo(() =>
    filteredData.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0),
  [filteredData]);

  const totalPages    = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const safePage      = Math.min(currentPage, totalPages);
  const paginatedData = filteredData.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleSort = (key: string) => {
    setSortConfig((prev) =>
      prev?.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "desc" }
    );
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearchQuery(""); setStatusFilter(new Set());
    setSortConfig({ key: "placedOn", direction: "desc" });
    setFromDate(""); setToDate(""); setCurrentPage(1);
  };

  const applyDate = () => {
    setFromDate(draftFrom); setToDate(draftTo);
    setDateOpen(false); setCurrentPage(1);
  };
  const clearDate = () => {
    setDraftFrom(""); setDraftTo("");
    setFromDate(""); setToDate(""); setDateOpen(false);
  };

  const isDateActive = !!(fromDate || toDate);
  const showReset    = searchQuery.length > 0 || statusFilter.size > 0 || isDateActive;

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ── Page Header ───────────────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Item Fulfillments</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Enter a Sales Order ID to view its item fulfillments
            </p>
          </div>
          <div className="flex items-center gap-2">
            {activeSoId && (
              <Button variant="outline" size="sm"
                onClick={handleRefresh} disabled={isRefreshing || loading}
                className="flex items-center gap-2">
                <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                Refresh
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => navigate("/item-fulfillments/create")}
              className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create
            </Button>
          </div>
        </div>

        {/* ── Search Bar ────────────────────────────────────── */}
        <Card>
          <div className="p-4">
            <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
              <div className="flex flex-col gap-1 min-w-[220px] flex-1">
                <Label className="text-xs text-gray-600">Sales Order ID</Label>
                <Input
                  type="text"
                  value={inputSoId}
                  onChange={(e) => setInputSoId(e.target.value)}
                  placeholder="e.g. 3168954"
                  className="h-9 text-sm"
                />
              </div>
              <Button type="submit" disabled={loading || !inputSoId.trim()}
                className="h-9 flex items-center gap-2">
                {loading
                  ? <RefreshCw className="w-4 h-4 animate-spin" />
                  : <Search className="w-4 h-4" />}
                Search
              </Button>
            </form>
          </div>
        </Card>

        {/* ── Error ─────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <span>{error}</span>
            <Button size="sm" variant="outline"
              className="shrink-0 border-red-300 text-red-600 hover:bg-red-100"
              onClick={() => fetchFulfillments(activeSoId, true)}>
              Retry
            </Button>
          </div>
        )}

        {/* ── Empty prompt (before any search) ──────────────── */}
        {!hasFetched && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <FileText className="w-10 h-10 opacity-20" />
            <p className="text-sm">Enter a Sales Order ID above and click Search</p>
          </div>
        )}

        {/* ── Loading skeleton ──────────────────────────────── */}
        {loading && <TableSkeleton />}

        {/* ── Results ───────────────────────────────────────── */}
        {!loading && hasFetched && !error && (
          <>
            {/* Filter toolbar */}
            <div className="hidden sm:flex items-center gap-2 flex-wrap">
              <Input
                placeholder="Search IF no, contract…"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="h-9 w-56 text-sm"
              />

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm"
                    className={cn("h-9 gap-1.5", statusFilter.size > 0 && "border-primary text-primary")}>
                    <Filter className="h-3.5 w-3.5" /> Status
                    {statusFilter.size > 0 && (
                      <span className="bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {statusFilter.size}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="start">
                  {statusOptions.map((opt) => (
                    <button key={opt.value}
                      onClick={() => {
                        const n = new Set(statusFilter);
                        n.has(opt.value) ? n.delete(opt.value) : n.add(opt.value);
                        setStatusFilter(n); setCurrentPage(1);
                      }}
                      className={cn(
                        "w-full flex items-center px-3 py-2 rounded-lg text-sm text-left",
                        statusFilter.has(opt.value)
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-zinc-50 text-zinc-800"
                      )}>
                      {opt.label}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>

              <Popover open={dateOpen} onOpenChange={(o) => {
                if (o) { setDraftFrom(fromDate); setDraftTo(toDate); }
                setDateOpen(o);
              }}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm"
                    className={cn("h-9 gap-1.5", isDateActive && "border-primary text-primary")}>
                    <Calendar className="h-3.5 w-3.5" />
                    {isDateActive ? `${fromDate} → ${toDate}` : "Date range"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-4" align="start">
                  <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">
                    Date Range
                  </p>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">From (dd-mm-yyyy)</Label>
                      <Input placeholder="01-01-2025" value={draftFrom}
                        onChange={(e) => setDraftFrom(e.target.value)}
                        className={cn("h-9 text-sm", draftFrom && !isValidDate(draftFrom) && "border-red-400")} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">To (dd-mm-yyyy)</Label>
                      <Input placeholder="31-12-2025" value={draftTo}
                        onChange={(e) => setDraftTo(e.target.value)}
                        className={cn("h-9 text-sm", draftTo && !isValidDate(draftTo) && "border-red-400")} />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1" onClick={clearDate}>Clear</Button>
                    <Button size="sm" className="flex-1" onClick={applyDate}
                      disabled={
                        !!(draftFrom && !isValidDate(draftFrom)) ||
                        !!(draftTo   && !isValidDate(draftTo))
                      }>
                      Apply
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {showReset && (
                <Button variant="ghost" size="sm"
                  className="h-9 text-zinc-400 hover:text-red-400"
                  onClick={handleReset}>
                  Reset
                </Button>
              )}

              <div className="ml-auto flex items-center gap-2">
                {filteredData.length > 0 && (
                  <>
                    <span className="text-xs text-zinc-500 bg-zinc-100 px-2 py-1 rounded-md">
                      {filteredData.length} records
                    </span>
                    <span className="text-xs text-zinc-500 bg-zinc-100 px-2 py-1 rounded-md">
                      Total: ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Empty state after search */}
            {filteredData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <FileText className="w-10 h-10 opacity-30" />
                <p className="text-sm">No item fulfillments found for SO: <strong>{activeSoId}</strong></p>
              </div>
            ) : (
              <Card className="rounded-xl border-border/60 shadow-sm p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-primary hover:bg-primary">
                        {COLUMNS.map(({ label, key }) => (
                          <TableHead key={key}
                            className="font-semibold text-white whitespace-nowrap cursor-pointer"
                            onClick={() => handleSort(key)}>
                            <div className="flex items-center gap-1">
                              {label}
                              <ArrowUpDown className={cn("h-3.5 w-3.5",
                                sortConfig?.key === key ? "opacity-100" : "opacity-40")} />
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.map((f, idx) => (
                        <TableRow key={f.ifId || idx} className="hover:bg-gray-50 transition-colors">
                          <TableCell className="font-medium text-primary whitespace-nowrap">
                            {f.ifName || f.ifId || "—"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge variant="secondary"
                              className={cn("font-medium text-xs border", statusBadgeClass(f.status))}>
                              {f.status || "—"}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap font-medium">
                            ₹{parseFloat(f.amount || "0").toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm">{f.placedOn || "—"}</TableCell>
                          <TableCell className="max-w-[240px] truncate text-sm" title={f.contract}>
                            {f.contract || "—"}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm" title={f.salesOrder}>
                            {f.salesOrder || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>

                    {/* Totals footer */}
                    <tfoot>
                      <tr className="bg-zinc-50 border-t-2 border-zinc-200">
                        <td className="px-4 py-2 text-sm font-semibold text-zinc-600" colSpan={2}>
                          Total ({filteredData.length} records)
                        </td>
                        <td className="px-4 py-2 text-sm font-bold text-zinc-800">
                          ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td colSpan={3} className="px-4 py-2" />
                      </tr>
                    </tfoot>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-white flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <span>Rows per page:</span>
                    <select value={pageSize}
                      onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                      className="border border-zinc-200 rounded-md px-2 py-1 text-sm focus:outline-none">
                      {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <span className="text-zinc-400">
                      {filteredData.length === 0 ? "0"
                        : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filteredData.length)}`
                      } of {filteredData.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" className="h-8 px-2"
                      onClick={() => setCurrentPage(1)} disabled={safePage === 1}>«</Button>
                    <Button variant="outline" size="sm" className="h-8 px-2"
                      onClick={() => setCurrentPage(p => p - 1)} disabled={safePage === 1}>‹</Button>
                    <span className="text-sm text-zinc-600 px-2">
                      Page {safePage} of {totalPages}
                    </span>
                    <Button variant="outline" size="sm" className="h-8 px-2"
                      onClick={() => setCurrentPage(p => p + 1)} disabled={safePage === totalPages}>›</Button>
                    <Button variant="outline" size="sm" className="h-8 px-2"
                      onClick={() => setCurrentPage(totalPages)} disabled={safePage === totalPages}>»</Button>
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
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ItemFulfillments;