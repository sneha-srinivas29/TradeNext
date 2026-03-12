// import { useState } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import DashboardLayout from "@/components/Common/DashboardLayout";
// import {
//   Loader2, Paperclip, AlertCircle, AlertTriangle,
//   ArrowLeft, CheckCircle2, ChevronRight,
// } from "lucide-react";
// import { Link } from "react-router-dom";
// import { type LineItem } from "@/components/Common/LineItemsTable";

// const base = (import.meta as any).env.VITE_API_URL || "http://localhost:3001/api";

// // ─── Interface ────────────────────────────────────────────────
// interface ItemFulfillmentData {
//   salesOrderNo:       string;   
//   soInternalId:       string;   
//   supplierName:       string;
//   supplierBillNumber: string;
//   supplierBillDate:   string;
//   supplierBillFile:   File | null;
//   proofOfShipment:    File | null;
//   vehicleNumber:      string;
//   eWaybill:           File | null;
//   eWaybillNumber:     string;
//   itemFulfillmentDate: string;
//   lineItems:          LineItem[];
// }

// // ─── Helpers ──────────────────────────────────────────────────
// const toApiDate = (d: string) => {
//   if (!d) return "";
//   const [y, m, day] = d.split("-");
//   return y && m && day ? `${day}/${m}/${y}` : d;
// };

// const fmtDisplay = (d: string) =>
//   d
//     ? new Date(d).toLocaleDateString("en-IN", {
//         year: "numeric", month: "short", day: "numeric",
//       })
//     : "—";

// const getAuthMeta = () => {
//   try {
//     const raw = localStorage.getItem("user") ?? sessionStorage.getItem("user");
//     if (raw) {
//       const u = JSON.parse(raw);
//       return { email: String(u.email ?? ""), customerId: Number(u.netsuiteCustomerId ?? 0) };
//     }
//   } catch {}
//   return { email: "", customerId: 0 };
// };

// // ─── UI Helpers ───────────────────────────────────────────────
// const FileChip = ({ file }: { file: File }) => (
//   <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/8 border border-primary/20 px-2 py-0.5 rounded-full max-w-[200px]">
//     <Paperclip className="w-3 h-3 shrink-0" />
//     <span className="truncate">{file.name}</span>
//   </span>
// );

// const DetailRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
//   <div className="flex items-start gap-2 py-1">
//     <span className="text-muted-foreground text-sm w-48 shrink-0">{label}</span>
//     <span className="text-sm font-medium flex-1">{children || "—"}</span>
//   </div>
// );

// const SubmittingOverlay = () => (
//   <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
//     <div className="bg-white rounded-2xl shadow-2xl px-10 py-10 flex flex-col items-center gap-5 max-w-xs w-full mx-4 text-center">
//       <div className="relative w-20 h-20">
//         <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
//         <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
//         <div className="absolute inset-0 flex items-center justify-center">
//           <CheckCircle2 className="w-8 h-8 text-primary/30" />
//         </div>
//       </div>
//       <div className="space-y-1.5">
//         <p className="text-lg font-bold text-gray-900">Submitting Fulfillment</p>
//         <p className="text-sm text-gray-500 leading-relaxed">
//           Please wait while we process your item fulfillment. Do not close this page.
//         </p>
//       </div>
//       <div className="flex items-center gap-1.5">
//         {[0, 1, 2].map((i) => (
//           <div key={i} className="w-2 h-2 rounded-full bg-primary animate-bounce"
//             style={{ animationDelay: `${i * 0.15}s` }} />
//         ))}
//       </div>
//     </div>
//   </div>
// );

// // ─── Main Component ───────────────────────────────────────────
// const ItemFulfillmentPreview = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const ifData   = location.state as ItemFulfillmentData | null;

//   const [submitting,  setSubmitting]  = useState(false);
//   const [submitError, setSubmitError] = useState<string | null>(null);

//   if (!ifData) {
//     navigate("/item-fulfillments/create");
//     return null;
//   }

