

import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/Common/DashboardLayout";
import {
  ArrowLeft, ChevronRight, Loader2, CheckCircle2,
  Building2, MapPin, Truck, Download, Printer
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { SalesOrderData } from "./SalesOrderPreview";

const G = "#3a5f32"; // sidebar green

interface CreatedOrderInfo { tranid: string; id: number; }

const getProxy = () =>
  ((import.meta as any).env.VITE_API_URL || "http://localhost:3001/api").replace(/\/+$/, "");

const fmt = (d: string) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }); }
  catch { return d; }
};

const numberToWords = (num: number): string => {
  const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  if (num === 0) return "Zero";
  const c = (n: number): string => {
    if (n < 20)       return ones[n];
    if (n < 100)      return tens[Math.floor(n/10)] + (n%10 ? " "+ones[n%10] : "");
    if (n < 1000)     return ones[Math.floor(n/100)] + " Hundred" + (n%100 ? " "+c(n%100) : "");
    if (n < 100000)   return c(Math.floor(n/1000)) + " Thousand" + (n%1000 ? " "+c(n%1000) : "");
    if (n < 10000000) return c(Math.floor(n/100000)) + " Lakh" + (n%100000 ? " "+c(n%100000) : "");
    return c(Math.floor(n/10000000)) + " Crore" + (n%10000000 ? " "+c(n%10000000) : "");
  };
  return c(Math.floor(num));
};

// ── Map RAW API response → unified display shape ─────────────────────────────
// Only used when loading from listing (not creation flow)
const mapApiResponse = (raw: any) => {
  const cd = raw.customerDetails || {};
  const sd = raw.supplierDetails || {};

  const parseAddr = (str: string, gstin?: string, phone?: string) => {
    if (!str) return { name: "", street: "", city: "", country: "", phone: phone||"", gstin: gstin||"" };
    const lines = str.split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean);
    return { name: lines[0]||"", street: lines[1]||"", city: lines[2]||"", country: lines[3]||"India", phone: phone||"", gstin: gstin||"" };
  };

  return {
    salesOrderNo:        raw.DocumentNumber      || raw.InternalID    || "—",
    contract:            raw.name                || "",
    contractClass:       raw.className           || "",
    purchaseOrderID:     raw.poNumber            || raw.PO_internalID || "",
    purchaseOrderDate:   raw.date                || raw.DateCreated   || "",
    relationshipManager: raw.RelationshipManager || "",
    memo:                raw.tradeNo ? `Trade No: ${raw.tradeNo}` : "",
    status:              raw.Status              || "—",
    placeOfSupply:       raw.placeOfSupply       || "",
    centralFssai:        raw.centralFssai        || "",
    billing:  parseAddr(cd.billAddr,  cd.billGstin),
    shipping: parseAddr(cd.shipAddr,  cd.shipGstin),
    supplier: {
      name:    raw.Supplier    || "",
      street:  sd.address      || "",
      city:    sd.city         || "",
      country: "India",
      phone:   raw.PhoneNumber || "",
      gstin:   raw.SupplierGST || "",
    },
    lineItems: (raw.items || []).map((i: any) => ({
      productName: i.itemName    || "",
      description: i.description || "",
      hsn:         i.hsnCode     || "",
      uom:         i.uom         || "",
      quantity:    Number(i.quantity)  || 0,
      sellRate:    Number(i.sellrate)  || 0,
      buyRate:     Number(i.buyrate)   || 0,
      gstRate:     Number(i.gstRate)   || 0,
    })),
    _summary: raw.summary || {},
    _isApiShape: true,
  };
};

// ── Normalise creation-flow SalesOrderData → same display shape ──────────────
// SalesOrderData already has billing/shipping/supplier/lineItems in the right shape
const normaliseFormData = (d: SalesOrderData): any => ({
  salesOrderNo:        (d as any).salesOrderNo        || "—",
  contract:            (d as any).contract            || "",
  contractClass:       (d as any).contractClass       || "",
  purchaseOrderID:     (d as any).purchaseOrderID     || (d as any).purchaseOrderId || "",
  purchaseOrderDate:   (d as any).purchaseOrderDate   || "",
  relationshipManager: (d as any).relationshipManager || "",
  memo:                (d as any).memo                || "",
  status:              (d as any).status              || "Pending Approval",
  placeOfSupply:       (d as any).placeOfSupply       || "",
  centralFssai:        (d as any).centralFssai        || "",
  billing:             d.billing  || {},
  shipping:            d.shipping || {},
  supplier:            d.supplier || {},
  lineItems:           d.lineItems || [],
  _summary:            {},
});

