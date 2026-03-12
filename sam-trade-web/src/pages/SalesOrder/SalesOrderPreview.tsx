

import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import DashboardLayout from "@/components/Common/DashboardLayout";
import { ChevronRight, Download, Loader2, AlertCircle, AlertTriangle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { type LineItem } from "@/components/Common/LineItemsTable";
import { type Address } from "@/components/SalesOrder/Creation/SearchableAddressSelect";

export interface SalesOrderData {
  contract: string; customerId?: string; originId?: string; classId?: string;
  subsidiary?: string; location?: string; customForm?: string;
  contractClass: string; purchaseOrderID: string; purchaseOrderDate: string;
  relationshipManager: string; memo: string; purchaseOrderFile: File | null;
  billing: Address; shipping: Address; supplier: Address; delivery: Address;
  lineItems: LineItem[]; salesOrderNo: string; salesOrderDate: string;
  selectedCustomerGst?: string; customerEmail?: string;
}

const DEFAULT_SUBSIDIARY  = String((import.meta as any).env.VITE_SUBSIDIARY  || "15");
const DEFAULT_LOCATION    = String((import.meta as any).env.VITE_LOCATION    || "13");
const DEFAULT_CUSTOM_FORM = String((import.meta as any).env.VITE_CUSTOM_FORM || "379");
const getProxy = () => ((import.meta as any).env.VITE_API_URL || "http://localhost:3001/api").replace(/\/+$/, "");

const formatDate = (d: string): string => {
  try { const dt = new Date(d); return `0${dt.getDate()}`.slice(-2)+"/"+`0${dt.getMonth()+1}`.slice(-2)+"/"+dt.getFullYear(); }
  catch { return d || ""; }
};
const formatDisplayDate = (d: string): string => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }); }
  catch { return d; }
};
const numberToWords = (num: number): string => {
  const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  if (num === 0) return "Zero";
  const convert = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n/10)]+(n%10?" "+ones[n%10]:"");
    if (n < 1000) return ones[Math.floor(n/100)]+" Hundred"+(n%100?" "+convert(n%100):"");
    if (n < 100000) return convert(Math.floor(n/1000))+" Thousand"+(n%1000?" "+convert(n%1000):"");
    if (n < 10000000) return convert(Math.floor(n/100000))+" Lakh"+(n%100000?" "+convert(n%100000):"");
    return convert(Math.floor(n/10000000))+" Crore"+(n%10000000?" "+convert(n%10000000):"");
  };
  return convert(Math.floor(num));
};

const MetaField = ({ label, value }: { label: string; value?: string }) => {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-semibold text-gray-800 leading-snug">{value}</p>
    </div>
  );
};

const AddressCard = ({ label, address }: { label: string; address: Address }) => (
  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-1.5 h-full">
    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
    {address?.name ? (
      <>
        <p className="font-semibold text-gray-900 text-sm leading-snug">{address.name}</p>
        {address.street  && <p className="text-xs text-gray-500 leading-relaxed">{address.street}</p>}
        {address.city    && <p className="text-xs text-gray-500">{address.city}</p>}
        {address.country && <p className="text-xs text-gray-500">{address.country}</p>}
        {address.phone   && <p className="text-xs text-gray-500 pt-1">📞 {address.phone}</p>}
      </>
    ) : <p className="text-sm text-gray-400 italic">Not provided</p>}
  </div>
);

const SubmittingOverlay = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl px-10 py-10 flex flex-col items-center gap-5 max-w-xs w-full mx-4 text-center">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-primary/30" />
        </div>
      </div>
      <div className="space-y-1.5">
        <p className="text-lg font-bold text-gray-900">Submitting Order</p>
        <p className="text-sm text-gray-500 leading-relaxed">Please wait while we process your sales order. Do not close this page.</p>
      </div>
      <div className="flex items-center gap-1.5">
        {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
      </div>
    </div>
  </div>
);

//   Matches PageBreadcrumb pattern exactly — sticky top-14 z-20
const PreviewBreadcrumb = ({ onBack, isSubmitting }: { onBack: () => void; isSubmitting: boolean }) => (
  <div className="sticky top-14 z-20 bg-gray-100 border-t border-gray-200 border-b border-gray-300 shadow-sm">
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={onBack}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors">
            <ArrowLeft className="h-4 w-4 text-gray-700" />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">Sales Order Preview</h1>
            <div className="flex items-center gap-0.5 text-xs mt-0.5 whitespace-nowrap overflow-hidden">
              <Link to="/dashboard" className="text-gray-500 hover:text-gray-900 transition-colors">Dashboard</Link>
              <ChevronRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
              <Link to="/sales-orders/listing" className="text-gray-500 hover:text-gray-900 transition-colors">Sales Orders</Link>
              <ChevronRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
              <Link to="/sales-orders/create" className="text-gray-500 hover:text-gray-900 transition-colors">Create</Link>
              <ChevronRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
              <span className="text-gray-900 font-semibold">Preview</span>
            </div>
          </div>
        </div>
        <button disabled={isSubmitting}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
          <Download className="h-3.5 w-3.5" />
          <span>Download</span>
        </button>
      </div>
    </div>
  </div>
);

