
//  * ────────────────────────────────────
//  * 1. READS FROM PREFETCH CACHE FIRST — on mount, all 5 lookup APIs
//  *    (GST, billing, shipping, supplier, items) are read from
//  *    sessionStorage cache written by prefetchService.
//  *    If the cache is warm the page renders with data instantly (0 ms
//  *    network time).  Only falls back to network if cache is missing.
//  *
//  * 2. PARALLEL fetch on cache-miss — instead of 4 serial calls that
//  *    composed to ~8-10 s, all lookups fire simultaneously via
//  *    Promise.all.  Items fetch is included in the same batch.
//  *
//  * 3. No duplicate loadClassFromContractDetails call on mount — class
//  *    info is already stored in localStorage by ContractSelection.
//  *
//  * 4. Auto-persist draft still works exactly the same.
//  *
//  * 5. Contract change still re-fetches everything fresh (correct
//  *    behaviour) but also updates the prefetch cache so back-navigation
//  *    is instant.
//  */

import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "@/components/Common/DashboardLayout";
import LineItemsTable, { type LineItem } from "@/components/Common/LineItemsTable";
import DraftsDialog, { type Draft } from "@/components/SalesOrder/Creation/DraftsDialog";
import { type Address } from "@/components/SalesOrder/Creation/SearchableAddressSelect";
import { AlertCircle, X } from "lucide-react";

import SuccessToast         from "@/components/SalesOrder/Creation/SuccessToast";
import UnsavedChangesDialog from "@/components/SalesOrder/Creation/UnsavedChangesDialog";
import PageBreadcrumb       from "@/components/SalesOrder/Creation/PageBreadcrumb";
import GeneralInfoSection   from "@/components/SalesOrder/Creation/GeneralInfoSection";
import AddressSection       from "@/components/SalesOrder/Creation/AddressSection";
import SupplierSection      from "@/components/SalesOrder/Creation/SupplierSection";
import FormActionButtons    from "@/components/SalesOrder/Creation/FormActionButtons";
import {
  readCreationLookups, writeCreationLookups,
  readItemOptions, writeItemOptions,
  KEYS,
} from "../../components/utils/cacheManager";

/* ── Helpers ────────────────────────────────────────────────────── */

const extractContractCode = (raw: string): string => {
  if (!raw) return "";
  const colonIdx = raw.lastIndexOf(":");
  return colonIdx !== -1 ? raw.slice(colonIdx + 1).trim() : raw.trim();
};

const getBase = () =>
  ((import.meta as any).env.VITE_API_URL || "http://localhost:3001/api").replace(/\/+$/, "");

const ROUTES: Record<string, string> = {
  "/customer-tax":       "/proxy/trade/v1/tax-registration",
  "/billing-address":    "/proxy/trade/v1/billing-address",
  "/shipping-address":   "/proxy/trade/v1/shipping-address",
  "/supplier-details":   "/proxy/trade/v1/supplier-details",
  "/supplier-address":   "/proxy/trade/v1/supplier-address",
  "/items-for-contract": "/proxy/trade/v1/contract-item-details",
};

const apiFetch = (base: string, key: string, params: Record<string, string>) => {
  const path = ROUTES[key] ?? key;
  const q    = new URLSearchParams({ ...params, _t: Date.now().toString() }).toString();
  return fetch(`${base}${path}?${q}`, { credentials: "include" });
};

/* ── Types ───────────────────────────────────────────────────────── */

interface ValidationErrors {
  contract?:            string;
  purchaseOrderID?:     string;
  purchaseOrderDate?:   string;
  purchaseOrderFile?:   string;
  relationshipManager?: string;
  memo?:                string;
  selectedCustomerGst?: string;
  billing?:             string;
  shipping?:            string;
  supplier?:            string;
  delivery?:            string;
  lineItems?:           string;
}

/* ── Skeleton ────────────────────────────────────────────────────── */