/* ── Status badge ───────────────────────────────────────────────── */
const StatusBadge = ({ status }: { status: string }) => {
  const l = (status || "").toLowerCase();
  if (l === "billed")
    return <Badge className="bg-blue-100 text-blue-800 border border-blue-200 font-bold text-xs px-3 py-1">{status}</Badge>;
  if (l === "approved" || l === "closed")
    return <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs px-3 py-1">{status}</Badge>;
  if (l.includes("reject") || l.includes("cancel"))
    return <Badge variant="destructive" className="font-bold text-xs px-3 py-1">{status}</Badge>;
  return <Badge className="bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs px-3 py-1">{status}</Badge>;
};

/* ── Section label ──────────────────────────────────────────────── */
const SectionLabel = ({ children }: { children: string }) => (
  <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: G }}>{children}</p>
);

/* ── Meta field ─────────────────────────────────────────────────── */
const Field = ({ label, value }: { label: string; value?: string }) => {
  if (!value) return null;
  return (
    <div className="space-y-1 min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: G }}>{label}</p>
      <p className="text-sm font-semibold text-gray-900 leading-snug break-words">{value}</p>
    </div>
  );
};

/* ── Address card ───────────────────────────────────────────────── */
const AddrCard = ({ label, addr, Icon }: { label: string; addr: any; Icon: any }) => (
  <Card className="overflow-hidden border-gray-200 shadow-sm h-full p-0 no-break">
    <div className="flex items-center gap-2 px-4 py-2.5" style={{ backgroundColor: G }}>
      <Icon className="w-3.5 h-3.5 text-white shrink-0" />
      <span className="text-[11px] font-bold text-white uppercase tracking-widest">{label}</span>
    </div>
    <CardContent className="px-4 py-3 space-y-0.5">
      {addr?.name ? (
        <>
          <p className="font-bold text-gray-900 text-sm leading-snug break-words">{addr.name}</p>
          {addr.street  && <p className="text-xs text-gray-600 leading-relaxed pt-1 break-words">{addr.street}</p>}
          {addr.city    && <p className="text-xs text-gray-600">{addr.city}</p>}
          {addr.country && <p className="text-xs text-gray-600">{addr.country}</p>}
          {addr.gstin   && <p className="text-xs font-semibold pt-1.5" style={{ color: G }}>GST: {addr.gstin}</p>}
          {addr.phone   && <p className="text-xs text-gray-600">📞 {addr.phone}</p>}
        </>
      ) : <p className="text-sm text-gray-400 italic">Not provided</p>}
    </CardContent>
  </Card>
);

