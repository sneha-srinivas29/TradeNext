import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "@/components/Common/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, RefreshCw, Package } from "lucide-react";
import { parse, isValid, format, subMonths } from "date-fns";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────
interface GrnRecord {
  id: string; invoice: string; customer: string;
  vendor: string; quantity: string; date: string; amount: string;
}

// ─── Cache ────────────────────────────────────────────────────
const GRN_CACHE_PREFIX = "grn_listing_v2_";
const CACHE_TTL_MS = 60 * 60 * 1000;
interface GrnCache { records: GrnRecord[]; fetchedAt: number; }
const makeGrnKey = (id: string) => `${GRN_CACHE_PREFIX}${id}`;
const readGrnCache = (key: string): GrnCache | null => {
  try {
    const raw = sessionStorage.getItem(key); if (!raw) return null;
    const entry = JSON.parse(raw);
    if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) { sessionStorage.removeItem(key); return null; }
    const records = Array.isArray(entry.records) ? entry.records : Array.isArray(entry.data) ? entry.data : null;
    return records ? { records, fetchedAt: entry.fetchedAt } : null;
  } catch { return null; }
};
const writeGrnCache = (key: string, records: GrnRecord[]) => {
  try { if (records.length > 0) sessionStorage.setItem(key, JSON.stringify({ records, fetchedAt: Date.now() })); } catch {}
};

// ─── Date helpers ─────────────────────────────────────────────
const AMBIGUOUS_SLASH = /^\d{1,2}\/\d{1,2}\/\d{4}/;
const tryParseDate = (raw: string): Date | null => {
  if (!raw?.trim()) return null;
  const t = raw.trim();
  if (!AMBIGUOUS_SLASH.test(t)) { const n = new Date(t); if (!isNaN(n.getTime())) return n; }
  const fmts = ["d/M/yyyy","dd/MM/yyyy","M/d/yyyy","MM/dd/yyyy","dd-MM-yyyy","d-M-yyyy","yyyy-MM-dd","dd MMM yyyy","d MMM yyyy","MMM dd, yyyy","dd/MM/yy"];
  for (const f of fmts) { const d = parse(t.split(" ")[0], f, new Date()); if (isValid(d)) return d; }
  const fb = new Date(t); return isNaN(fb.getTime()) ? null : fb;
};
const normaliseDate = (raw: string): string => { if (!raw?.trim()) return ""; const d = tryParseDate(raw); return d ? format(d, "dd/MM/yyyy") : raw.trim(); };

// ─── Mapper ───────────────────────────────────────────────────
const mapGrn = (g: any, idx: number): GrnRecord => {
  const rawDate = g.Date||g.date||g.trandate||g.TranDate||g.tran_date||g.TransDate||g.transDate||g.transaction_date||g.createdDate||g.invoiceDate||g.GRNDate||g.grn_date||"";
  return {
    id:       `${String(g.Invoice||g.invoice||"row")}_${idx}`,
    invoice:  String(g.Invoice||g.invoice||""),
    customer: String(g.Customer||g.customer||""),
    vendor:   String(g.Vendor||g.vendor||""),
    quantity: String(g.Quantity||g.quantity||"0"),
    date:     normaliseDate(String(rawDate)),
    amount:   String(g.Amount||g.amount||"0"),
  };
};

// ─── Formatters ───────────────────────────────────────────────
const fmtAmount = (raw: string) => { const n = parseFloat(raw||"0"); return isNaN(n)||n===0 ? "—" : `₹${n.toLocaleString("en-IN",{minimumFractionDigits:2})}`; };
const fmtQty    = (raw: string) => { const n = parseFloat(raw||"0"); return isNaN(n)||n===0 ? "—" : n.toLocaleString("en-IN"); };

// ─── Date converters ──────────────────────────────────────────
// filter state = DD-MM-YYYY   |   HTML input = YYYY-MM-DD
const toHtml   = (f: string) => { const [d,m,y] = f.split("-"); return d&&m&&y ? `${y}-${m}-${d}` : ""; };
const fromHtml = (h: string) => { const [y,m,d] = h.split("-"); return y&&m&&d ? `${d}-${m}-${y}` : ""; };

// ─── Skeletons ────────────────────────────────────────────────
const TableSkeleton = () => (
  <div className="rounded-lg border border-gray-200 overflow-hidden">
    <div className="flex gap-4 px-4 py-3 bg-[#2d5a27]">
      {[160,200,180,90,110,120].map((w,i) => <div key={i} className="h-4 bg-green-500/50 rounded animate-pulse" style={{width:w}} />)}
    </div>
    {Array.from({length:7}).map((_,i) => (
      <div key={i} className="flex gap-4 px-4 py-[14px] border-t border-gray-200" style={{opacity: i<5?1:1-(i-4)*0.4}}>
        {[160,200,180,90,110,120].map((w,j) => <div key={j} className="h-4 bg-gray-300 rounded animate-pulse shrink-0" style={{width:w}} />)}
      </div>
    ))}
  </div>
);
const CardSkeleton = () => (
  <div className="space-y-3">
    {Array.from({length:5}).map((_,i) => (
      <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3 shadow-sm" style={{opacity:i<3?1:1-(i-2)*0.45}}>
        <div className="flex justify-between"><div className="h-4 w-32 bg-gray-300 rounded animate-pulse"/><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"/></div>
        <div className="h-3 w-48 bg-gray-200 rounded animate-pulse"/>
        <div className="flex justify-between pt-1 border-t border-gray-100"><div className="h-3 w-16 bg-gray-200 rounded animate-pulse"/><div className="h-4 w-24 bg-gray-300 rounded animate-pulse"/></div>
      </div>
    ))}
  </div>
);

// ─── Mobile GRN Card ──────────────────────────────────────────
const GrnCard = ({ g }: { g: GrnRecord }) => (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
    {/* Invoice + Amount */}
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="text-[13px] font-bold text-primary leading-tight">{g.invoice || "—"}</p>
        {g.date && <p className="text-xs text-zinc-400 mt-0.5">📅 {g.date}</p>}
      </div>
      <span className="text-sm font-bold text-zinc-800 whitespace-nowrap">{fmtAmount(g.amount)}</span>
    </div>

    {/* Customer + Vendor */}
    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
      <div>
        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Customer</p>
        <p className="text-xs text-zinc-700 font-medium truncate" title={g.customer}>{g.customer || "—"}</p>
      </div>
      <div>
        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Vendor</p>
        <p className="text-xs text-zinc-700 font-medium truncate" title={g.vendor}>{g.vendor || "—"}</p>
      </div>
    </div>

    {/* Qty footer */}
    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
        <Package className="w-3.5 h-3.5" />
        <span>Quantity</span>
      </div>
      <span className="text-sm font-semibold text-zinc-800">{fmtQty(g.quantity)}</span>
    </div>
  </div>
);

// ─── Compact date input (desktop) ─────────────────────────────
const CompactDateInput = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[11px] font-medium text-zinc-500 leading-none px-0.5">{label}</span>
    <input type="date" value={toHtml(value)} onChange={(e) => onChange(fromHtml(e.target.value))}
      className="h-9 w-[148px] px-3 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary cursor-pointer"
    />
  </div>
);

// ─── Constants ────────────────────────────────────────────────
const PAGE_SIZE_OPTIONS = [10,25,50,100];
const COLUMNS = [
  {label:"Invoice",  key:"invoice"},  {label:"Customer", key:"customer"},
  {label:"Vendor",   key:"vendor"},   {label:"Qty",      key:"quantity"},
  {label:"Date",     key:"date"},     {label:"Amount",   key:"amount"},
];