const SalesOrderPreview = () => {
  const navigate       = useNavigate();
  const location       = useLocation();
  const salesOrderData = location.state?.salesOrderData as SalesOrderData | undefined;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError,  setSubmitError]  = useState<string | null>(null);

  if (!salesOrderData) { navigate("/sales-orders/create"); return null; }

  const calcItemTotal = (item: LineItem) => item.quantity * item.sellRate;
  const subtotal   = salesOrderData.lineItems.reduce((s, i) => s + calcItemTotal(i), 0);
  const taxAmount  = salesOrderData.lineItems.reduce((s, i) => s + (calcItemTotal(i) * i.gstRate) / 100, 0);
  const grandTotal = subtotal + taxAmount;

  const handleConfirmAndSubmit = async () => {
    setIsSubmitting(true); setSubmitError(null);
    try {
      const contractId    = salesOrderData.contract?.trim() || "";
      if (!contractId) { setSubmitError("Missing contract ID."); setIsSubmitting(false); return; }
      const customerId    = salesOrderData.customerId?.trim()          || "";
      const gstId         = salesOrderData.selectedCustomerGst?.trim() || "";
      const customerEmail = salesOrderData.customerEmail?.trim()        || "";
      const classId       = salesOrderData.classId?.trim() || localStorage.getItem("selectedClassId")?.trim() || "";
      const body: Record<string, any> = {
        entity: contractId, customForm: DEFAULT_CUSTOM_FORM,
        trandate: formatDate(salesOrderData.purchaseOrderDate),
        otherrefnum: salesOrderData.purchaseOrderID || "",
        subsidiary: DEFAULT_SUBSIDIARY, location: DEFAULT_LOCATION,
        custbody_sam_btst_subcustomer: contractId, custbody_so_tran_origin: "2",
        ...(classId ? { class: classId } : {}),
        memo: salesOrderData.memo || "", gst_retention: true, broker_id: "", creditPeriod: 7,
        ...(gstId ? { entitytaxregnum: gstId } : {}),
        ...(salesOrderData.billing?.id  ? { billaddress: String(salesOrderData.billing.id) }  : {}),
        ...(salesOrderData.shipping?.id ? { shipaddress: String(salesOrderData.shipping.id) } : {}),
        ...(salesOrderData.supplier?.id ? { custbody_btst_supplier: String(salesOrderData.supplier.id) } : {}),
        ...(salesOrderData.delivery?.id ? { custbody_btst_so_supplier_address: String(salesOrderData.delivery.id) } : {}),
        custbody_cust_po_attachment: salesOrderData.purchaseOrderFile ? [salesOrderData.purchaseOrderFile.name] : [],
        item: salesOrderData.lineItems.map((li: LineItem) => ({
          item: li.itemId || "", quantity: String(li.quantity || ""), rate: String(li.sellRate || ""),
          custcol_item_buy_rate: String(li.buyRate || ""), custcol_in_hsn_code: li.hsnId || "",
          description: li.description || "", broker_perunit_rate: "",
          ...(li.uomId ? { unitid: li.uomId } : {}),
        })),
        meta_details: {
          initiation_type: "2", created_by_employee: "", email: customerEmail,
          created_by_customer: customerId ? Number(customerId) : "", deviceType: "2",
        },
      };
      const res  = await fetch(`${getProxy()}/proxy/trade/v1/SalesOrderCreation`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const json = await res.json();
      const data = json?.data;
      const isNestedError = data && typeof data === "object" && "success" in data && data.success === false;
      if (json?.success === true && !isNestedError && data?.tranid) {
        navigate("/sales-orders/view/new", {
          state: { salesOrderData, createdOrder: { tranid: data.tranid, id: data.id } }, replace: true,
        });
      } else if (isNestedError) {
        setSubmitError(data?.data?.message || data?.message || "NetSuite error.");
      } else {
        setSubmitError(data?.message || json?.message || json?.error || "Failed to create sales order.");
      }
    } catch (e: any) {
      setSubmitError(e?.message || "Network error. Please retry.");
    } finally { setIsSubmitting(false); }
  };

  return (
    <DashboardLayout
      stickyHeader={
        <PreviewBreadcrumb
          onBack={() => navigate("/sales-orders/create", { state: { salesOrderData } })}
          isSubmitting={isSubmitting}
        />
      }
    >
      {isSubmitting && <SubmittingOverlay />}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-3 pb-6 space-y-4">

        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Review carefully before submitting</p>
            <p className="text-xs text-amber-600 mt-0.5">Once submitted, this order will be processed and cannot be easily modified.</p>
          </div>
        </div>

        {submitError && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="flex-1 text-sm text-red-700">{submitError}</p>
            <button onClick={() => setSubmitError(null)} className="text-xs text-red-400 hover:text-red-600 font-medium flex-shrink-0">Dismiss</button>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

          <div className="px-6 sm:px-8 py-5 flex items-center justify-between border-b border-gray-100">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Sales Order</h1>
              {salesOrderData.salesOrderNo && <p className="text-xs text-gray-400 mt-0.5">No. {salesOrderData.salesOrderNo}</p>}
            </div>
            <img src="/assets/Samunnati.jpg" alt="Samunnati" className="h-9 w-auto object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          </div>

          <div className="px-6 sm:px-8 py-5 border-b border-gray-100">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
              <MetaField label="Contract ID"       value={salesOrderData.contract} />
              <MetaField label="Contract Class"    value={salesOrderData.contractClass} />
              <MetaField label="Purchase Order ID" value={salesOrderData.purchaseOrderID} />
              <MetaField label="PO Date"           value={formatDisplayDate(salesOrderData.purchaseOrderDate)} />
              <MetaField label="Rel. Manager"      value={salesOrderData.relationshipManager} />
              <MetaField label="Memo"              value={salesOrderData.memo} />
            </div>
          </div>

          <div className="px-6 sm:px-8 py-5 border-b border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AddressCard label="Bill To"          address={salesOrderData.billing} />
              <AddressCard label="Ship To"          address={salesOrderData.shipping} />
              <AddressCard label="Supplier"         address={salesOrderData.supplier} />
              <AddressCard label="Delivery Address" address={salesOrderData.delivery} />
            </div>
          </div>

          <div className="px-6 sm:px-8 py-5 border-b border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Line Items</p>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {["#","Product","HSN","UOM","Qty","Sell Rate","Buy Rate","GST","Total"].map((h,i) => (
                      <th key={h} className={`px-3 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider ${i>=4?"text-right":"text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {salesOrderData.lineItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-3 py-3.5 text-gray-400 text-xs">{idx+1}</td>
                      <td className="px-3 py-3.5">
                        <p className="font-semibold text-gray-800">{item.productName||"—"}</p>
                        {item.description && <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>}
                      </td>
                      <td className="px-3 py-3.5 text-gray-500 text-xs">{item.hsn||"—"}</td>
                      <td className="px-3 py-3.5 text-gray-500 text-xs">{item.uom||"—"}</td>
                      <td className="px-3 py-3.5 text-right font-medium text-gray-700">{item.quantity}</td>
                      <td className="px-3 py-3.5 text-right text-gray-600">₹{item.sellRate.toLocaleString("en-IN")}</td>
                      <td className="px-3 py-3.5 text-right text-gray-600">₹{item.buyRate.toLocaleString("en-IN")}</td>
                      <td className="px-3 py-3.5 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">{item.gstRate}%</span>
                      </td>
                      <td className="px-3 py-3.5 text-right font-bold text-gray-800">₹{calcItemTotal(item).toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="px-6 sm:px-8 py-5 border-b border-gray-100 flex justify-end">
            <div className="w-64 space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium text-gray-800">₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">GST Amount (+)</span>
                <span className="font-medium text-gray-800">₹{taxAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="border-t border-gray-200 pt-2.5 flex justify-between">
                <span className="font-bold text-gray-900">Grand Total</span>
                <span className="font-bold text-gray-900 text-base">₹{grandTotal.toLocaleString("en-IN")}</span>
              </div>
              <p className="text-[10px] text-gray-400 italic text-right leading-relaxed">
                {numberToWords(Math.floor(grandTotal))} Rupees Only
              </p>
            </div>
          </div>

          <div className="px-6 sm:px-8 py-4 bg-gray-50 flex flex-col sm:flex-row items-center justify-end gap-3">
            <button disabled={isSubmitting}
              onClick={() => navigate("/sales-orders/create", { state: { salesOrderData } })}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
              ← Edit Order
            </button>
            <button onClick={handleConfirmAndSubmit} disabled={isSubmitting}
              className={["w-full sm:w-auto px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm",
                "min-w-[180px] flex items-center justify-center gap-2",
                isSubmitting ? "bg-primary/70 text-white cursor-not-allowed"
                  : "bg-primary text-white hover:opacity-90 hover:shadow-md active:scale-95"].join(" ")}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</> : "Confirm & Submit"}
            </button>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default SalesOrderPreview;