/* ════════════════════════════════════════════════════════════════ */
const SalesOrderView = () => {
  const navigate = useNavigate();
  const { id }   = useParams();
  const location = useLocation();

  const stateData    = location.state?.salesOrderData as SalesOrderData | undefined;
  const stateCreated = location.state?.createdOrder   as CreatedOrderInfo | undefined;

  //   If from creation flow → normalise form data directly (don't mapApiResponse)
  // If from listing → start null, fetch from API
  const [data,    setData]    = useState<any | null>(stateData ? normaliseFormData(stateData) : null);
  const [created]             = useState<CreatedOrderInfo | null>(stateCreated || null);
  const [loading, setLoading] = useState(!stateData);
  const [error,   setError]   = useState<string | null>(null);

  const isCreationFlow = Boolean(stateData && stateCreated);

  useEffect(() => {
    // Creation flow — data already set from stateData, no fetch needed
    if (stateData) return;
    if (!id || id === "new") { navigate("/sales-orders/listing"); return; }

    let gone = false;
    (async () => {
      setLoading(true); setError(null);
      try {
        const res = await fetch(
          `${getProxy()}/proxy/trade/v1/so-summary?SoID=${encodeURIComponent(id)}`,
          { credentials: "include" }
        );
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          throw new Error(e?.message || `HTTP ${res.status}`);
        }
        const raw  = await res.json();
        const item = Array.isArray(raw) ? raw[0] : raw;
        if (!item) throw new Error("No data returned for this Sales Order.");
        if (!gone) setData(mapApiResponse(item));
      } catch (e: any) {
        if (!gone) setError(e.message || "Failed to load sales order.");
      } finally {
        if (!gone) setLoading(false);
      }
    })();
    return () => { gone = true; };
  }, [id, stateData, navigate]);

  const handleDownload = () => setTimeout(() => window.print(), 100);

  /* ── Loading ── */
  if (loading) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: G }} />
        <p className="text-sm text-gray-500 font-medium">Loading sales order…</p>
      </div>
    </DashboardLayout>
  );

  /* ── Error ── */
  if (error) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-600 font-semibold">{error}</p>
        <Button variant="outline" onClick={() => navigate("/sales-orders/listing")}>← Back to Listing</Button>
      </div>
    </DashboardLayout>
  );

  if (!data) return null;

  /* ── Calculations ── */
  const s        = data._summary || {};
  const subtotal = s.subtotal  != null ? s.subtotal  : data.lineItems.reduce((a: number, i: any) => a + i.quantity * i.sellRate, 0);
  const tax      = s.tax_total != null ? s.tax_total : data.lineItems.reduce((a: number, i: any) => a + (i.quantity * i.sellRate * i.gstRate) / 100, 0);
  const grand    = s.total     != null ? s.total     : subtotal + tax;
  const inWords  = s.total_in_words || `${numberToWords(Math.floor(grand))} Rupees Only`;
  const tranId   = created?.tranid || data.salesOrderNo || "—";
  const status   = data.status || "Pending Approval";

  return (
    <DashboardLayout>
      <style>{`
        @media print {
          body > * { display: none !important; }
          #so-print-root { display: block !important; }
          @page { margin: 12mm 10mm; size: A4; }
          #so-print-root .no-print { display: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          table { width: 100% !important; table-layout: fixed !important; font-size: 10px !important; }
          th, td { padding: 4px 6px !important; word-break: break-word !important; }
          .no-break { page-break-inside: avoid !important; break-inside: avoid !important; }
          .shadow-sm, .shadow-md { box-shadow: none !important; }
        }
      `}</style>

      <div id="so-print-root" className="min-h-screen bg-gray-50/80">

        {/* ── Top bar ── */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm no-print">
          <div className="max-w-5xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Button
                variant="outline" size="icon"
                className="h-8 w-8 shrink-0 border-gray-200 transition-all"
                onClick={() => navigate("/sales-orders/listing")}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = G; (e.currentTarget as HTMLElement).style.borderColor = G; (e.currentTarget as HTMLElement).style.color = "white"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; (e.currentTarget as HTMLElement).style.borderColor = ""; (e.currentTarget as HTMLElement).style.color = ""; }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <nav className="flex items-center gap-1 text-xs min-w-0">
                <span onClick={() => navigate("/")} className="text-gray-400 hover:text-gray-800 cursor-pointer font-medium hidden sm:inline">Dashboard</span>
                <ChevronRight className="w-3 h-3 text-gray-300 hidden sm:inline" />
                <span onClick={() => navigate("/sales-orders/listing")} className="text-gray-400 hover:text-gray-800 cursor-pointer font-medium">Sales Orders</span>
                <ChevronRight className="w-3 h-3 text-gray-300" />
                <span className="font-bold text-gray-900 truncate max-w-[120px] sm:max-w-none">{tranId}</span>
              </nav>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={handleDownload} className="h-8 gap-1.5 text-xs font-semibold border-gray-200 hidden sm:flex">
                <Printer className="w-3.5 h-3.5" /> Print
              </Button>
              <Button size="sm" onClick={handleDownload} className="h-8 gap-1.5 text-xs font-bold text-white"
                style={{ backgroundColor: G }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#2d4f28")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = G)}
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-5 space-y-4">

          {/* Success banner */}
          {isCreationFlow && created && (
            <Card className="border-green-200 bg-green-50 shadow-none no-print">
              <CardContent className="flex items-center gap-3 py-4 px-4 sm:px-6">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: G }}>
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Sales Order Created Successfully!</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Sales order <span className="font-bold" style={{ color: G }}>{created.tranid}</span> has been submitted for processing.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Document */}
          <Card className="border-gray-200 shadow-sm overflow-hidden">

            {/* Green header */}
            <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5" style={{ backgroundColor: G }}>
              <div className="min-w-0 flex-1 mr-3">
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-white/60 mb-1">Sales Order</p>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">{tranId}</h1>
              </div>
              <div className="bg-white rounded-xl px-3 sm:px-4 py-2 shadow-md flex items-center justify-center min-w-[80px] sm:min-w-[110px]">
                <img
                  src="/assets/Samunnati.jpg"
                  alt="Samunnati"
                  className="h-7 sm:h-8 w-auto max-w-[100px] object-contain block"
                  onError={e => {
                    const img = e.currentTarget as HTMLImageElement;
                    img.style.display = "none";
                    const wrap = img.parentElement;
                    if (wrap) wrap.innerHTML = `<span style="color:${G};font-weight:900;font-size:13px">Samunnati</span>`;
                  }}
                />
              </div>
            </div>

            {/* Status strip */}
            <div className="px-4 sm:px-8 py-3 flex items-center gap-2 border-b border-gray-100 bg-gray-50/60">
              <span className="text-xs text-gray-500 font-medium">Status</span>
              <StatusBadge status={status} />
            </div>

            {/* Order details */}
            <CardContent className="px-4 sm:px-8 py-5 border-b border-gray-100">
              <SectionLabel>Order Details</SectionLabel>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 sm:gap-x-8 gap-y-4 sm:gap-y-5">
                <Field label="Contract"          value={data.contract} />
                <Field label="Contract Class"    value={data.contractClass} />
                <Field label="Purchase Order No" value={data.purchaseOrderID} />
                <Field label="SO Date"           value={fmt(data.purchaseOrderDate)} />
                <Field label="Rel. Manager"      value={data.relationshipManager} />
                <Field label="Place of Supply"   value={data.placeOfSupply} />
                <Field label="FSSAI"             value={data.centralFssai} />
                <Field label="Memo"              value={data.memo} />
              </div>
            </CardContent>

            {/* Parties */}
            <CardContent className="px-4 sm:px-8 py-5 border-b border-gray-100">
              <SectionLabel>Parties</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AddrCard label="Bill To"  addr={data.billing}  Icon={Building2} />
                <AddrCard label="Ship To"  addr={data.shipping} Icon={MapPin} />
                <AddrCard label="Supplier" addr={data.supplier} Icon={Truck} />
              </div>
            </CardContent>

            {/* Line Items */}
            <CardContent className="px-4 sm:px-8 py-5 border-b border-gray-100">
              <SectionLabel>Line Items</SectionLabel>

              {/* Desktop table */}
              <div className="hidden sm:block rounded-lg border border-gray-200 overflow-hidden">
                <Table className="table-fixed w-full">
                  <colgroup>
                    <col style={{ width: "4%" }} />
                    <col style={{ width: "22%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "6%" }} />
                    <col style={{ width: "11%" }} />
                    <col style={{ width: "11%" }} />
                    <col style={{ width: "7%" }} />
                    <col style={{ width: "11%" }} />
                  </colgroup>
                  <TableHeader>
                    <TableRow style={{ backgroundColor: G }} className="hover:opacity-100">
                      {["#","Item","HSN","UOM","Qty","Sell Rate","Buy Rate","GST","Amount"].map((h, i) => (
                        <TableHead key={h} className={`text-[11px] font-bold text-white uppercase tracking-wider whitespace-nowrap py-3 ${i >= 4 ? "text-right" : "text-left"}`}>
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.lineItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-sm text-gray-400 py-8">No line items</TableCell>
                      </TableRow>
                    ) : data.lineItems.map((item: any, idx: number) => {
                      const lt  = item.quantity * item.sellRate;
                      const itemTax = (lt * item.gstRate) / 100;
                      return (
                        <TableRow key={idx} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"} hover:bg-gray-50 transition-colors`}>
                          <TableCell className="text-xs font-bold py-3.5" style={{ color: G }}>{idx + 1}</TableCell>
                          <TableCell className="py-3.5">
                            <p className="font-semibold text-gray-900 text-sm">{item.productName || "—"}</p>
                            {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}
                          </TableCell>
                          <TableCell className="text-xs text-gray-600 font-medium py-3.5">{item.hsn || "—"}</TableCell>
                          <TableCell className="text-xs text-gray-600 font-medium py-3.5">{item.uom || "—"}</TableCell>
                          <TableCell className="text-right font-bold text-gray-900 py-3.5">{item.quantity}</TableCell>
                          <TableCell className="text-right font-semibold text-gray-900 whitespace-nowrap py-3.5">₹{item.sellRate.toLocaleString("en-IN")}</TableCell>
                          <TableCell className="text-right font-medium text-gray-500 whitespace-nowrap py-3.5">₹{item.buyRate.toLocaleString("en-IN")}</TableCell>
                          <TableCell className="text-right py-3.5">
                            {item.gstRate > 0
                              ? <Badge variant="outline" className="font-bold text-xs" style={{ color: G, borderColor: G }}>{item.gstRate}%</Badge>
                              : <span className="text-xs text-gray-400">—</span>}
                          </TableCell>
                          <TableCell className="text-right font-black text-gray-900 whitespace-nowrap py-3.5">
                            ₹{(lt + itemTax).toLocaleString("en-IN")}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden space-y-3">
                {data.lineItems.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">No line items</p>
                ) : data.lineItems.map((item: any, idx: number) => {
                  const lt      = item.quantity * item.sellRate;
                  const itemTax = (lt * item.gstRate) / 100;
                  return (
                    <div key={idx} className="rounded-xl border border-gray-200 overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2" style={{ backgroundColor: `${G}18` }}>
                        <span className="text-xs font-bold" style={{ color: G }}>Item {idx + 1}</span>
                        {item.gstRate > 0 && (
                          <Badge variant="outline" className="text-[10px] font-bold" style={{ color: G, borderColor: G }}>GST {item.gstRate}%</Badge>
                        )}
                      </div>
                      <div className="px-3 py-3 space-y-2.5 bg-white">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{item.productName || "—"}</p>
                          {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}
                          {item.hsn && <p className="text-[10px] text-gray-400 mt-0.5">HSN: {item.hsn}</p>}
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><p className="text-gray-400 font-medium">UOM</p><p className="font-semibold text-gray-800">{item.uom || "—"}</p></div>
                          <div><p className="text-gray-400 font-medium">Qty</p><p className="font-bold text-gray-900">{item.quantity}</p></div>
                          <div><p className="text-gray-400 font-medium">Sell Rate</p><p className="font-semibold text-gray-900">₹{item.sellRate.toLocaleString("en-IN")}</p></div>
                          <div><p className="text-gray-400 font-medium">Buy Rate</p><p className="font-medium text-gray-600">₹{item.buyRate.toLocaleString("en-IN")}</p></div>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                          <span className="text-xs text-gray-500 font-medium">Total</span>
                          <span className="font-black text-gray-900">₹{(lt + itemTax).toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>

            {/* Totals */}
            <CardContent className="px-4 sm:px-8 py-5 border-b border-gray-100 no-break">
              <div className="flex justify-end">
                <div className="w-full sm:w-72 space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Subtotal</span>
                    <span className="font-semibold text-gray-900">₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  {s.apmc_charges > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">APMC Charges</span>
                      <span className="font-semibold text-gray-900">₹{Number(s.apmc_charges).toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Tax</span>
                    <span className="font-semibold text-gray-900">₹{tax.toLocaleString("en-IN")}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="font-black text-gray-900 text-base">Grand Total</span>
                    <span className="font-black text-xl" style={{ color: G }}>₹{grand.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="rounded-lg px-3 py-2.5 border" style={{ backgroundColor: `${G}0d`, borderColor: `${G}30` }}>
                    <p className="text-[11px] font-semibold italic text-right leading-relaxed" style={{ color: G }}>
                      {inWords}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>

            {/* Payment Milestone */}
            {s.payment_milestone && (
              <CardContent className="px-4 sm:px-8 py-5 border-b border-gray-100">
                <SectionLabel>Payment Milestone</SectionLabel>
                <div
                  className="text-sm text-gray-800 font-medium leading-relaxed rounded-lg px-4 py-3 border"
                  style={{ backgroundColor: `${G}08`, borderColor: `${G}25` }}
                  dangerouslySetInnerHTML={{ __html: s.payment_milestone }}
                />
              </CardContent>
            )}

            {/* Footer */}
            <div className="px-4 sm:px-8 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2 no-print">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                
                <Button
                  onClick={() => navigate("/sales-orders/listing")}
                  className="flex-1 sm:flex-none h-9 text-sm font-bold text-white"
                  style={{ backgroundColor: G }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#2d4f28")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = G)}
                >
                  ← Back
                </Button>
              </div>
            </div>

          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SalesOrderView;