// ─── Component ────────────────────────────────────────────────
const GrnListing = () => {
  const { poNo } = useParams<{ poNo?: string }>();
  const base = (import.meta as any).env.VITE_API_URL || "http://localhost:3001/api";
  const contractId = localStorage.getItem("selectedContract") || "";
  const className  = (localStorage.getItem("selectedContractClass") || "BTST").split(":")[0].trim();

  const today = new Date();
  const defaultFrom = format(subMonths(today, 12), "dd-MM-yyyy");
  const defaultTo   = format(today, "dd-MM-yyyy");

  const [rawData,      setRawData]      = useState<GrnRecord[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [lastUpdated,  setLastUpdated]  = useState<Date | null>(null);
  const [fromDate,     setFromDate]     = useState(defaultFrom);
  const [toDate,       setToDate]       = useState(defaultTo);
  const [searchQuery,  setSearchQuery]  = useState("");
  const [sortConfig,   setSortConfig]   = useState<{key:string;direction:"asc"|"desc"}>({key:"date",direction:"desc"});
  const [pageSize,     setPageSize]     = useState(10);
  const [currentPage,  setCurrentPage]  = useState(1);

  const fetchGrns = useCallback(async (force = false) => {
    if (!contractId) { setError("No contract selected."); setLoading(false); return; }
    const cacheKey = makeGrnKey(contractId);
    if (!force) {
      const cached = readGrnCache(cacheKey);
      if (cached) { setRawData(cached.records); setLastUpdated(new Date(cached.fetchedAt)); setLoading(false); return; }
    }
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({contractID:contractId, class:className});
      const res = await fetch(`${base}/proxy/trade/v1/grn-listing?${params}`,{credentials:"include"});
      if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e?.message||`HTTP ${res.status}`); }
      const data = await res.json();
      const raw: any[] = Array.isArray(data)?data:Array.isArray(data?.data)?data.data:[];
      if (raw.length>0) console.debug("[GrnListing] sample:",JSON.stringify(raw[0]));
      const mapped = raw.map((g,idx)=>mapGrn(g,idx));
      writeGrnCache(cacheKey, mapped); setRawData(mapped); setLastUpdated(new Date());
    } catch(err:any) { setError("Failed to load GRN records. Please try again."); console.error(err); }
    finally { setLoading(false); setIsRefreshing(false); }
  }, [base, contractId, className]);

  useEffect(()=>{ fetchGrns(); },[fetchGrns]);

  const handleRefresh = () => { setIsRefreshing(true); sessionStorage.removeItem(makeGrnKey(contractId)); fetchGrns(true); };

  const filteredData = useMemo(()=>{
    let list = [...rawData];
    if (searchQuery) { const q=searchQuery.toLowerCase(); list=list.filter(g=>g.invoice.toLowerCase().includes(q)||g.customer.toLowerCase().includes(q)||g.vendor.toLowerCase().includes(q)); }
    if (fromDate&&toDate) {
      const from=parse(fromDate,"dd-MM-yyyy",new Date()), to=parse(toDate,"dd-MM-yyyy",new Date());
      if (isValid(from)&&isValid(to)) list=list.filter(g=>{ const d=tryParseDate(g.date); return !d||( d>=from&&d<=to); });
    }
    list.sort((a,b)=>{
      const {key,direction}=sortConfig; const mul=direction==="asc"?1:-1;
      if (key==="amount"||key==="quantity") return ((parseFloat(a[key as keyof GrnRecord]||"0")||0)-(parseFloat(b[key as keyof GrnRecord]||"0")||0))*mul;
      if (key==="date") { const ad=tryParseDate(a.date),bd=tryParseDate(b.date); if(!ad&&!bd)return 0; if(!ad)return mul; if(!bd)return -mul; return (ad.getTime()-bd.getTime())*mul; }
      return ((a[key as keyof GrnRecord]??"") as string).localeCompare((b[key as keyof GrnRecord]??"") as string,undefined,{sensitivity:"base"})*mul;
    });
    return list;
  },[rawData,searchQuery,sortConfig,fromDate,toDate]);

  const totalAmount = useMemo(()=>filteredData.reduce((s,g)=>s+(parseFloat(g.amount)||0),0),[filteredData]);
  const totalQty    = useMemo(()=>filteredData.reduce((s,g)=>s+(parseFloat(g.quantity)||0),0),[filteredData]);
  const totalPages    = Math.max(1,Math.ceil(filteredData.length/pageSize));
  const safePage      = Math.min(currentPage,totalPages);
  const paginatedData = filteredData.slice((safePage-1)*pageSize, safePage*pageSize);
  const handleSort    = (key:string) => { setSortConfig(p=>p.key===key?{key,direction:p.direction==="asc"?"desc":"asc"}:{key,direction:"desc"}); setCurrentPage(1); };
  const isFiltered    = !!(searchQuery||fromDate!==defaultFrom||toDate!==defaultTo);

  const statsBar = filteredData.length > 0 && (
    <>
      <span className="text-xs text-zinc-500 bg-zinc-100 px-2 py-1 rounded-md">{filteredData.length} records</span>
      <span className="text-xs text-zinc-500 bg-zinc-100 px-2 py-1 rounded-md">Qty: {totalQty.toLocaleString("en-IN")}</span>
      <span className="text-xs text-zinc-500 bg-zinc-100 px-2 py-1 rounded-md">₹{totalAmount.toLocaleString("en-IN",{minimumFractionDigits:2})}</span>
    </>
  );

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold tracking-tight mb-4">
        GRN Listing
        {poNo&&poNo!==":poNo"&&<span className="text-base font-normal text-zinc-400 ml-2">(PO: {poNo})</span>}
      </h1>

      {/* ── DESKTOP TOOLBAR ──────────────────────────────── */}
      <div className="hidden sm:flex items-end gap-3 flex-wrap mb-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-medium text-zinc-500 leading-none px-0.5">Search</span>
          <Input placeholder="Invoice, customer, vendor…" value={searchQuery}
            onChange={(e)=>{setSearchQuery(e.target.value);setCurrentPage(1);}} className="h-9 w-52 text-sm"/>
        </div>
        <CompactDateInput label="From Date" value={fromDate} onChange={(v)=>{setFromDate(v);setCurrentPage(1);}}/>
        <CompactDateInput label="To Date"   value={toDate}   onChange={(v)=>{setToDate(v);setCurrentPage(1);}}/>
        {isFiltered && (
          <button onClick={()=>{setSearchQuery("");setFromDate(defaultFrom);setToDate(defaultTo);setCurrentPage(1);}}
            className="self-end h-9 px-3 text-xs font-medium text-zinc-400 hover:text-red-400 transition-colors">Reset</button>
        )}
        <div className="ml-auto flex items-center gap-2 self-end">
          {statsBar}
          <Button variant="outline" size="sm" className="h-9 px-2.5" onClick={handleRefresh} disabled={isRefreshing||loading}>
            <RefreshCw className={cn("h-3.5 w-3.5",isRefreshing&&"animate-spin")}/>
          </Button>
        </div>
      </div>

      {/* ── MOBILE TOOLBAR ───────────────────────────────── */}
      <div className="sm:hidden space-y-2 mb-4">
        <Input placeholder="Search invoice, customer, vendor…" value={searchQuery}
          onChange={(e)=>{setSearchQuery(e.target.value);setCurrentPage(1);}} className="h-10 rounded-xl text-sm w-full"/>
        <div className="flex gap-2">
          <div className="flex-1">
            <p className="text-[11px] font-medium text-zinc-500 mb-0.5 px-0.5">From</p>
            <input type="date" value={toHtml(fromDate)} onChange={(e)=>{setFromDate(fromHtml(e.target.value));setCurrentPage(1);}}
              className="w-full h-9 px-3 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/25"/>
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-medium text-zinc-500 mb-0.5 px-0.5">To</p>
            <input type="date" value={toHtml(toDate)} onChange={(e)=>{setToDate(fromHtml(e.target.value));setCurrentPage(1);}}
              className="w-full h-9 px-3 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/25"/>
          </div>
          <div className="self-end">
            <Button variant="outline" size="sm" className="h-9 px-2.5" onClick={handleRefresh} disabled={isRefreshing||loading}>
              <RefreshCw className={cn("h-3.5 w-3.5",isRefreshing&&"animate-spin")}/>
            </Button>
          </div>
        </div>
        {filteredData.length>0 && <div className="flex items-center gap-2 flex-wrap pt-0.5">{statsBar}</div>}
      </div>

      {/* ── ERROR ────────────────────────────────────────── */}
      {error && (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-red-500 font-medium">{error}</p>
          <Button variant="outline" onClick={()=>fetchGrns(true)}>Retry</Button>
        </div>
      )}

      {!error && (
        <>
          {/* ── DESKTOP TABLE ────────────────────────────── */}
          <div className="hidden sm:block">
            {loading&&!isRefreshing ? <TableSkeleton /> : (
              <Card className="rounded-xl border-border/60 shadow-sm p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-primary hover:bg-primary">
                        {COLUMNS.map(({label,key})=>(
                          <TableHead key={key} className="font-semibold text-white whitespace-nowrap cursor-pointer" onClick={()=>handleSort(key)}>
                            <div className="flex items-center gap-1">{label}
                              <ArrowUpDown className={cn("h-3.5 w-3.5",sortConfig.key===key?"opacity-100":"opacity-40")}/>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.length===0 ? (
                        <TableRow><TableCell colSpan={COLUMNS.length} className="h-32 text-center text-zinc-400">No GRN records found.</TableCell></TableRow>
                      ) : paginatedData.map(g=>(
                        <TableRow key={g.id} className="hover:bg-gray-50 transition-colors">
                          <TableCell className="font-medium text-primary whitespace-nowrap text-sm">{g.invoice||"—"}</TableCell>
                          <TableCell className="max-w-[220px] truncate text-sm" title={g.customer}>{g.customer||"—"}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm" title={g.vendor}>{g.vendor||"—"}</TableCell>
                          <TableCell className="whitespace-nowrap text-sm font-medium">{fmtQty(g.quantity)}</TableCell>
                          <TableCell className="whitespace-nowrap text-sm">{g.date||"—"}</TableCell>
                          <TableCell className="whitespace-nowrap text-sm font-medium">{fmtAmount(g.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    {filteredData.length>0&&(
                      <tfoot>
                        <tr className="bg-zinc-50 border-t-2 border-zinc-200">
                          <td className="px-4 py-2 text-sm font-semibold text-zinc-600" colSpan={3}>Total ({filteredData.length} records)</td>
                          <td className="px-4 py-2 text-sm font-bold text-zinc-800">{totalQty.toLocaleString("en-IN")}</td>
                          <td className="px-4 py-2"/>
                          <td className="px-4 py-2 text-sm font-bold text-zinc-800">₹{totalAmount.toLocaleString("en-IN",{minimumFractionDigits:2})}</td>
                        </tr>
                      </tfoot>
                    )}
                  </Table>
                </div>
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-white flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <span>Rows per page:</span>
                    <select value={pageSize} onChange={(e)=>{setPageSize(Number(e.target.value));setCurrentPage(1);}}
                      className="border border-zinc-200 rounded-md px-2 py-1 text-sm focus:outline-none">
                      {PAGE_SIZE_OPTIONS.map(n=><option key={n} value={n}>{n}</option>)}
                    </select>
                    <span className="text-zinc-400">
                      {filteredData.length===0?"0":`${(safePage-1)*pageSize+1}–${Math.min(safePage*pageSize,filteredData.length)}`} of {filteredData.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" className="h-8 px-2" onClick={()=>setCurrentPage(1)} disabled={safePage===1}>«</Button>
                    <Button variant="outline" size="sm" className="h-8 px-2" onClick={()=>setCurrentPage(p=>p-1)} disabled={safePage===1}>‹</Button>
                    <span className="text-sm text-zinc-600 px-2">Page {safePage} of {totalPages}</span>
                    <Button variant="outline" size="sm" className="h-8 px-2" onClick={()=>setCurrentPage(p=>p+1)} disabled={safePage===totalPages}>›</Button>
                    <Button variant="outline" size="sm" className="h-8 px-2" onClick={()=>setCurrentPage(totalPages)} disabled={safePage===totalPages}>»</Button>
                  </div>
                  {lastUpdated&&(
                    <button onClick={handleRefresh} disabled={isRefreshing||loading}
                      className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
                      <RefreshCw className={cn("h-3 w-3",isRefreshing&&"animate-spin")}/>{lastUpdated.toLocaleTimeString()}
                    </button>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* ── MOBILE CARDS ─────────────────────────────── */}
          <div className="sm:hidden">
            {loading&&!isRefreshing ? <CardSkeleton /> : paginatedData.length===0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <Package className="w-10 h-10 opacity-20"/>
                <p className="text-sm">No GRN records found.</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {paginatedData.map(g=><GrnCard key={g.id} g={g}/>)}
                </div>
                {/* Mobile pagination */}
                <div className="mt-4 flex items-center justify-between gap-2">
                  <span className="text-xs text-zinc-400">
                    {(safePage-1)*pageSize+1}–{Math.min(safePage*pageSize,filteredData.length)} of {filteredData.length}
                  </span>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="h-8 px-3" onClick={()=>setCurrentPage(p=>p-1)} disabled={safePage===1}>‹ Prev</Button>
                    <Button variant="outline" size="sm" className="h-8 px-3" onClick={()=>setCurrentPage(p=>p+1)} disabled={safePage===totalPages}>Next ›</Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default GrnListing;


// import { useState, useEffect, useCallback, useMemo } from "react";
// import { useParams } from "react-router-dom";
// import DashboardLayout from "@/components/Common/DashboardLayout";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Card } from "@/components/ui/card";
// import {
//   Table, TableBody, TableCell,
//   TableHead, TableHeader, TableRow,
// } from "@/components/ui/table";
// import { ArrowUpDown, RefreshCw, Package } from "lucide-react";
// import { parse, isValid, format, subMonths } from "date-fns";
// import { cn } from "@/lib/utils";

// // ─── Types ────────────────────────────────────────────────────
// interface GrnRecord {
//   // TODO: define GrnRecord fields
// }

// // ─── Cache ────────────────────────────────────────────────────
// const GRN_CACHE_PREFIX = ""; // TODO: define cache prefix
// const CACHE_TTL_MS = 0; // TODO: define cache TTL
// interface GrnCache { /* TODO: define cache shape */ }
// const makeGrnKey = (id: string): string => { /* TODO: build cache key */ return ""; };
// const readGrnCache = (key: string): GrnCache | null => { /* TODO: read and validate cache from sessionStorage */ return null; };
// const writeGrnCache = (key: string, records: GrnRecord[]) => { /* TODO: write records to sessionStorage cache */ };

// // ─── Date helpers ─────────────────────────────────────────────
// const AMBIGUOUS_SLASH = /$/; // TODO: define ambiguous slash regex
// const tryParseDate = (raw: string): Date | null => { /* TODO: attempt multiple date format parses */ return null; };
// const normaliseDate = (raw: string): string => { /* TODO: normalise raw date string to dd/MM/yyyy */ return ""; };

// // ─── Mapper ───────────────────────────────────────────────────
// const mapGrn = (g: any, idx: number): GrnRecord => {
//   // TODO: map raw API response fields to GrnRecord shape
//   return {} as GrnRecord;
// };

// // ─── Formatters ───────────────────────────────────────────────
// const fmtAmount = (raw: string): string => { /* TODO: format number as INR currency string */ return ""; };
// const fmtQty    = (raw: string): string => { /* TODO: format number as locale quantity string */ return ""; };

// // ─── Date converters ──────────────────────────────────────────
// const toHtml   = (f: string): string => { /* TODO: convert DD-MM-YYYY to YYYY-MM-DD for HTML input */ return ""; };
// const fromHtml = (h: string): string => { /* TODO: convert YYYY-MM-DD from HTML input to DD-MM-YYYY */ return ""; };

// // ─── Skeletons ────────────────────────────────────────────────
// const TableSkeleton = () => (
//   // TODO: render animated table skeleton rows for loading state
//   <></>
// );

// const CardSkeleton = () => (
//   // TODO: render animated card skeletons for mobile loading state
//   <></>
// );

// // ─── Mobile GRN Card ──────────────────────────────────────────
// const GrnCard = ({ g }: { g: GrnRecord }) => (
//   // TODO: render mobile card layout showing invoice, date, amount, customer, vendor, quantity
//   <></>
// );

// // ─── Compact date input (desktop) ─────────────────────────────
// const CompactDateInput = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
//   // TODO: render labelled compact date input using toHtml/fromHtml converters
//   <></>
// );

// // ─── Constants ────────────────────────────────────────────────
// const PAGE_SIZE_OPTIONS: number[] = []; // TODO: define page size options
// const COLUMNS: { label: string; key: string }[] = []; // TODO: define table column definitions

// // ─── Component ────────────────────────────────────────────────
// const GrnListing = () => {
//   const { poNo } = useParams<{ poNo?: string }>();

//   // TODO: derive base API URL, contractId, className from env/localStorage

//   // TODO: initialise default from/to date range (e.g. last 12 months)

//   const [rawData,      setRawData]      = useState<GrnRecord[]>([]);
//   const [loading,      setLoading]      = useState(true);
//   const [isRefreshing, setIsRefreshing] = useState(false);
//   const [error,        setError]        = useState<string | null>(null);
//   const [lastUpdated,  setLastUpdated]  = useState<Date | null>(null);
//   const [fromDate,     setFromDate]     = useState(""); // TODO: default to computed defaultFrom
//   const [toDate,       setToDate]       = useState(""); // TODO: default to computed defaultTo
//   const [searchQuery,  setSearchQuery]  = useState("");
//   const [sortConfig,   setSortConfig]   = useState<{ key: string; direction: "asc" | "desc" }>({ key: "", direction: "asc" }); // TODO: set sensible defaults
//   const [pageSize,     setPageSize]     = useState(0); // TODO: set default page size
//   const [currentPage,  setCurrentPage]  = useState(1);

//   const fetchGrns = useCallback(async (force = false) => {
//     // TODO: guard if no contractId
//     // TODO: check cache unless force=true
//     // TODO: fetch from API with contractID + class params
//     // TODO: map response with mapGrn, write cache, update state
//     // TODO: handle errors and set error state
//   }, [/* TODO: deps */]);

//   useEffect(() => {
//     // TODO: call fetchGrns on mount
//   }, [fetchGrns]);

//   const handleRefresh = () => {
//     // TODO: clear cache entry and re-fetch with force=true
//   };

//   const filteredData = useMemo(() => {
//     // TODO: filter rawData by searchQuery (invoice, customer, vendor)
//     // TODO: filter by fromDate–toDate range using tryParseDate
//     // TODO: sort by sortConfig (numeric for amount/quantity, date-aware for date, locale for strings)
//     return [] as GrnRecord[];
//   }, [rawData, searchQuery, sortConfig, fromDate, toDate]);

//   const totalAmount = useMemo(() => {
//     // TODO: sum amount across filteredData
//     return 0;
//   }, [filteredData]);

//   const totalQty = useMemo(() => {
//     // TODO: sum quantity across filteredData
//     return 0;
//   }, [filteredData]);

//   // TODO: derive totalPages, safePage, paginatedData from filteredData + pageSize + currentPage

//   const handleSort = (key: string) => {
//     // TODO: toggle sort direction if same key, else reset to desc; reset page to 1
//   };

//   // TODO: derive isFiltered boolean from searchQuery / date range vs defaults

//   const statsBar = null; // TODO: render records count, total qty, total amount badges when filteredData.length > 0

//   return (
//     <DashboardLayout>
//       {/* TODO: page heading with optional PO number */}

//       {/* TODO: desktop toolbar — search input, from/to date pickers, reset button, stats bar, refresh button */}

//       {/* TODO: mobile toolbar — search input, from/to date inputs, refresh button, stats bar */}

//       {/* TODO: error state — message + Retry button */}

//       {/* TODO: desktop table — TableSkeleton while loading, else Card > Table with sortable headers, rows, totals footer, pagination controls, last-updated timestamp */}

//       {/* TODO: mobile cards — CardSkeleton while loading, empty state, GrnCard list, mobile pagination */}
//     </DashboardLayout>
//   );
// };

// export default GrnListing;