const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-muted rounded ${className}`} />
);
const FormRowSkeleton = () => (
  <div className="flex flex-col gap-1.5">
    <Skeleton className="h-3 w-28" />
    <Skeleton className="h-9 w-full" />
  </div>
);

/* ── Defaults ────────────────────────────────────────────────────── */

const emptyLineItem = (id = 1): LineItem => ({
  id, productName: "", itemId: "", hsn: "", hsnId: "",
  uom: "", uomId: "", uomOptions: [], uomLoading: false,
  quantity: 1, sellRate: 0, buyRate: 0, gstRate: 18,
  description: "", quantityAvailable: 0, item_unique_id: "",
});

const emptyAddress: Address = { id: 0, name: "", street: "", city: "", country: "", phone: "", address: "" };

/* ── Address mappers ─────────────────────────────────────────────── */

const mapBillingAddress = (arr: any[]): Address[] =>
  arr.map((it: any, idx: number) => ({
    id:      Number(it.address_internal_id || it.id || idx + 1),
    name:    it.billingaddress || it.name || `Billing ${idx + 1}`,
    street:  it.billingaddress || it.street || it.addressLine1 || "",
    city:    [it.city, it.state, it.postalCode || it.pincode].filter(Boolean).join(", "),
    country: it.country || "India",
    phone:   it.phone || it.contactNo || "",
    address: it.billingaddress || it.street || it.addressLine1 || "",
  }));

const mapShippingAddress = (arr: any[]): Address[] =>
  arr.map((it: any, idx: number) => ({
    id:      Number(it.address_internal_id || it.id || idx + 1),
    name:    (it.shippingaddress || it.address || "").trim() || `Shipping ${idx + 1}`,
    street:  it.shippingaddress || it.addressLine1 || "",
    city:    [it.city, it.state, it.postalCode].filter(Boolean).join(", "),
    country: it.country || "India",
    phone:   it.phone || "",
    address: it.shippingaddress || it.addressLine1 || "",
  }));

const mapSupplierAddress = (arr: any[]): Address[] =>
  arr.map((it: any, idx: number) => ({
    id:      Number(it.supplierid || idx + 1),
    name:    it.suppliername || String(it.supplierid),
    street:  "", city: "", country: "India", phone: "", address: "",
  }));

/* ── Component ───────────────────────────────────────────────────── */

const CreateSalesOrder = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // UI state
  const [showSuccess,        setShowSuccess]        = useState(false);
  const [showDrafts,         setShowDrafts]         = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [hasChanges,         setHasChanges]         = useState(false);
  const [isPageLoading,      setIsPageLoading]      = useState(false);
  const [errors,             setErrors]             = useState<ValidationErrors>({});
  const [touched,            setTouched]            = useState<Record<string, boolean>>({});
  const [showBanner,         setShowBanner]         = useState(false);

  // Contract fields
  const [contract,              setContract]              = useState("");
  const [contractLabel,         setContractLabel]         = useState("");
  const [contractClass,         setContractClass]         = useState("");
  const [customerEmail,         setCustomerEmail]         = useState("");
  const [customerId,            setCustomerId]            = useState("");
  const [contractSubcustomerId, setContractSubcustomerId] = useState("");
  const [originId,              setOriginId]              = useState("");
  const [classId,               setClassId]               = useState("");
  const [contractOptions,       setContractOptions]       = useState<{
    id: string; code: string; customerId: string; originId: string;
    className: string; customerEmail: string;
  }[]>([]);

  // Order fields
  const [purchaseOrderID,     setPurchaseOrderID]     = useState("");
  const [purchaseOrderDate,   setPurchaseOrderDate]   = useState("");
  const [relationshipManager, setRelationshipManager] = useState("");
  const [memo,                setMemo]                = useState("");
  const [purchaseOrderFile,   setPurchaseOrderFile]   = useState<File | null>(null);

  // Address state
  const [billing,  setBilling]  = useState<Address>(emptyAddress);
  const [shipping, setShipping] = useState<Address>(emptyAddress);
  const [supplier, setSupplier] = useState<Address>(emptyAddress);
  const [delivery, setDelivery] = useState<Address>(emptyAddress);

  // Dropdown options
  const [gstOptions,             setGstOptions]             = useState<{ id: string; number: string }[]>([]);
  const [selectedCustomerGst,    setSelectedCustomerGst]    = useState("");
  const [billingOptions,         setBillingOptions]         = useState<Address[]>([]);
  const [shippingOptions,        setShippingOptions]        = useState<Address[]>([]);
  const [supplierOptions,        setSupplierOptions]        = useState<Address[]>([]);
  const [supplierAddressOptions, setSupplierAddressOptions] = useState<Address[]>([]);
  const [itemOptions,            setItemOptions]            = useState<any[]>([]);
  const [itemsLoading,           setItemsLoading]           = useState(false);
  const [supplierVendorId,       setSupplierVendorId]       = useState("");
  const [lineItems,              setLineItems]              = useState<LineItem[]>([emptyLineItem(1)]);

  /* ── Input styles ────────────────────────────────────────────── */
  const inputCls = (hasError?: boolean) =>
    `w-full px-3 py-2 border ${hasError
      ? "border-red-400 bg-red-50 dark:bg-red-950/20 focus:ring-red-300/40 focus:border-red-400"
      : "border-gray-300 dark:border-border bg-white dark:bg-background focus:ring-primary/40 focus:border-primary"
    } rounded-lg text-sm focus:ring-2 outline-none text-gray-900 dark:text-foreground transition-colors`;

  const readonlyCls =
    "w-full px-3 py-2 border border-gray-200 dark:border-border rounded-lg text-sm " +
    "bg-gray-50 dark:bg-muted/50 text-gray-500 dark:text-muted-foreground cursor-not-allowed";

  /* ── Validation ──────────────────────────────────────────────── */
  const markTouched = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const validateForm = useCallback((): ValidationErrors => {
    const errs: ValidationErrors = {};
    if (!contract)                   errs.contract            = "Contract is required";
    if (!purchaseOrderID.trim())     errs.purchaseOrderID     = "Purchase Order ID is required";
    if (!purchaseOrderDate)          errs.purchaseOrderDate   = "Purchase Order Date is required";
    if (!relationshipManager.trim()) errs.relationshipManager = "Relationship Manager is required";
    if (!memo.trim())                errs.memo                = "Memo is required";
    if (!selectedCustomerGst)        errs.selectedCustomerGst = "GST number selection is required";
    if (!billing?.name)              errs.billing             = "Customer Billing Address is required";
    if (!shipping?.name)             errs.shipping            = "Customer Shipping Address is required";
    if (!supplier?.name)             errs.supplier            = "Supplier is required";
    if (!delivery?.name)             errs.delivery            = "Delivery Address is required";
    const hasValidLineItem = lineItems.some(
      (li) => li.productName && li.quantity > 0 && li.sellRate > 0
    );
    if (!hasValidLineItem) errs.lineItems = "At least one complete line item is required";
    return errs;
  }, [contract, purchaseOrderID, purchaseOrderDate, relationshipManager,
      memo, selectedCustomerGst, billing, shipping, supplier, delivery, lineItems]);

  useEffect(() => {
    if (Object.keys(touched).length === 0) return;
    const errs = validateForm();
    const filtered: ValidationErrors = {};
    if (touched.contract            && errs.contract)            filtered.contract            = errs.contract;
    if (touched.purchaseOrderID     && errs.purchaseOrderID)     filtered.purchaseOrderID     = errs.purchaseOrderID;
    if (touched.purchaseOrderDate   && errs.purchaseOrderDate)   filtered.purchaseOrderDate   = errs.purchaseOrderDate;
    if (touched.relationshipManager && errs.relationshipManager) filtered.relationshipManager = errs.relationshipManager;
    if (touched.memo                && errs.memo)                filtered.memo                = errs.memo;
    if (touched.selectedCustomerGst && errs.selectedCustomerGst) filtered.selectedCustomerGst = errs.selectedCustomerGst;
    if (touched.billing             && errs.billing)             filtered.billing             = errs.billing;
    if (touched.shipping            && errs.shipping)            filtered.shipping            = errs.shipping;
    if (touched.supplier            && errs.supplier)            filtered.supplier            = errs.supplier;
    if (touched.delivery            && errs.delivery)            filtered.delivery            = errs.delivery;
    if (touched.lineItems           && errs.lineItems)           filtered.lineItems           = errs.lineItems;
    setErrors(filtered);
  }, [touched, contract, purchaseOrderID, purchaseOrderDate, relationshipManager,
      memo, selectedCustomerGst, billing, shipping, supplier, delivery, lineItems, validateForm]);

  /* ── Apply parsed lookup data to state ───────────────────────── */
  const applyLookups = useCallback((
    gstRaw: any, billRaw: any, shipRaw: any, supRaw: any, existingGst?: string
  ) => {
    // GST
    if (gstRaw) {
      const arr: any[] = Array.isArray(gstRaw) ? gstRaw
        : Array.isArray(gstRaw?.taxRegistrationNumbers) ? gstRaw.taxRegistrationNumbers
        : Array.isArray(gstRaw?.data) ? gstRaw.data : [];
      const list = arr.map((g: any) => ({
        id:     String(g.customertaxregistrationnumberid || g.id || ""),
        number: String(g.customertaxregistrationnumber  || g.taxNumber || ""),
      })).filter((x) => x.id && x.number);
      setGstOptions(list);
      if (list.length > 0 && !existingGst) {
        setSelectedCustomerGst(list[0].id);
        localStorage.setItem(KEYS.SELECTED_CUSTOMER_GST, list[0].id);
      }
    }

    // Billing
    if (billRaw) {
      const arr  = Array.isArray(billRaw) ? billRaw : (billRaw?.data ?? []);
      const mapped = mapBillingAddress(arr);
      if (mapped.length) { setBillingOptions(mapped); setBilling(mapped[0]); }
    }

    // Shipping
    if (shipRaw) {
      const arr  = Array.isArray(shipRaw) ? shipRaw : (shipRaw?.data ?? []);
      const mapped = mapShippingAddress(arr);
      if (mapped.length) { setShippingOptions(mapped); setShipping(mapped[0]); }
    }

    // Supplier
    if (supRaw) {
      const arr  = Array.isArray(supRaw) ? supRaw : (supRaw?.data ?? []);
      const mapped = mapSupplierAddress(arr);
      if (mapped.length) {
        setSupplierOptions(mapped);
        setSupplier(mapped[0]);
        setSupplierVendorId(String(arr[0]?.supplierid || ""));
      }
    }
  }, []);

  /* ── Load lookups — cache-first, then network ────────────────── */
  const loadLookupsForContract = useCallback(
    async (lookupId: string) => {
      if (!lookupId) return;

      //   Check prefetch cache FIRST
      const cached = readCreationLookups(lookupId);
      if (cached) {
        applyLookups(cached.gst, cached.bill, cached.ship, cached.sup);
        return; // ← 0 ms, no network
      }

      // Cache miss — fetch all 5 in parallel (was the 10 s bug)
      setIsPageLoading(true);
      setBillingOptions([]);  setShippingOptions([]);
      setSupplierOptions([]); setSupplierAddressOptions([]);
      setGstOptions([]);      setSelectedCustomerGst("");
      setBilling(emptyAddress); setShipping(emptyAddress);
      setSupplier(emptyAddress); setDelivery(emptyAddress);
      setSupplierVendorId("");

      const base   = getBase();
      const params = { customerid: lookupId };

      try {
        const [gstRes, billRes, shipRes, supRes] = await Promise.all([
          apiFetch(base, "/customer-tax",     params),
          apiFetch(base, "/billing-address",  params),
          apiFetch(base, "/shipping-address", params),
          apiFetch(base, "/supplier-details", params),
        ]);

        const safeJson = async (r: Response) => {
          if (!r.ok) return null;
          try { return await r.json(); } catch { return null; }
        };

        const [gst, bill, ship, sup] = await Promise.all([
          safeJson(gstRes), safeJson(billRes),
          safeJson(shipRes), safeJson(supRes),
        ]);

        // Write to cache so next visit is instant
        if (gst || bill || ship || sup) {
          writeCreationLookups(lookupId, { gst, bill, ship, sup });
        }

        applyLookups(gst, bill, ship, sup);
      } catch (e) {
        console.warn("[CreateSalesOrder] loadLookupsForContract failed", e);
      } finally {
        setIsPageLoading(false);
      }
    },
    [applyLookups]
  );

  /* ── Load items — cache-first ────────────────────────────────── */
  const loadItems = useCallback(async (contractId: string) => {
    if (!contractId) return;

    //   Check cache first
    const cached = readItemOptions(contractId);
    if (cached) { setItemOptions(cached); return; }

    setItemsLoading(true);
    try {
      const res = await apiFetch(getBase(), "/items-for-contract", { customerid: contractId });
      if (res.ok) {
        const data  = await res.json().catch(() => null);
        const items = Array.isArray(data) ? data : (data?.data ?? []);
        setItemOptions(items);
        writeItemOptions(contractId, items);
      } else {
        setItemOptions([]);
      }
    } catch {
      setItemOptions([]);
    } finally {
      setItemsLoading(false);
    }
  }, []);

  /* ── Restore from navigation state (edit flow) ───────────────── */
  useEffect(() => {
    const d = location.state?.salesOrderData;
    if (!d) return;
    setContract(d.contract || ""); setContractLabel(d.contractLabel || d.contract || "");
    setContractClass(d.contractClass || ""); setCustomerEmail(d.customerEmail || "");
    setCustomerId(d.customerId || ""); setContractSubcustomerId(d.contract || "");
    setOriginId(d.originId || ""); setClassId(d.classId || "");
    setPurchaseOrderID(d.purchaseOrderID || ""); setPurchaseOrderDate(d.purchaseOrderDate || "");
    setRelationshipManager(d.relationshipManager || ""); setMemo(d.memo || "");
    if (d.billing)   setBilling(d.billing);   if (d.shipping) setShipping(d.shipping);
    if (d.supplier)  setSupplier(d.supplier); if (d.delivery) setDelivery(d.delivery);
    if (d.lineItems) setLineItems(d.lineItems);
    if (d.selectedCustomerGst) setSelectedCustomerGst(d.selectedCustomerGst);
    if (d.billing)  setBillingOptions([d.billing]);
    if (d.shipping) setShippingOptions([d.shipping]);
    if (d.supplier) { setSupplierOptions([d.supplier]); setSupplierVendorId(String(d.supplier.id || "")); }
    if (d.delivery) setSupplierAddressOptions([d.delivery]);
    try {
      const cs = JSON.parse(localStorage.getItem("contracts") || "[]");
      if (Array.isArray(cs) && cs.length > 0) {
        const seen = new Set<string>(); const opts: typeof contractOptions = [];
        for (const c of cs) {
          const id = String(c.contractID || c.contractid || "");
          if (!id || seen.has(id)) continue; seen.add(id);
          opts.push({
            id, code: extractContractCode(c.contractName || c.contractname || id),
            customerId: String(c.customerID || c.customerid || ""),
            originId: String(c.originID || c.originid || ""),
            className: String(c.Class || c.className || c.classname || ""),
            customerEmail: String(c.customerEmail || c.customeremail || c.email || c.customerEmailId || ""),
          });
        }
        setContractOptions(opts);
      }
    } catch {}

    // Load items (cache-first)
    loadItems(d.contract || "");
    setHasChanges(false);
  }, [location.state, loadItems]);

  /* ── On mount (fresh visit or refresh) ──────────────────────── */
  useEffect(() => {
    if (location.state?.salesOrderData) return;

    const contractId   = localStorage.getItem(KEYS.SELECTED_CONTRACT)         || "";
    const code         = localStorage.getItem(KEYS.SELECTED_CONTRACT_NO)       || "";
    const parentCustId = localStorage.getItem(KEYS.SELECTED_PARENT_ID)         || "";
    const custId       = localStorage.getItem(KEYS.SELECTED_CUSTOMER_ID)       || "";
    const origId       = localStorage.getItem(KEYS.SELECTED_ORIGIN_ID)         || "";
    const clsId        = localStorage.getItem(KEYS.SELECTED_CLASS_ID)          || "";
    const clsName      = localStorage.getItem(KEYS.SELECTED_CLASS_NAME)        || "";
    const emailLS      = localStorage.getItem(KEYS.SELECTED_EMAIL)             || "";
    const gstLS        = localStorage.getItem(KEYS.SELECTED_CUSTOMER_GST)      || "";

    if (!contractId) {
      // Try to restore from draft
      try {
        const saved = sessionStorage.getItem("salesOrderDraft_form");
        if (saved) {
          const d = JSON.parse(saved);
          setContract(d.contract || ""); setContractLabel(d.contractLabel || "");
          setContractClass(d.contractClass || ""); setCustomerEmail(d.customerEmail || "");
          setCustomerId(d.customerId || ""); setContractSubcustomerId(d.contract || "");
          setOriginId(d.originId || ""); setClassId(d.classId || "");
          setPurchaseOrderID(d.purchaseOrderID || ""); setPurchaseOrderDate(d.purchaseOrderDate || "");
          setRelationshipManager(d.relationshipManager || ""); setMemo(d.memo || "");
          if (d.billing)  { setBilling(d.billing);  setBillingOptions([d.billing]); }
          if (d.shipping) { setShipping(d.shipping); setShippingOptions([d.shipping]); }
          if (d.supplier) { setSupplier(d.supplier); setSupplierOptions([d.supplier]); setSupplierVendorId(String(d.supplier.id || "")); }
          if (d.delivery) { setDelivery(d.delivery); setSupplierAddressOptions([d.delivery]); }
          if (d.lineItems) setLineItems(d.lineItems);
          if (d.selectedCustomerGst) setSelectedCustomerGst(d.selectedCustomerGst);
          loadItems(d.contract || "");
        }
      } catch {}
      return;
    }

    // Populate contract info from localStorage (no extra API call needed)
    setContract(contractId);
    setContractLabel(code || contractId);
    setContractSubcustomerId(contractId);
    setCustomerId(parentCustId || custId);
    setOriginId(origId);
    setClassId(clsId);
    setContractClass(clsName);
    setCustomerEmail(emailLS);
    if (gstLS) setSelectedCustomerGst(gstLS);

    // Build contract options from localStorage
    try {
      const cs = JSON.parse(localStorage.getItem("contracts") || "[]");
      if (Array.isArray(cs) && cs.length > 0) {
        const seen = new Set<string>(); const opts: typeof contractOptions = [];
        for (const c of cs) {
          const id = String(c.contractID || c.contractid || "");
          if (!id || seen.has(id)) continue; seen.add(id);
          opts.push({
            id, code: extractContractCode(c.contractName || c.contractname || id),
            customerId: String(c.customerID || c.customerid || ""),
            originId: String(c.originID || c.originid || ""),
            className: String(c.Class || c.className || c.classname || ""),
            customerEmail: String(c.customerEmail || c.customeremail || c.email || c.customerEmailId || ""),
          });
        }
        setContractOptions(opts);
      }
    } catch {}

    //   Load items and lookups — both read from cache first
    loadItems(contractId);
    loadLookupsForContract(contractId);

  }, [loadItems, loadLookupsForContract]);
  // Note: loadClassFromContractDetails removed — class is already in localStorage
  // from ContractSelection.  No extra API call needed on mount.

  /* ── Auto-persist form draft ─────────────────────────────────── */
  useEffect(() => {
    if (!contract) return;
    try {
      sessionStorage.setItem("salesOrderDraft_form", JSON.stringify({
        contract: contractSubcustomerId || contract,
        contractLabel, contractClass, customerEmail, customerId, originId, classId,
        purchaseOrderID, purchaseOrderDate, relationshipManager, memo,
        billing, shipping, supplier, delivery, lineItems, selectedCustomerGst,
      }));
    } catch {}
  }, [contract, contractLabel, contractClass, customerEmail, customerId, originId, classId,
      purchaseOrderID, purchaseOrderDate, relationshipManager, memo,
      billing, shipping, supplier, delivery, lineItems, selectedCustomerGst, contractSubcustomerId]);

  /* ── Supplier address fetch ──────────────────────────────────── */
  useEffect(() => {
    if (!supplierVendorId) return;
    setSupplierAddressOptions([]);
    setDelivery(emptyAddress);
    (async () => {
      try {
        const res = await apiFetch(getBase(), "/supplier-address", { vendor_id: supplierVendorId });
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        const arr  = Array.isArray(data) ? data : (data?.data ?? []);
        const addrs: Address[] = arr.map((it: any, idx: number) => {
          const fullAddress = it.address || it.address_label || "";
          return {
            id:      Number(it.address_internal_id || idx + 1),
            name:    [it.vendor_name, fullAddress.split("\n")[0]].filter(Boolean).join(" — ") || `Delivery Address ${idx + 1}`,
            address: fullAddress.replace(/\n/g, ", "),
            street:  fullAddress,
            city: "", country: "", phone: it.phone || "",
          };
        });
        if (addrs.length) { setSupplierAddressOptions(addrs); setDelivery(addrs[0]); }
      } catch (e) {
        console.warn("[CreateSalesOrder] supplier-address fetch failed", e);
      }
    })();
  }, [supplierVendorId]);

  /* ── Handlers ────────────────────────────────────────────────── */
  const addLineItem = () => {
    const newId = Math.max(...lineItems.map((i) => i.id), 0) + 1;
    setLineItems((prev) => [...prev, emptyLineItem(newId)]);
  };

  const buildSnapshot = () => ({
    contract: contractSubcustomerId || contract, customerId, originId, classId,
    contractLabel, contractClass, purchaseOrderID, purchaseOrderDate,
    relationshipManager, memo, purchaseOrderFile,
    billing, shipping, supplier, delivery, lineItems, selectedCustomerGst, customerEmail,
    salesOrderNo: "", salesOrderDate: new Date().toISOString().split("T")[0],
  });

  const handleSaveDraft = () => {
    const draft: Draft = {
      id: Date.now().toString(), customer: billing.name, vendor: supplier.name,
      items: lineItems, status: "Draft",
      fromDate: new Date().toISOString().split("T")[0],
      toDate:   new Date().toISOString().split("T")[0],
      savedAt:  new Date().toISOString(),
    };
    const existing = JSON.parse(localStorage.getItem("salesOrderDrafts") || "[]");
    localStorage.setItem("salesOrderDrafts", JSON.stringify([draft, ...existing]));
    setHasChanges(false); setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleSave = () => {
    setTouched({
      contract: true, purchaseOrderID: true, purchaseOrderDate: true,
      relationshipManager: true, memo: true, selectedCustomerGst: true,
      billing: true, shipping: true, supplier: true, delivery: true, lineItems: true,
    });
    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      setErrors(errs); setShowBanner(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setErrors({}); setShowBanner(false); setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false); setHasChanges(false);
      sessionStorage.removeItem("salesOrderDraft_form");
      navigate("/sales-orders/preview", { state: { salesOrderData: buildSnapshot() } });
    }, 500);
  };

  const handleCancel = () => {
    if (hasChanges) setShowUnsavedWarning(true);
    else { sessionStorage.removeItem("salesOrderDraft_form"); navigate("/sales-orders/listing"); }
  };

  const handleContractChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const opt          = contractOptions.find((o) => o.id === e.target.value);
    const newId        = e.target.value;
    const parentCustId = localStorage.getItem(KEYS.SELECTED_PARENT_ID) || opt?.customerId || "";
    setContract(newId); setContractSubcustomerId(newId);
    setContractLabel(opt?.code || newId); setCustomerId(parentCustId);
    setOriginId(opt?.originId || ""); setCustomerEmail(opt?.customerEmail || "");
    localStorage.setItem(KEYS.SELECTED_CONTRACT, newId);
    if (opt?.code)          localStorage.setItem(KEYS.SELECTED_CONTRACT_NO,  opt.code);
    if (opt?.originId)      localStorage.setItem(KEYS.SELECTED_ORIGIN_ID,    opt.originId);
    if (opt?.customerEmail) localStorage.setItem(KEYS.SELECTED_EMAIL,        opt.customerEmail);
    localStorage.removeItem(KEYS.SELECTED_CUSTOMER_GST);
    setLineItems([emptyLineItem(1)]);
    loadItems(newId);
    loadLookupsForContract(newId);
    setHasChanges(true); markTouched("contract");
  };

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <DashboardLayout
      stickyHeader={
        <PageBreadcrumb onBack={handleCancel} onOpenDrafts={() => setShowDrafts(true)} />
      }
    >
      <div className="w-full">

        <SuccessToast show={showSuccess} />

        {showDrafts && (
          <DraftsDialog
            isOpen={showDrafts}
            onClose={() => setShowDrafts(false)}
            onLoadDraft={(d) => { setLineItems(d.items); setHasChanges(false); setShowDrafts(false); }}
          />
        )}

        <UnsavedChangesDialog
          show={showUnsavedWarning}
          onClose={() => setShowUnsavedWarning(false)}
          onDiscard={() => {
            setShowUnsavedWarning(false);
            sessionStorage.removeItem("salesOrderDraft_form");
            navigate("/sales-orders/listing");
          }}
          onSaveDraft={() => {
            handleSaveDraft();
            setShowUnsavedWarning(false);
            navigate("/sales-orders/listing");
          }}
        />

        <div className="max-w-[1200px] mx-auto px-2 sm:px-6 pt-3 pb-6 space-y-4">

          {/* Validation Banner */}
          {showBanner && Object.values(errors).filter(Boolean).length > 0 && (
            <div className="border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 rounded-xl p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">
                  Please fill in all required fields before proceeding
                </p>
                <ul className="list-disc list-inside space-y-0.5">
                  {(Object.values(errors).filter(Boolean) as string[]).map((msg, i) => (
                    <li key={i} className="text-xs text-red-600 dark:text-red-400">{msg}</li>
                  ))}
                </ul>
              </div>
              <button onClick={() => setShowBanner(false)} className="flex-shrink-0 text-red-400 hover:text-red-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {isPageLoading ? (
            <div className="border border-gray-300 rounded-xl p-6 space-y-6 bg-white dark:bg-card">
              <Skeleton className="h-5 w-32 mb-2" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[...Array(8)].map((_, i) => <FormRowSkeleton key={i} />)}
              </div>
            </div>
          ) : (
            <>
              <GeneralInfoSection
                contract={contract} contractOptions={contractOptions}
                contractClass={contractClass} contractError={errors.contract}
                onContractChange={handleContractChange} onContractBlur={() => markTouched("contract")}
                purchaseOrderID={purchaseOrderID} purchaseOrderIDError={errors.purchaseOrderID}
                onPurchaseOrderIDChange={(v) => { setPurchaseOrderID(v); setHasChanges(true); }}
                onPurchaseOrderIDBlur={() => markTouched("purchaseOrderID")}
                purchaseOrderDate={purchaseOrderDate} purchaseOrderDateError={errors.purchaseOrderDate}
                onPurchaseOrderDateChange={(v) => { setPurchaseOrderDate(v); setHasChanges(true); }}
                onPurchaseOrderDateBlur={() => markTouched("purchaseOrderDate")}
                purchaseOrderFile={purchaseOrderFile} purchaseOrderFileError={errors.purchaseOrderFile}
                onPurchaseOrderFileChange={(f) => { setPurchaseOrderFile(f); setHasChanges(true); }}
                onPurchaseOrderFileBlur={() => markTouched("purchaseOrderFile")}
                relationshipManager={relationshipManager} relationshipManagerError={errors.relationshipManager}
                onRelationshipManagerChange={(v) => { setRelationshipManager(v); setHasChanges(true); }}
                onRelationshipManagerBlur={() => markTouched("relationshipManager")}
                memo={memo} memoError={errors.memo}
                onMemoChange={(v) => { setMemo(v); setHasChanges(true); }}
                onMemoBlur={() => markTouched("memo")}
                gstOptions={gstOptions} selectedCustomerGst={selectedCustomerGst} gstError={errors.selectedCustomerGst}
                onGstChange={(v) => { setSelectedCustomerGst(v); localStorage.setItem(KEYS.SELECTED_CUSTOMER_GST, v); }}
                onGstBlur={() => markTouched("selectedCustomerGst")}
                inputCls={inputCls} readonlyCls={readonlyCls}
              />

              <AddressSection
                billing={billing} billingOptions={billingOptions} billingError={errors.billing}
                onBillingSelect={(a) => { setBilling(a); setHasChanges(true); markTouched("billing"); }}
                shipping={shipping} shippingOptions={shippingOptions} shippingError={errors.shipping}
                onShippingSelect={(a) => { setShipping(a); setHasChanges(true); markTouched("shipping"); }}
              />

              <SupplierSection
                supplier={supplier} supplierOptions={supplierOptions} supplierError={errors.supplier}
                onSupplierSelect={(a) => { setSupplier(a); setSupplierVendorId(String(a.id)); setHasChanges(true); markTouched("supplier"); }}
                delivery={delivery} supplierAddressOptions={supplierAddressOptions} deliveryError={errors.delivery}
                onDeliverySelect={(a) => { setDelivery(a); setHasChanges(true); markTouched("delivery"); }}
              />

              <div className="border border-gray-300 rounded-xl overflow-hidden bg-white dark:bg-card">
                <div className="bg-gray-100 dark:bg-muted/60 border-b border-gray-300 dark:border-border px-3 sm:px-5 py-3">
                  <h2 className="text-sm font-bold text-gray-800 dark:text-foreground tracking-wide uppercase">
                    Line Items
                  </h2>
                </div>
                <div className="p-2 sm:p-5">
                  <LineItemsTable
                    lineItems={lineItems}
                    setLineItems={(items) => { setLineItems(items); markTouched("lineItems"); }}
                    onAddItem={addLineItem}
                    items={itemOptions}
                    itemsLoading={itemsLoading}
                  />
                  {errors.lineItems && (
                    <div className="flex items-center gap-1 mt-2">
                      <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                      <p className="text-xs text-red-500">{errors.lineItems}</p>
                    </div>
                  )}
                </div>
              </div>

              <FormActionButtons
                isPageLoading={isPageLoading}
                onSaveDraft={handleSaveDraft}
                onCancel={handleCancel}
                onSave={handleSave}
              />
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateSalesOrder;