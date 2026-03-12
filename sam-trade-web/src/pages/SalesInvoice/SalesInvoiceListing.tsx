

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/Common/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Loader2, Search, RefreshCw, AlertCircle, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import axios from "axios";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SalesInvoice {
  DocumentNumber: string;
  BillID:         string;
  amount:         string;
  Contract:       string;
  SoReferences:   string;
  status:         string;
  DateCreated:    string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getProxy = () =>
  ((import.meta as any).env.VITE_API_URL || "http://localhost:3001/api").replace(/\/+$/, "");

const toApiDate = (iso: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};

const formatDisplayDate = (ddmmyyyy: string): string => {
  if (!ddmmyyyy) return "—";
  const [d, m, y] = ddmmyyyy.split("/");
  const dt = new Date(Number(y), Number(m) - 1, Number(d));
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const statusColor = (status: string): string => {
  const s = status?.toLowerCase();
  if (s === "shipped" || s === "closed") return "bg-green-100 text-green-800 border-green-300";
  if (s === "open")                      return "bg-blue-100 text-blue-800 border-blue-300";
  if (s === "pending")                   return "bg-yellow-100 text-yellow-800 border-yellow-300";
  if (s === "cancelled")                 return "bg-red-100 text-red-800 border-red-300";
  return "bg-blue-100 text-blue-800 border-blue-300";
};

const defaultFromDate = (): string => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().split("T")[0];
};
const defaultToDate = (): string => new Date().toISOString().split("T")[0];

// ── Extract array from ANY response shape ─────────────────────────────────────
const extractList = (raw: any): SalesInvoice[] => {
  console.debug("[SalesInvoiceListing] raw response:", JSON.stringify(raw)?.slice(0, 500));

  if (Array.isArray(raw)) return raw;

  const wrapperKeys = ["data", "invoices", "result", "results", "items", "records", "list"];
  for (const key of wrapperKeys) {
    if (Array.isArray(raw?.[key])) return raw[key];
  }

  // Single object that looks like an invoice
  if (raw && typeof raw === "object" && (raw.DocumentNumber || raw.BillID)) return [raw];

  // Last resort: grab the first array-valued property
  if (raw && typeof raw === "object") {
    for (const key of Object.keys(raw)) {
      if (Array.isArray(raw[key])) {
        console.debug(`[SalesInvoiceListing] found array under key: "${key}"`);
        return raw[key];
      }
    }
  }

  return [];
};

// ─── Component ────────────────────────────────────────────────────────────────
const SalesInvoicesListing = () => {
  const navigate = useNavigate();

  const [fromDate,     setFromDate]     = useState(defaultFromDate());
  const [toDate,       setToDate]       = useState(defaultToDate());
  const [salesOrderId, setSalesOrderId] = useState(
    localStorage.getItem("selectedSalesOrderId") || ""
  );

  const [invoices,   setInvoices]   = useState<SalesInvoice[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  // ─── Fetch ───────────────────────────────────────────────────────────────
  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: Record<string, string> = {
        fromdate: toApiDate(fromDate),
        todate:   toApiDate(toDate),
      };
      if (salesOrderId.trim()) {
        params.salesorderid = salesOrderId.trim();
      }

      console.debug("[SalesInvoiceListing] GET params:", params);

      const res = await axios.get(
        `${getProxy()}/proxy/trade/v1/sales-invoice-listing`,
        { params },
      );

      const list = extractList(res.data);
      console.debug(`[SalesInvoiceListing] ${list.length} invoices parsed`);

      setInvoices(list);
      setHasFetched(true);
    } catch (err: any) {
      console.error("[SalesInvoiceListing] API error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error   ||
        err?.message                 ||
        "Failed to load sales invoices. Please try again.";
      setError(msg);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvoices();
  };

  const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales Invoices</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              View all sales invoices within a date range
            </p>
          </div>
          <Button
            variant="outline" size="sm"
            onClick={fetchInvoices}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* ── Filter Bar ──────────────────────────────────────────────────── */}
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
              <div className="flex flex-col gap-1 min-w-[150px]">
                <Label className="text-xs text-gray-600">From Date</Label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div className="flex flex-col gap-1 min-w-[150px]">
                <Label className="text-xs text-gray-600">To Date</Label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div className="flex flex-col gap-1 min-w-[180px]">
                <Label className="text-xs text-gray-600">
                  Sales Order ID <span className="text-gray-400">(optional)</span>
                </Label>
                <Input
                  type="text"
                  value={salesOrderId}
                  onChange={(e) => setSalesOrderId(e.target.value)}
                  placeholder="e.g. 3168954"
                  className="h-9 text-sm"
                />
              </div>

              <Button type="submit" disabled={loading} className="h-9 flex items-center gap-2">
                {loading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Search className="w-4 h-4" />}
                Search
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ── Error ───────────────────────────────────────────────────────── */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between gap-4">
              <span>{error}</span>
              <Button size="sm" variant="outline"
                className="shrink-0 border-destructive text-destructive hover:bg-destructive hover:text-white"
                onClick={fetchInvoices}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* ── Summary ─────────────────────────────────────────────────────── */}
        {hasFetched && !loading && !error && (
          <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
            <span>
              {invoices.length > 0
                ? `${invoices.length} invoice${invoices.length !== 1 ? "s" : ""} found`
                : "No invoices found for the selected filters"}
            </span>
            {invoices.length > 0 && (
              <span className="font-semibold text-gray-800">
                Total: ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>
        )}

        {/* ── Loading ──────────────────────────────────────────────────────── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Loading sales invoices…</p>
          </div>
        )}

        {/* ── Table ────────────────────────────────────────────────────────── */}
        {!loading && hasFetched && (
          <>
            {invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <FileText className="w-10 h-10 opacity-30" />
                <p className="text-sm">No invoices found. Try adjusting the date range or Sales Order ID.</p>
              </div>
            ) : (
              <>
                {/* DESKTOP */}
                <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <ScrollArea className="w-full">
                    <div className="min-w-[900px]">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-primary hover:bg-primary">
                            {["Document No.", "Sales Order", "Contract", "Date", "Amount", "Status"].map((h) => (
                              <TableHead key={h} className="text-xs font-semibold text-white whitespace-nowrap">
                                {h}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoices.map((inv, idx) => (
                            <TableRow key={inv.BillID || idx} className="hover:bg-gray-50 cursor-default">

                              <TableCell className="p-3">
                                <span className="font-semibold text-primary text-sm">
                                  {inv.DocumentNumber}
                                </span>
                                <p className="text-[10px] text-gray-400 mt-0.5">ID: {inv.BillID}</p>
                              </TableCell>

                              <TableCell className="p-3 text-sm text-gray-700">
                                {inv.SoReferences || "—"}
                              </TableCell>

                              <TableCell className="p-3 text-sm text-gray-600 max-w-[220px]">
                                <span className="truncate block" title={inv.Contract}>
                                  {inv.Contract || "—"}
                                </span>
                              </TableCell>

                              <TableCell className="p-3 text-sm text-gray-600 whitespace-nowrap">
                                {formatDisplayDate(inv.DateCreated)}
                              </TableCell>

                              <TableCell className="p-3 text-sm font-semibold text-gray-900 whitespace-nowrap">
                                ₹{Number(inv.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </TableCell>

                              <TableCell className="p-3">
                                <Badge className={`text-xs border ${statusColor(inv.status)}`}>
                                  {inv.status}
                                </Badge>
                              </TableCell>

                            </TableRow>
                          ))}

                          {/* Totals row */}
                          <TableRow className="bg-gray-50 hover:bg-gray-50 border-t-2 border-gray-200">
                            <TableCell colSpan={4} className="p-3 text-right font-semibold text-gray-700">
                              Total Amount
                            </TableCell>
                            <TableCell className="p-3 font-bold text-gray-900 whitespace-nowrap">
                              ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell />
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </div>

                {/* MOBILE CARDS */}
                <div className="md:hidden space-y-3">
                  {invoices.map((inv, idx) => (
                    <Card key={inv.BillID || idx}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-primary">{inv.DocumentNumber}</p>
                            <p className="text-xs text-gray-400">ID: {inv.BillID}</p>
                          </div>
                          <Badge className={`text-xs border ${statusColor(inv.status)}`}>
                            {inv.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Sales Order</p>
                            <p className="font-medium">{inv.SoReferences || "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Date</p>
                            <p>{formatDisplayDate(inv.DateCreated)}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">Contract</p>
                          <p className="text-sm text-gray-700">{inv.Contract || "—"}</p>
                        </div>

                        <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Amount</span>
                          <span className="font-bold text-gray-900">
                            ₹{Number(inv.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Mobile total */}
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">Total Amount</span>
                      <span className="text-lg font-bold text-primary">
                        ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SalesInvoicesListing;