//   const calcItemTotal = (item: LineItem) => item.quantity * item.buyRate;
//   const subtotal      = ifData.lineItems.reduce((s, i) => s + calcItemTotal(i), 0);
//   const taxAmount     = ifData.lineItems.reduce((s, i) => s + (calcItemTotal(i) * i.gstRate) / 100, 0);
//   const grandTotal    = subtotal + taxAmount;

//   const handleConfirmSubmit = async () => {
//     setSubmitError(null);
//     setSubmitting(true);

//     try {
//       const { email, customerId } = getAuthMeta();

//       const body = {
//         customform: "372",
//         location:   "5",
//         trandate:   toApiDate(ifData.itemFulfillmentDate),

//         //   soid must be the NUMERIC internal ID (e.g. "4494745")
//         // NOT the doc number like "SO25/6370"
//         soid: ifData.soInternalId || ifData.salesOrderNo,

//         class: "",

//         custbody_sam_proof_of_shipment:
//           ifData.proofOfShipment ? [ifData.proofOfShipment.name] : [],

//         custbody_supplier_bill_attachment:
//           ifData.supplierBillFile ? [ifData.supplierBillFile.name] : [],

//         custbody_supplier_bill_date:   toApiDate(ifData.supplierBillDate),
//         custbody_supplier_bill_number: ifData.supplierBillNumber,
//         custbody_sam_payment_method:   "7",
//         custbody_sam_vechile_number_:  ifData.vehicleNumber,

//         custbodyeway_bill_no:       ifData.eWaybillNumber ?? "",
//         custbodyewaybillattachment: ifData.eWaybill ? [ifData.eWaybill.name] : [],

//         item: ifData.lineItems.map((li) => ({
//           item:                        li.itemId,
//           custcol_item_sale_rate:      li.sellRate,
//           custcol_sam_actual_rate:     li.buyRate,
//           itemreceive:                 "T",
//           quantity:                    li.quantity,
//           custcol_sam_actual_quantity: li.quantity,
//           if_description:              li.description ?? "",
//           item_unique_id:              li.item_unique_id || "",   //   e.g. "SO25/6370-001"
//         })),

//         proof_id: "",

//         meta_details: {
//           initiation_type:     "2",
//           created_by_employee: "",
//           email,
//           created_by_customer: customerId,
//           deviceType:          "2",
//         },
//       };

//       // Debug — remove in production
//       console.log("ItemFulfillment PAYLOAD →", JSON.stringify(body, null, 2));

//       const res = await fetch(`${base}/proxy/trade/v1/ItemFulfillmentCreation`, {
//         method:      "POST",
//         credentials: "include",
//         headers:     { "Content-Type": "application/json" },
//         body:        JSON.stringify(body),
//       });

//       const data = await res.json().catch(() => ({}));

//       const isNestedError =
//         data?.data &&
//         typeof data.data === "object" &&
//         "success" in data.data &&
//         data.data.success === false;

//       if (res.ok && data?.success === true && !isNestedError) {
//         navigate("/item-fulfillment/view", {
//           state: {
//             ...ifData,
//             status:             "Under Approval",
//             submissionResponse: data,
//           },
//         });
//       } else if (isNestedError) {
//         throw new Error(
//           data.data?.data?.message || data.data?.message || "Trade API error."
//         );
//       } else {
//         throw new Error(
//           data?.message ?? data?.data?.message ?? `HTTP ${res.status}`
//         );
//       }
//     } catch (err: any) {
//       setSubmitError(err?.message || "Submission failed");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <DashboardLayout>
//       {submitting && <SubmittingOverlay />}

//       <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-3 pb-6 space-y-4">

