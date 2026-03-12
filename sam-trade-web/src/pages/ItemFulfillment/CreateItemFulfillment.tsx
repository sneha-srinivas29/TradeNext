import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import DashboardLayout from "@/components/Common/DashboardLayout";
import {
  ArrowLeft, ChevronRight, ChevronDown, Paperclip,
  X, Lock, Loader2, CheckCircle2, AlertCircle, Search,
} from "lucide-react";
import { type LineItem } from "@/components/Common/LineItemsTable";
import { cn } from "@/lib/utils";
import { readSoCache, writeSoCache } from "@/components/utils/cacheManager";
import { mapSo } from "@/components/SalesOrder/Listing/useTableFilters";

const base = (import.meta as any).env.VITE_API_URL || "http://localhost:3001/api";

// ─── Helpers ──────────────────────────────────────────────────
const toApiDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return y && m && d ? `${d}/${m}/${y}` : dateStr;
};

export const buildIfPayload = (fields: {
  salesOrderNo: string;
  soInternalId: string;
  itemFulfillmentDate: string;
  supplierBillDate: string;
  supplierBillNumber: string;
  vehicleNumber: string;
  eWaybillNumber: string;
  proofUrl: string;
  eWaybillUrl: string;
  lineItems: LineItem[];
  userEmail?: string;
  customerId?: number;
  supplierBillUrl?: string;
}) => ({
  customform: "372",
  location: "5",
  trandate: toApiDate(fields.itemFulfillmentDate),
  soid: fields.soInternalId,
  class: "",
  custbody_sam_proof_of_shipment: fields.proofUrl ? [fields.proofUrl] : [],
  custbody_supplier_bill_attachment: fields.supplierBillUrl ? [fields.supplierBillUrl] : [],
  custbody_supplier_bill_date: toApiDate(fields.supplierBillDate),
  custbody_supplier_bill_number: fields.supplierBillNumber,
  custbody_sam_payment_method: "7",
  custbody_sam_vechile_number_: fields.vehicleNumber,
  custbodyeway_bill_no: fields.eWaybillNumber,
  custbodyewaybillattachment: fields.eWaybillUrl ? [fields.eWaybillUrl] : [],
  item: fields.lineItems.map((li) => ({
    item: li.itemId,
    custcol_item_sale_rate: li.sellRate,
    custcol_sam_actual_rate: li.buyRate,
    itemreceive: "T",
    quantity: li.quantity,
    custcol_sam_actual_quantity: li.quantity,
    if_description: li.description,
    item_unique_id: li.item_unique_id || "",
  })),
  proof_id: "",
  meta_details: {
    initiation_type: "2",
    created_by_employee: "",
    email: fields.userEmail ?? "",
    created_by_customer: fields.customerId ?? 0,
    deviceType: "2",
  },
});

// ─── SO listing record ────────────────────────────────────────
interface SoListItem {
  doc_number: string;
  internal_id: string;
  supplier: string;
  status: string;
  items: string[];
}

// mapSo outputs: { id, internalId, vendor, status, … }
const fromCached = (o: any): SoListItem => ({
  doc_number: String(o.id ?? o.DocumentNumber ?? o.doc_number ?? ""),
  internal_id: String(o.internalId ?? o.InternalID ?? o.internal_id ?? ""),
  supplier: String(o.vendor ?? o.Supplier ?? o.supplier ?? ""),
  status: String(o.status ?? o.Status ?? ""),
  items: Array.isArray(o.items) ? o.items : [],
});

// ─── Shared styles ────────────────────────────────────────────
const inputCls = "w-full h-9 px-3 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 placeholder:text-gray-400 transition-colors";
const lockedInputCls = "w-full h-9 px-3 border border-gray-200 rounded-md text-sm text-gray-500 bg-gray-50 cursor-not-allowed select-none flex items-center gap-1.5";

const Label = ({ children, required, locked }: {
  children: React.ReactNode; required?: boolean; locked?: boolean;
}) => (
  <label className="flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
    {children}
    {required && <span className="text-red-500 font-bold">*</span>}
    {locked && <Lock className="w-2.5 h-2.5 text-gray-400" />}
  </label>
);

// ─── Section Header (like Image 3) ───────────────────────────
const SectionHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-gray-100 border-y border-gray-200 text-gray-600 px-6 py-2 mt-1">
    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">{children}</h3>
  </div>
);