//         {/* Breadcrumb */}
//         <div className="flex items-center gap-2 text-xs text-gray-400">
//           <button
//             disabled={submitting}
//             onClick={() => navigate("/item-fulfillments/create", { state: ifData })}
//             className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
//             <ArrowLeft className="w-4 h-4 text-gray-600" />
//           </button>
//           <Link to="/" className="hover:text-gray-600">Dashboard</Link>
//           <ChevronRight className="w-3 h-3" />
//           <Link to="/item-fulfillments/listing" className="hover:text-gray-600">Item Fulfillments</Link>
//           <ChevronRight className="w-3 h-3" />
//           <Link to="/item-fulfillments/create" className="hover:text-gray-600">Create</Link>
//           <ChevronRight className="w-3 h-3" />
//           <span className="text-gray-700 font-semibold">Preview</span>
//         </div>

//         {/* Warning banner */}
//         <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
//           <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
//           <div>
//             <p className="text-sm font-semibold text-amber-800">Review carefully before submitting</p>
//             <p className="text-xs text-amber-600 mt-0.5">
//               Once submitted, this fulfillment will be processed and cannot be easily modified.
//             </p>
//           </div>
//         </div>

//         {/* Error banner */}
//         {submitError && (
//           <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
//             <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
//             <p className="flex-1 text-sm text-red-700">{submitError}</p>
//             <button
//               onClick={() => setSubmitError(null)}
//               className="text-xs text-red-400 hover:text-red-600 font-medium shrink-0">
//               Dismiss
//             </button>
//           </div>
//         )}

//         {/* Main card */}
//         <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

//           {/* Header */}
//           <div className="px-6 sm:px-8 py-5 border-b border-gray-100">
//             <h1 className="text-xl font-bold text-gray-900">Item Fulfillment Preview</h1>
//             {ifData.salesOrderNo && (
//               <p className="text-xs text-gray-400 mt-0.5">
//                 Sales Order: <span className="font-semibold">{ifData.salesOrderNo}</span>
//                 {ifData.soInternalId && (
//                   <span className="ml-2 font-mono text-gray-300">({ifData.soInternalId})</span>
//                 )}
//               </p>
//             )}
//           </div>

//           {/* Order details */}
//           <div className="px-6 sm:px-8 py-5 border-b border-gray-100 space-y-1">
//             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Order Details</p>
//             <DetailRow label="Sales Order No">{ifData.salesOrderNo}</DetailRow>
//             <DetailRow label="SO Internal ID">
//               <span className="font-mono text-xs text-gray-500">{ifData.soInternalId || "—"}</span>
//             </DetailRow>
//             <DetailRow label="Supplier Name">{ifData.supplierName}</DetailRow>
//             <DetailRow label="Item Fulfillment Date">{fmtDisplay(ifData.itemFulfillmentDate)}</DetailRow>
//             <DetailRow label="Supplier Bill Number">{ifData.supplierBillNumber}</DetailRow>
//             <DetailRow label="Supplier Bill Date">{fmtDisplay(ifData.supplierBillDate)}</DetailRow>
//             <DetailRow label="Vehicle Number">{ifData.vehicleNumber}</DetailRow>
//             {ifData.eWaybillNumber && (
//               <DetailRow label="E-Way Bill Number">{ifData.eWaybillNumber}</DetailRow>
//             )}
//           </div>

//           {/* Attachments */}
//           {(ifData.proofOfShipment || ifData.supplierBillFile || ifData.eWaybill) && (
//             <div className="px-6 sm:px-8 py-4 border-b border-gray-100">
//               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Attachments</p>
//               <div className="flex flex-wrap gap-2">
//                 {ifData.proofOfShipment  && <FileChip file={ifData.proofOfShipment} />}
//                 {ifData.supplierBillFile && <FileChip file={ifData.supplierBillFile} />}
//                 {ifData.eWaybill         && <FileChip file={ifData.eWaybill} />}
//               </div>
//             </div>
//           )}

//           {/* Line items */}
//           <div className="px-6 sm:px-8 py-5 border-b border-gray-100">
//             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Line Items</p>
//             <div className="overflow-x-auto rounded-xl border border-gray-200">
//               <table className="w-full text-sm min-w-[700px]">
//                 <thead>
//                   <tr className="bg-gray-50 border-b border-gray-200">
//                     {["#", "Product", "SO Line ID", "Qty", "Buy Rate", "Sell Rate", "GST", "Total"].map((h, i) => (
//                       <th
//                         key={h}
//                         className={`px-3 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider ${
//                           i >= 3 ? "text-right" : "text-left"
//                         }`}
//                       >
//                         {h}
//                       </th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-100">
//                   {ifData.lineItems.map((item, idx) => (
//                     <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
//                       <td className="px-3 py-3.5 text-gray-400 text-xs">{idx + 1}</td>
//                       <td className="px-3 py-3.5">
//                         <p className="font-semibold text-gray-800">{item.productName || "—"}</p>
//                         {item.description && (
//                           <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
//                         )}
//                       </td>
//                       <td className="px-3 py-3.5">
//                         {item.item_unique_id ? (
//                           <span className="inline-block text-xs font-mono text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full whitespace-nowrap">
//                             {item.item_unique_id}
//                           </span>
//                         ) : (
//                           <span className="text-red-400 text-xs font-medium">Missing ⚠️</span>
//                         )}
//                       </td>
//                       <td className="px-3 py-3.5 text-right font-medium text-gray-700">
//                         {item.quantity} {item.uom}
//                       </td>
//                       <td className="px-3 py-3.5 text-right text-gray-600">
//                         ₹{item.buyRate.toLocaleString("en-IN")}
//                       </td>
//                       <td className="px-3 py-3.5 text-right text-gray-600">
//                         ₹{item.sellRate.toLocaleString("en-IN")}
//                       </td>
//                       <td className="px-3 py-3.5 text-right">
//                         <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">
//                           {item.gstRate}%
//                         </span>
//                       </td>
//                       <td className="px-3 py-3.5 text-right font-bold text-gray-800">
//                         ₹{calcItemTotal(item).toLocaleString("en-IN")}
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             {/* Warn if any item is missing item_unique_id */}
//             {ifData.lineItems.some((li) => !li.item_unique_id) && (
//               <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
//                 <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
//                 <p className="text-xs text-red-700 font-medium">
//                   One or more line items are missing the SO Line ID (<span className="font-mono">item_unique_id</span>).
//                   Go back and re-fetch the Sales Order to fix this before submitting.
//                 </p>
//               </div>
//             )}
//           </div>

//           {/* Totals */}
//           <div className="px-6 sm:px-8 py-5 border-b border-gray-100 flex justify-end">
//             <div className="w-64 space-y-2.5">
//               <div className="flex justify-between text-sm">
//                 <span className="text-gray-500">Subtotal</span>
//                 <span className="font-medium text-gray-800">₹{subtotal.toLocaleString("en-IN")}</span>
//               </div>
//               <div className="flex justify-between text-sm">
//                 <span className="text-gray-500">GST Amount (+)</span>
//                 <span className="font-medium text-gray-800">₹{taxAmount.toLocaleString("en-IN")}</span>
//               </div>
//               <div className="border-t border-gray-200 pt-2.5 flex justify-between">
//                 <span className="font-bold text-gray-900">Grand Total</span>
//                 <span className="font-bold text-gray-900 text-base">
//                   ₹{grandTotal.toLocaleString("en-IN")}
//                 </span>
//               </div>
//             </div>
//           </div>

//           {/* Footer actions */}
//           <div className="px-6 sm:px-8 py-4 bg-gray-50 flex flex-col sm:flex-row items-center justify-end gap-3">
//             <button
//               disabled={submitting}
//               onClick={() => navigate("/item-fulfillments/create", { state: ifData })}
//               className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
//               ← Edit
//             </button>
//             <button
//               onClick={handleConfirmSubmit}
//               disabled={submitting || ifData.lineItems.some((li) => !li.item_unique_id)}
//               className="w-full sm:w-auto min-w-[180px] px-8 py-2.5 rounded-xl text-sm font-bold bg-primary text-white hover:opacity-90 hover:shadow-md active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
//               {submitting
//                 ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</>
//                 : "Confirm & Submit"
//               }
//             </button>
//           </div>

//         </div>
//       </div>
//     </DashboardLayout>
//   );
// };

// export default ItemFulfillmentPreview;

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "@/components/Common/DashboardLayout";
import {
  Loader2, Paperclip, AlertCircle, AlertTriangle,
  ArrowLeft, CheckCircle2, ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { type LineItem } from "@/components/Common/LineItemsTable";

const base = (import.meta as any).env.VITE_API_URL || "http://localhost:3001/api";

// ─── Interface ────────────────────────────────────────────────
interface ItemFulfillmentData {
  salesOrderNo:        string;   // doc number e.g. "SO25/6370"  — display & API lookup
  soInternalId:        string;   // numeric e.g. "4494745"       — used as soid in IF payload
  supplierName:        string;
  supplierBillNumber:  string;
  supplierBillDate:    string;
  supplierBillFile:    File | null;
  proofOfShipment:     File | null;
  vehicleNumber:       string;
  eWaybill:            File | null;
  eWaybillNumber:      string;
  itemFulfillmentDate: string;
  lineItems:           LineItem[];
}

// ─── Helpers ──────────────────────────────────────────────────
const toApiDate = (d: string) => {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return y && m && day ? `${day}/${m}/${y}` : d;
};

const fmtDisplay = (d: string) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        year: "numeric", month: "short", day: "numeric",
      })
    : "—";

const getAuthMeta = () => {
  try {
    const raw = localStorage.getItem("user") ?? sessionStorage.getItem("user");
    if (raw) {
      const u = JSON.parse(raw);
      return { email: String(u.email ?? ""), customerId: Number(u.netsuiteCustomerId ?? 0) };
    }
  } catch {}
  return { email: "", customerId: 0 };
};

// ─── UI Helpers ───────────────────────────────────────────────
const FileChip = ({ file }: { file: File }) => (
  <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/8 border border-primary/20 px-2 py-0.5 rounded-full max-w-[200px]">
    <Paperclip className="w-3 h-3 shrink-0" />
    <span className="truncate">{file.name}</span>
  </span>
);

const DetailRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-start gap-2 py-1">
    <span className="text-muted-foreground text-sm w-48 shrink-0">{label}</span>
    <span className="text-sm font-medium flex-1">{children || "—"}</span>
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
        <p className="text-lg font-bold text-gray-900">Submitting Fulfillment</p>
        <p className="text-sm text-gray-500 leading-relaxed">
          Please wait while we process your item fulfillment. Do not close this page.
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-2 h-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────
const ItemFulfillmentPreview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const ifData   = location.state as ItemFulfillmentData | null;

  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!ifData) {
    navigate("/item-fulfillments/create");
    return null;
  }

  const calcItemTotal = (item: LineItem) => item.quantity * item.buyRate;
  const subtotal      = ifData.lineItems.reduce((s, i) => s + calcItemTotal(i), 0);
  const taxAmount     = ifData.lineItems.reduce((s, i) => s + (calcItemTotal(i) * i.gstRate) / 100, 0);
  const grandTotal    = subtotal + taxAmount;

  const handleConfirmSubmit = async () => {
    setSubmitError(null);
    setSubmitting(true);

    try {
      const { email, customerId } = getAuthMeta();

      const body = {
        customform: "372",
        location:   "5",
        trandate:   toApiDate(ifData.itemFulfillmentDate),

        //   soid = numeric InternalID fetched from SO (e.g. "4494745")
        // Falls back to salesOrderNo (DocumentNumber) only if InternalID wasn't returned
        soid: ifData.soInternalId || ifData.salesOrderNo,

        class: "",

        custbody_sam_proof_of_shipment:
          ifData.proofOfShipment ? [ifData.proofOfShipment.name] : [],

        custbody_supplier_bill_attachment:
          ifData.supplierBillFile ? [ifData.supplierBillFile.name] : [],

        custbody_supplier_bill_date:   toApiDate(ifData.supplierBillDate),
        custbody_supplier_bill_number: ifData.supplierBillNumber,
        custbody_sam_payment_method:   "7",
        custbody_sam_vechile_number_:  ifData.vehicleNumber,

        custbodyeway_bill_no:       ifData.eWaybillNumber ?? "",
        custbodyewaybillattachment: ifData.eWaybill ? [ifData.eWaybill.name] : [],

        item: ifData.lineItems.map((li) => ({
          item:                        li.itemId,
          custcol_item_sale_rate:      li.sellRate,
          custcol_sam_actual_rate:     li.buyRate,
          itemreceive:                 "T",
          quantity:                    li.quantity,
          custcol_sam_actual_quantity: li.quantity,
          if_description:              li.description ?? "",
          item_unique_id:              li.item_unique_id || "",   // e.g. "SO25/6370-001"
        })),

        proof_id: "",

        meta_details: {
          initiation_type:     "2",
          created_by_employee: "",
          email,
          created_by_customer: customerId,
          deviceType:          "2",
        },
      };

      console.log("ItemFulfillment PAYLOAD →", JSON.stringify(body, null, 2));

      const res = await fetch(`${base}/proxy/trade/v1/ItemFulfillmentCreation`, {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      const isNestedError =
        data?.data &&
        typeof data.data === "object" &&
        "success" in data.data &&
        data.data.success === false;

      if (res.ok && data?.success === true && !isNestedError) {
        navigate("/item-fulfillment/view", {
          state: {
            ...ifData,
            status:             "Under Approval",
            submissionResponse: data,
          },
        });
      } else if (isNestedError) {
        throw new Error(
          data.data?.data?.message || data.data?.message || "Trade API error."
        );
      } else {
        throw new Error(
          data?.message ?? data?.data?.message ?? `HTTP ${res.status}`
        );
      }
    } catch (err: any) {
      setSubmitError(err?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      {submitting && <SubmittingOverlay />}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-3 pb-6 space-y-4">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <button
            disabled={submitting}
            onClick={() => navigate("/item-fulfillments/create", { state: ifData })}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <Link to="/" className="hover:text-gray-600">Dashboard</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/item-fulfillments/listing" className="hover:text-gray-600">Item Fulfillments</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/item-fulfillments/create" className="hover:text-gray-600">Create</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-700 font-semibold">Preview</span>
        </div>

        {/* Warning banner */}
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Review carefully before submitting</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Once submitted, this fulfillment will be processed and cannot be easily modified.
            </p>
          </div>
        </div>

        {/* Error banner */}
        {submitError && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="flex-1 text-sm text-red-700">{submitError}</p>
            <button
              onClick={() => setSubmitError(null)}
              className="text-xs text-red-400 hover:text-red-600 font-medium shrink-0">
              Dismiss
            </button>
          </div>
        )}

        {/* Main card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

          {/* Header */}
          <div className="px-6 sm:px-8 py-5 border-b border-gray-100">
            <h1 className="text-xl font-bold text-gray-900">Item Fulfillment Preview</h1>
            {ifData.salesOrderNo && (
              <p className="text-xs text-gray-400 mt-0.5">
                Sales Order: <span className="font-semibold">{ifData.salesOrderNo}</span>
                {ifData.soInternalId && (
                  <span className="ml-2 font-mono text-gray-300">(Internal ID: {ifData.soInternalId})</span>
                )}
              </p>
            )}
          </div>

          {/* Order details */}
          <div className="px-6 sm:px-8 py-5 border-b border-gray-100 space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Order Details</p>
            <DetailRow label="Sales Order No">{ifData.salesOrderNo}</DetailRow>
            {ifData.soInternalId && (
              <DetailRow label="SO Internal ID">
                <span className="font-mono text-xs text-gray-500">{ifData.soInternalId}</span>
              </DetailRow>
            )}
            <DetailRow label="Supplier Name">{ifData.supplierName}</DetailRow>
            <DetailRow label="Item Fulfillment Date">{fmtDisplay(ifData.itemFulfillmentDate)}</DetailRow>
            <DetailRow label="Supplier Bill Number">{ifData.supplierBillNumber}</DetailRow>
            <DetailRow label="Supplier Bill Date">{fmtDisplay(ifData.supplierBillDate)}</DetailRow>
            <DetailRow label="Vehicle Number">{ifData.vehicleNumber}</DetailRow>
            {ifData.eWaybillNumber && (
              <DetailRow label="E-Way Bill Number">{ifData.eWaybillNumber}</DetailRow>
            )}
          </div>

          {/* Attachments */}
          {(ifData.proofOfShipment || ifData.supplierBillFile || ifData.eWaybill) && (
            <div className="px-6 sm:px-8 py-4 border-b border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Attachments</p>
              <div className="flex flex-wrap gap-2">
                {ifData.proofOfShipment  && <FileChip file={ifData.proofOfShipment} />}
                {ifData.supplierBillFile && <FileChip file={ifData.supplierBillFile} />}
                {ifData.eWaybill         && <FileChip file={ifData.eWaybill} />}
              </div>
            </div>
          )}

          {/* Line items */}
          <div className="px-6 sm:px-8 py-5 border-b border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Line Items</p>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {["#", "Product", "SO Line ID", "Qty", "Buy Rate", "Sell Rate", "GST", "Total"].map((h, i) => (
                      <th
                        key={h}
                        className={`px-3 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider ${
                          i >= 3 ? "text-right" : "text-left"
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ifData.lineItems.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-3 py-3.5 text-gray-400 text-xs">{idx + 1}</td>
                      <td className="px-3 py-3.5">
                        <p className="font-semibold text-gray-800">{item.productName || "—"}</p>
                        {item.description && (
                          <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                        )}
                      </td>
                      <td className="px-3 py-3.5">
                        {item.item_unique_id ? (
                          <span className="inline-block text-xs font-mono text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                            {item.item_unique_id}
                          </span>
                        ) : (
                          <span className="text-red-400 text-xs font-medium">Missing ⚠️</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-right font-medium text-gray-700">
                        {item.quantity} {item.uom}
                      </td>
                      <td className="px-3 py-3.5 text-right text-gray-600">
                        ₹{item.buyRate.toLocaleString("en-IN")}
                      </td>
                      <td className="px-3 py-3.5 text-right text-gray-600">
                        ₹{item.sellRate.toLocaleString("en-IN")}
                      </td>
                      <td className="px-3 py-3.5 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">
                          {item.gstRate}%
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-right font-bold text-gray-800">
                        ₹{calcItemTotal(item).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Warn if any item is missing item_unique_id */}
            {ifData.lineItems.some((li) => !li.item_unique_id) && (
              <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
                <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 font-medium">
                  One or more line items are missing the SO Line ID (<span className="font-mono">item_unique_id</span>).
                  Go back and re-fetch the Sales Order to fix this before submitting.
                </p>
              </div>
            )}
          </div>

          {/* Totals */}
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
                <span className="font-bold text-gray-900 text-base">
                  ₹{grandTotal.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="px-6 sm:px-8 py-4 bg-gray-50 flex flex-col sm:flex-row items-center justify-end gap-3">
            <button
              disabled={submitting}
              onClick={() => navigate("/item-fulfillments/create", { state: ifData })}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              ← Edit
            </button>
            <button
              onClick={handleConfirmSubmit}
              disabled={submitting || ifData.lineItems.some((li) => !li.item_unique_id)}
              className="w-full sm:w-auto min-w-[180px] px-8 py-2.5 rounded-xl text-sm font-bold bg-primary text-white hover:opacity-90 hover:shadow-md active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</>
                : "Confirm & Submit"
              }
            </button>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default ItemFulfillmentPreview;