// ─── File Upload ──────────────────────────────────────────────
const FileInput = ({ label, required, value, onChange, hint }: {
  label: string; required?: boolean; value: File | null;
  onChange: (f: File | null) => void; hint?: string;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <Label required={required}>{label}</Label>
      <div
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex items-center gap-2 px-3 border rounded-md bg-white cursor-pointer transition-colors min-h-[36px]",
          value ? "border-gray-400 bg-gray-50" : "border-gray-300 hover:border-gray-400"
        )}
      >
        {value ? (
          <>
            <Paperclip className="w-3 h-3 text-gray-500 shrink-0" />
            <span className="text-xs text-gray-700 flex-1 truncate font-medium">{value.name}</span>
            <button type="button" onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="text-gray-400 hover:text-red-500 transition-colors shrink-0">
              <X className="w-3 h-3" />
            </button>
          </>
        ) : (
          <>
            <Paperclip className="w-3 h-3 text-gray-400 shrink-0" />
            <span className="text-xs text-gray-400 flex-1">
              {hint || "Upload file…"}
            </span>
          </>
        )}
      </div>
      <input ref={inputRef} type="file" className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
    </div>
  );
};

// ─── SO Searchable Dropdown ───────────────────────────────────
const SoDropdown = ({ soList, listLoading, listError, selected, onSelect, onReset }: {
  soList: SoListItem[];
  listLoading: boolean;
  listError: string | null;
  selected: SoListItem | null;
  onSelect: (so: SoListItem) => void;
  onReset: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = soList.filter((s) =>
    s.doc_number.toLowerCase().includes(search.toLowerCase()) ||
    s.supplier.toLowerCase().includes(search.toLowerCase())
  );

  if (selected) {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-300 rounded-md px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
          <div className="min-w-0">
            <span className="text-sm font-bold text-gray-900">{selected.doc_number}</span>
            <span className="text-xs text-gray-500 ml-2 truncate">{selected.supplier}</span>
          </div>
        </div>
        <button type="button" onClick={onReset}
          className="text-xs text-blue-600 hover:text-blue-800 font-semibold shrink-0 ml-2 underline">
          Change
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      {listLoading ? (
        <div className="flex items-center gap-2 h-9 px-3 border border-gray-300 rounded-md bg-gray-50">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
          <span className="text-sm text-gray-400">Loading sales orders…</span>
        </div>
      ) : listError ? (
        <div className="flex items-start gap-2 bg-red-50 border border-red-300 rounded-md px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{listError}</p>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className={cn(
              inputCls,
              "flex items-center justify-between text-left",
              open && "border-gray-400 ring-1 ring-gray-400"
            )}
          >
            <span className="text-gray-400 text-sm">Select a Sales Order…</span>
            <ChevronDown className={cn("w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform", open && "rotate-180")} />
          </button>

          {open && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg overflow-hidden">
              <div className="px-2.5 py-2 border-b border-gray-100 flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search SO number or supplier…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 text-sm outline-none placeholder:text-gray-400 bg-transparent"
                />
              </div>
              <ul className="max-h-52 overflow-y-auto">
                {filtered.length === 0 ? (
                  <li className="px-4 py-5 text-center text-sm text-gray-400">No results</li>
                ) : (
                  filtered.map((so) => (
                    <li key={so.internal_id || so.doc_number} className="border-b border-gray-50 last:border-0">
                      <button
                        type="button"
                        onClick={() => { onSelect(so); setOpen(false); setSearch(""); }}
                        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors text-left gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{so.doc_number}</p>
                          <p className="text-xs text-gray-500 truncate">{so.supplier}</p>
                        </div>
                        <span className={cn(
                          "shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded whitespace-nowrap border",
                          so.status === "Pending Fulfillment" ? "bg-blue-50 text-blue-700 border-blue-200"
                            : so.status === "Partially Fulfilled" ? "bg-amber-50 text-amber-700 border-amber-200"
                              : so.status === "Billed" ? "bg-green-50 text-green-700 border-green-200"
                                : so.status === "Pending Approval" ? "bg-purple-50 text-purple-700 border-purple-200"
                                  : "bg-gray-50 text-gray-600 border-gray-200"
                        )}>
                          {so.status}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─── E-Way Bill collapsible ───────────────────────────────────
const EWayBillSection = ({ eWaybillNumber, setEWaybillNumber, eWaybill, setEWaybill }: {
  eWaybillNumber: string; setEWaybillNumber: (v: string) => void;
  eWaybill: File | null; setEWaybill: (f: File | null) => void;
}) => {
  const [open, setOpen] = useState(false);
  const hasContent = eWaybillNumber || eWaybill;
  return (
    <div className={cn("border rounded-md overflow-hidden", hasContent ? "border-gray-300" : "border-gray-200")}>
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">E-Way Bill</span>
          {hasContent
            ? <span className="text-[10px] bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded">Filled</span>
            : <span className="text-[10px] text-gray-400 font-medium">(Optional)</span>
          }
        </div>
        <ChevronDown className={cn("w-3.5 h-3.5 text-gray-500 transition-transform duration-150", open && "rotate-180")} />
      </button>
      <div className={cn("grid transition-all duration-150", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className="overflow-hidden">
          <div className="px-3 pb-3 pt-2.5 border-t border-gray-200 grid grid-cols-2 gap-3">
            <div>
              <Label>E-Way Bill Number</Label>
              <input type="text" placeholder="Enter number"
                value={eWaybillNumber} onChange={(e) => setEWaybillNumber(e.target.value)} className={inputCls} />
            </div>
            <FileInput label="E-Way Bill Attachment" value={eWaybill} onChange={setEWaybill} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Line Item Card (Image 2 style) ──────────────────────────
const LineItemCard = ({ item, index, onChange, onRemove, canRemove }: {
  item: LineItem; index: number;
  onChange: (updated: LineItem) => void;
  onRemove: () => void; canRemove: boolean;
}) => {
  const available = item.quantityAvailable ?? item.quantity ?? 0;
  const tolerance = 0; // from SO if available

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-100 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-gray-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
            {index + 1}
          </span>
          <span className="text-sm font-bold text-gray-800">{item.productName || "—"}</span>
          {item.item_unique_id && (
            <span className="text-[10px] font-mono text-gray-500 bg-white border border-gray-300 px-1.5 py-0.5 rounded">
              {item.item_unique_id}
            </span>
          )}
        </div>
        {canRemove && (
          <button type="button" onClick={onRemove}
            className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
            Remove
          </button>
        )}
      </div>

      <div className="px-3 py-3 space-y-3">
        {/* Balance + Tolerance row (Image 2 style) */}
        <div className="flex gap-4">
          <div>
            <p className="text-xs text-gray-500">Balance Quantity</p>
            <p className="text-sm font-bold text-gray-900">{available.toLocaleString("en-IN")} {item.uom || "KG(S)"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Tolerance Quantity</p>
            <p className="text-sm font-bold text-gray-900">{tolerance}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-gray-500">Buy Rate</p>
            <p className="text-sm font-bold text-gray-900">₹{Number(item.buyRate || 0).toLocaleString("en-IN")}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Sell Rate</p>
            <p className="text-sm font-bold text-gray-900">₹{Number(item.sellRate || 0).toLocaleString("en-IN")}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">GST</p>
            <p className="text-sm font-bold text-gray-900">{item.gstRate ?? 18}%</p>
          </div>
        </div>

        {/* Quantity Needed (editable — matching Image 2) */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label required>Quantity Needed</Label>
            <div className={cn(
              "flex items-center border rounded-md overflow-hidden bg-white focus-within:ring-1",
              item.quantity > 0 && item.quantity >= available
                ? "border-amber-400 focus-within:ring-amber-300"
                : "border-gray-300 focus-within:ring-gray-400 focus-within:border-gray-400"
            )}>
              <input
                type="number"
                min={0}
                max={available}
                placeholder="Enter quantity needed"
                value={item.quantity || ""}
                onChange={(e) => { const val = parseFloat(e.target.value) || 0; onChange({ ...item, quantity: Math.min(val, available) }); }}
                className="flex-1 h-9 px-3 text-sm outline-none bg-transparent placeholder:text-gray-400"
              />
              <span className="px-2.5 h-9 flex items-center text-xs font-bold text-gray-500 bg-gray-50 border-l border-gray-300">
                {item.uom || "KG(S)"}
              </span>
            </div>
            {item.quantity > 0 && item.quantity >= available && (
              <p className="text-[11px] text-amber-600 font-medium mt-0.5">Max available: {available.toLocaleString("en-IN")} {item.uom || "KG(S)"}</p>
            )}
          </div>

          {/* Item Description (Image 2 style) */}
          <div>
            <Label>Item Description <span className="normal-case text-gray-400 font-normal">(Optional)</span></Label>
            <input
              type="text"
              placeholder="Enter item description"
              value={item.description}
              onChange={(e) => onChange({ ...item, description: e.target.value })}
              className={inputCls}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Field Row helper ─────────────────────────────────────────
const FieldRow = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-6 py-3">{children}</div>
);

// ─── Main Component ───────────────────────────────────────────
const CreateItemFulfillment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = location.state as Record<string, any> | null;

  const [soList, setSoList] = useState<SoListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedSo, setSelectedSo] = useState<SoListItem | null>(null);

  const [soFetched, setSoFetched] = useState<boolean>(
    !!(prefill?.lineItems?.length && prefill.lineItems[0]?.item_unique_id)
  );
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [salesOrderNo, setSalesOrderNo] = useState<string>(prefill?.salesOrderNo ?? "");
  const [soInternalId, setSoInternalId] = useState<string>(prefill?.soInternalId ?? "");
  const [supplierName, setSupplierName] = useState<string>(prefill?.supplierName ?? "");
  const [supplierBillNumber, setSupplierBillNumber] = useState<string>(prefill?.supplierBillNumber ?? "");
  const [supplierBillDate, setSupplierBillDate] = useState<string>(prefill?.supplierBillDate ?? "");
  const [supplierBillFile, setSupplierBillFile] = useState<File | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState<string>(prefill?.vehicleNumber ?? "");
  const [eWaybillNumber, setEWaybillNumber] = useState<string>(prefill?.eWaybillNumber ?? "");
  const [eWaybill, setEWaybill] = useState<File | null>(null);
  const [proofOfShipment, setProofOfShipment] = useState<File | null>(null);
  const [itemFulfillmentDate, setItemFulfillmentDate] = useState<string>(prefill?.itemFulfillmentDate ?? "");
  const [lineItems, setLineItems] = useState<LineItem[]>(
    prefill?.lineItems?.length ? prefill.lineItems : []
  );

  useEffect(() => {
    const load = async () => {
      try {
        const cached = readSoCache();
        let list: SoListItem[] = [];

        if (cached?.orders?.length) {
          list = cached.orders.map(fromCached).filter((o) => !!o.internal_id);
        }

        if (!list.length) {
          const contractId = localStorage.getItem("selectedContract") ?? "";
          const url = contractId
            ? `${base}/proxy/trade/v1/so-listing?id=${encodeURIComponent(contractId)}`
            : `${base}/proxy/trade/v1/so-listing`;
          const res = await fetch(url, { credentials: "include" });
          const json = await res.json().catch(() => null);
          const raw: any[] = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
          if (raw.length) writeSoCache(raw.map(mapSo));
          list = raw.map((o: any) => ({
            doc_number: String(o.DocumentNumber ?? o.doc_number ?? ""),
            internal_id: String(o.InternalID ?? o.internal_id ?? ""),
            supplier: String(o.Supplier ?? o.supplier ?? ""),
            status: String(o.Status ?? o.status ?? ""),
            items: Array.isArray(o.items) ? o.items : [],
          }));
        }

        setSoList(list);
        if (prefill?.salesOrderNo) {
          const match = list.find((s) => s.doc_number === prefill.salesOrderNo);
          if (match) setSelectedSo(match);
        }
      } catch {
        setListError("Failed to load sales orders. Please visit the SO listing page first.");
      } finally {
        setListLoading(false);
      }
    };
    load();
  }, []);

  const resetSo = () => {
    setSelectedSo(null); setSoFetched(false); setLineItems([]);
    setSalesOrderNo(""); setSoInternalId(""); setSupplierName(""); setFetchError(null);
  };

  const fetchSoDetails = useCallback(async (so: SoListItem) => {
    setFetchLoading(true); setFetchError(null); setSoFetched(false);
    try {
      const res = await fetch(
        `${base}/proxy/trade/v1/sales-order-summary?SoID=${encodeURIComponent(so.internal_id)}`,
        { credentials: "include" }
      );
      const data = await res.json().catch(() => null);
      if (!data) throw new Error("Empty response from server.");

      let soRecord: any;
      if (data?.soRecord && typeof data.soRecord === "object") {
        soRecord = data.soRecord;
      } else if (Array.isArray(data)) {
        soRecord = data.find((r: any) => String(r.InternalID) === String(so.internal_id)) ?? data[0];
      } else {
        soRecord = data;
      }
      if (!soRecord) throw new Error("Sales Order details not found.");

      const items: any[] = soRecord.items ?? data.items ?? [];
      if (!items.length) throw new Error("No line items found for this Sales Order.");

      const resolvedDocNumber = String(soRecord.DocumentNumber ?? so.doc_number ?? "");
      const resolvedInternalId = String(soRecord.InternalID ?? so.internal_id ?? "");
      const resolvedSupplier = String(soRecord.Supplier ?? so.supplier ?? "");

      setSalesOrderNo(resolvedDocNumber);
      setSoInternalId(resolvedInternalId);
      if (resolvedSupplier) setSupplierName(resolvedSupplier);

      setSelectedSo((prev) =>
        prev ? {
          ...prev,
          doc_number: resolvedDocNumber || prev.doc_number,
          supplier: resolvedSupplier || prev.supplier,
          internal_id: resolvedInternalId || prev.internal_id,
        } : prev
      );

      setLineItems(items.map((li: any, idx: number) => ({
        id: idx + 1,
        itemId: String(li.itemNameID ?? ""),
        item_unique_id: String(li.item_unique_id ?? ""),
        productName: String(li.itemName ?? ""),
        hsn: "", hsnId: "", uom: String(li.uom ?? "KG(S)"),
        uomId: "", uomOptions: [], uomLoading: false,
        description: String(li.description ?? ""),
        quantity: Number(li.availablequantity ?? li.quantity ?? 0),
        quantityAvailable: Number(li.availablequantity ?? 0),
        sellRate: Number(li.sellrate ?? 0),
        buyRate: Number(li.buyrate ?? 0),
        gstRate: 18,
      })));

      setSoFetched(true);
    } catch (e: any) {
      setFetchError(e?.message || "Failed to load SO details. Please try again.");
      setSelectedSo(null);
    } finally {
      setFetchLoading(false);
    }
  }, []);

  const handleSelectSo = (so: SoListItem) => { setSelectedSo(so); fetchSoDetails(so); };
  const updateLineItem = (idx: number, updated: LineItem) =>
    setLineItems((prev) => prev.map((li, i) => (i === idx ? updated : li)));
  const removeLineItem = (idx: number) =>
    setLineItems((prev) => prev.filter((_, i) => i !== idx));

  const handleCancel = () => navigate("/item-fulfillments/listing");
  const canSave = soFetched && lineItems.length > 0 && !!salesOrderNo;

  const handleSave = () => {
    if (!canSave) return;
    navigate("/item-fulfillments/preview", {
      state: {
        salesOrderNo, soInternalId, supplierName,
        supplierBillNumber, supplierBillDate, supplierBillFile,
        vehicleNumber, eWaybillNumber, eWaybill,
        proofOfShipment, itemFulfillmentDate, lineItems,
      },
    });
  };

  return (
    <DashboardLayout>
      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 mb-3">
        <button onClick={handleCancel} className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <ol className="flex text-xs gap-1 text-gray-400 items-center">
          <li><Link to="/" className="text-blue-600 hover:underline">Dashboard</Link></li>
          <ChevronRight className="w-3 h-3" />
          <li><Link to="/item-fulfillments/listing" className="text-blue-600 hover:underline">Item Fulfillments</Link></li>
          <ChevronRight className="w-3 h-3" />
          <li className="text-gray-600 font-medium">Raise</li>
        </ol>
      </div>

      <div className="pb-10">
        <div className="bg-white border border-gray-200 overflow-hidden">

          {/* ── Page Title ── */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h1 className="text-base font-bold text-gray-900">Raise Item Fulfillment</h1>
              <p className="text-xs text-gray-500 mt-0.5">Select a Sales Order, then fill shipment details</p>
            </div>
          </div>

          {/* ── SO Selection ── */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 rounded-full bg-gray-800 text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
              <Label required>Select Sales Order</Label>
            </div>
            <SoDropdown
              soList={soList} listLoading={listLoading} listError={listError}
              selected={selectedSo} onSelect={handleSelectSo} onReset={resetSo}
            />
            {fetchLoading && (
              <div className="flex items-center gap-2 mt-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" />
                <p className="text-xs text-gray-500">Loading SO details…</p>
              </div>
            )}
            {fetchError && (
              <div className="flex items-start gap-1.5 mt-2 text-xs text-red-600">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <p>{fetchError}</p>
              </div>
            )}
            {soFetched && salesOrderNo && !fetchLoading && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-green-700">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <p>{lineItems.length} item{lineItems.length !== 1 ? "s" : ""} loaded from <strong>{salesOrderNo}</strong>{supplierName && ` · ${supplierName}`}</p>
              </div>
            )}
          </div>

          {/* ── Empty state ── */}
          {!soFetched && !fetchLoading && !selectedSo && (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-600">Select a Sales Order to begin</p>
              <p className="text-xs text-gray-400 mt-1">Items, quantities and rates will be auto-filled</p>
            </div>
          )}

          {/* ── Full form ── */}
          {soFetched && (
            <>
              {/* ORDER DETAILS */}
              <SectionHeader>Order Details</SectionHeader>
              <FieldRow>
                <div>
                  <Label locked required>Sales Order No</Label>
                  <div className={lockedInputCls}>{salesOrderNo || "—"}</div>
                </div>
                <div>
                  <Label>Supplier Name</Label>
                  <input placeholder="Enter supplier name" value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)} className={inputCls} />
                </div>
              </FieldRow>

              {/* SHIPMENT */}
              <SectionHeader>Shipment</SectionHeader>
              <FieldRow>
                <div>
                  <Label required>Item Fulfillment Date</Label>
                  <input type="date" value={itemFulfillmentDate}
                    onChange={(e) => setItemFulfillmentDate(e.target.value)} className={inputCls} />
                </div>
                <FileInput label="Proof of Shipment" required value={proofOfShipment}
                  onChange={setProofOfShipment} hint="Upload PNG, JPG, PDF…" />
              </FieldRow>

              {/* SUPPLIER BILL */}
              <SectionHeader>Supplier Bill</SectionHeader>
              <FieldRow>
                <div>
                  <Label required>Supplier Bill Date</Label>
                  <input type="date" value={supplierBillDate}
                    onChange={(e) => setSupplierBillDate(e.target.value)} className={inputCls} />
                </div>
                <FileInput label="Supplier Bill Attachment" required value={supplierBillFile}
                  onChange={setSupplierBillFile} hint="Upload PNG, JPG, PDF…" />
                <div className="col-span-2">
                  <Label required>Supplier Bill Number</Label>
                  <input placeholder="Enter supplier bill number" value={supplierBillNumber}
                    onChange={(e) => setSupplierBillNumber(e.target.value)} className={inputCls} />
                </div>
              </FieldRow>

              {/* TRANSPORT */}
              <SectionHeader>Transport</SectionHeader>
              <div className="px-6 py-3 border-b border-gray-100 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label required>Vehicle Number</Label>
                    <input placeholder="Enter vehicle number" value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)} className={inputCls} />
                  </div>
                </div>
                <EWayBillSection
                  eWaybillNumber={eWaybillNumber} setEWaybillNumber={setEWaybillNumber}
                  eWaybill={eWaybill} setEWaybill={setEWaybill}
                />
              </div>

              {/* ITEMS */}
              <SectionHeader>Items ({lineItems.length})</SectionHeader>
              <div className="px-6 py-3 space-y-2.5">
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-xs text-amber-800">
                  <Lock className="w-3 h-3 shrink-0 mt-0.5 text-amber-600" />
                  <span>Rates and item details are locked from <strong>{salesOrderNo}</strong>. Enter the quantity to fulfil.</span>
                </div>
                <div className="space-y-2">
                  {lineItems.map((li, idx) => (
                    <LineItemCard
                      key={li.id}
                      item={li}
                      index={idx}
                      onChange={(updated) => updateLineItem(idx, updated)}
                      onRemove={() => removeLineItem(idx)}
                      canRemove={lineItems.length > 1}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Footer actions ── */}
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
            <button onClick={handleCancel}
              className="px-4 py-2 rounded-md text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="px-5 py-2 rounded-md text-sm font-semibold text-white bg-gray-900 hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Save &amp; Preview →
            </button>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateItemFulfillment;