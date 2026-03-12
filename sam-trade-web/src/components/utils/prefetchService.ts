/**
 * prefetchService.ts
 * ─────────────────────────────────────────────────────────────────
 * ONE place that owns ALL background prefetch logic.
 * Uses cacheManager for ALL reads/writes — no raw sessionStorage calls.
 */

import { mapSo } from "@/components/SalesOrder/Listing/useTableFilters";
import { fetchContractListing } from "@/components/utils/authUtils";
import {
  isSoCacheValid, writeSoCache,
  readCreationLookups, writeCreationLookups,
  readItemOptions, writeItemOptions,
  readContracts, writeContracts,
  readGrnListing, writeGrnListing,
  readSalesInvoices, writeSalesInvoices,
  readPurchaseBills, writePurchaseBills,
  readIfListing, writeIfListing,
  KEYS,
} from "./cacheManager";

const getBase = () =>
  ((import.meta as any).env.VITE_API_URL || "http://localhost:3001/api").replace(/\/+$/, "");

// ── In-flight dedup map ───────────────────────────────────────────────────────
const _inflight = new Map<string, Promise<any>>();

const deduped = <T>(key: string, fn: () => Promise<T>): Promise<T> => {
  if (_inflight.has(key)) return _inflight.get(key) as Promise<T>;
  const p = fn().finally(() => _inflight.delete(key));
  _inflight.set(key, p);
  return p;
};

// ── Safe fetch helper ─────────────────────────────────────────────────────────
const safeFetch = async (url: string): Promise<any> => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) return null;
  return res.json().catch(() => null);
};

const toArray = (data: any): any[] =>
  Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];

const toApiDate = (d: Date) =>
  `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;

// ─────────────────────────────────────────────────────────────────────────────
// 1. Contracts
// ─────────────────────────────────────────────────────────────────────────────
export const prefetchContracts = (customerId: string): void => {
  if (!customerId) return;

  if (readContracts()) return;

  try {
    const legacy = localStorage.getItem("contracts");
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed) && parsed.length > 0) return;
    }
  } catch {}

  deduped(`contracts_${customerId}`, async () => {
    const data = await fetchContractListing(customerId, "BTST");
    if (Array.isArray(data) && data.length > 0) {
      writeContracts(data);
      localStorage.setItem(KEYS.CONTRACTS, JSON.stringify(data));
    }
    return data;
  }).catch(() => {});
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. SO Listing  →  /proxy/trade/v1/so-listing
// ─────────────────────────────────────────────────────────────────────────────
export const prefetchSOListing = (contractId: string): void => {
  if (!contractId || isSoCacheValid()) return;

  deduped(`so_listing_${contractId}`, async () => {
    const data = await safeFetch(
      `${getBase()}/proxy/trade/v1/so-listing?id=${encodeURIComponent(contractId)}`
    );
    const raw = toArray(data);
    if (raw.length > 0) writeSoCache(raw.map(mapSo));
    return raw;
  }).catch(() => {});
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. Creation lookups — all 5 in parallel
// ─────────────────────────────────────────────────────────────────────────────
export const prefetchCreationLookups = (contractId: string): void => {
  if (!contractId) return;

  const existingLookups = readCreationLookups(contractId);
  const existingItems   = readItemOptions(contractId);
  if (existingLookups && existingItems) return;

  const base   = getBase();
  const params = new URLSearchParams({ customerid: contractId }).toString();

  deduped(`creation_lookups_${contractId}`, async () => {
    const results = await Promise.allSettled([
      fetch(`${base}/proxy/trade/v1/tax-registration?${params}`,      { credentials: "include" }),
      fetch(`${base}/proxy/trade/v1/billing-address?${params}`,       { credentials: "include" }),
      fetch(`${base}/proxy/trade/v1/shipping-address?${params}`,      { credentials: "include" }),
      fetch(`${base}/proxy/trade/v1/supplier-details?${params}`,      { credentials: "include" }),
      fetch(`${base}/proxy/trade/v1/contract-item-details?${params}`, { credentials: "include" }),
    ]);

    const safeJson = async (r: PromiseSettledResult<Response>) => {
      if (r.status !== "fulfilled" || !r.value.ok) return null;
      try { return await r.value.json(); } catch { return null; }
    };

    const [gst, bill, ship, sup, items] = await Promise.all(results.map(safeJson));

    if (!existingLookups && (gst || bill || ship || sup)) {
      writeCreationLookups(contractId, { gst, bill, ship, sup });
    }
    if (!existingItems && items) {
      const arr = toArray(items);
      if (arr.length > 0) writeItemOptions(contractId, arr);
    }

    return { gst, bill, ship, sup, items };
  }).catch(() => {});
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. GRN Listing  →  /proxy/trade/v1/grn-listing?contractID=&class=
// ─────────────────────────────────────────────────────────────────────────────
export const prefetchGrnListing = (contractId: string, className = "BTST"): void => {
  if (!contractId || readGrnListing(contractId)) return;

  deduped(`grn_${contractId}`, async () => {
    const params = new URLSearchParams({ contractID: contractId, class: className });
    const data   = await safeFetch(`${getBase()}/proxy/trade/v1/grn-listing?${params}`);
    const list   = toArray(data);
    writeGrnListing(contractId, list);
    return list;
  }).catch(() => {});
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. Sales Invoice Listing  →  /proxy/trade/v1/sales-invoice-listing
// ─────────────────────────────────────────────────────────────────────────────
export const prefetchSalesInvoices = (salesOrderId?: string): void => {
  if (readSalesInvoices(salesOrderId)) return;

  deduped(`sales_invoice_${salesOrderId || "all"}`, async () => {
    const today   = new Date();
    const yearAgo = new Date();
    yearAgo.setFullYear(today.getFullYear() - 1);

    const params = new URLSearchParams({
      fromdate: toApiDate(yearAgo),
      todate:   toApiDate(today),
    });
    if (salesOrderId) params.set("salesorderid", salesOrderId);

    const data = await safeFetch(
      `${getBase()}/proxy/trade/v1/sales-invoice-listing?${params}`
    );
    const list = toArray(data);
    writeSalesInvoices(list, salesOrderId);
    return list;
  }).catch(() => {});
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. Purchase Bill Listing  →  /proxy/trade/v1/purchase-bill-listing
// ─────────────────────────────────────────────────────────────────────────────
export const prefetchPurchaseBills = (contractId?: string): void => {
  if (readPurchaseBills(contractId)) return;

  deduped(`purchase_bill_${contractId || "all"}`, async () => {
    const params = new URLSearchParams();
    if (contractId) params.set("contractID", contractId);

    const data = await safeFetch(
      `${getBase()}/proxy/trade/v1/purchase-bill-listing?${params}`
    );
    const list = toArray(data);
    writePurchaseBills(list, contractId);
    return list;
  }).catch(() => {});
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. Item Fulfillment Listing  →  /proxy/trade/v1/if-listing?salesorderid=
// ─────────────────────────────────────────────────────────────────────────────
export const prefetchItemFulfillments = (salesOrderId: string): void => {
  if (!salesOrderId || readIfListing(salesOrderId)) return;

  deduped(`if_listing_${salesOrderId}`, async () => {
    const data = await safeFetch(
      `${getBase()}/proxy/trade/v1/if-listing?salesorderid=${encodeURIComponent(salesOrderId)}`
    );

    // Detect NetSuite error objects — never cache them
    const isError =
      data &&
      typeof data === "object" &&
      !Array.isArray(data) &&
      (data.error || data.errorCode || data.errorMessage ||
        (typeof data.message === "string" && data.message.toLowerCase().includes("error")));

    if (isError) {
      console.warn("[prefetch] if-listing error for SO:", salesOrderId);
      return null;
    }

    const list = toArray(data);
    writeIfListing(salesOrderId, list); // skips empty arrays automatically
    return list;
  }).catch(() => {});
};

// ─────────────────────────────────────────────────────────────────────────────
// Orchestrator — call after navigate() on login
// ─────────────────────────────────────────────────────────────────────────────
export const kickoffAllPrefetches = (user: any): void => {
  const role = ((user?.roleName ?? user?.role) || "").toLowerCase();
  if (!role.includes("buyer") && !role.includes("customer")) return;

  const customerId = user?.netsuiteCustomerId || null;
  const contractId = localStorage.getItem(KEYS.SELECTED_CONTRACT) || "";
  const className  = (localStorage.getItem("selectedContractClass") || "BTST").split(":")[0].trim();
  const soId       = localStorage.getItem("selectedSalesOrderId") || "";

  if (!customerId) return;

  setTimeout(() => {
    prefetchContracts(customerId);

    if (contractId) {
      prefetchSOListing(contractId);
      prefetchCreationLookups(contractId);
      prefetchGrnListing(contractId, className);
      prefetchPurchaseBills(contractId);
    }

    prefetchSalesInvoices(soId || undefined);

    if (soId) {
      prefetchItemFulfillments(soId);
    }
  }, 300);
};

// ─────────────────────────────────────────────────────────────────────────────
// Post-contract-selection prefetch (called from ContractSelection)
// ─────────────────────────────────────────────────────────────────────────────
export const kickoffPostContractPrefetch = (contractId: string): void => {
  if (!contractId) return;
  const className = (localStorage.getItem("selectedContractClass") || "BTST").split(":")[0].trim();

  setTimeout(() => {
    prefetchSOListing(contractId);
    prefetchCreationLookups(contractId);
    prefetchGrnListing(contractId, className);
    prefetchPurchaseBills(contractId);
    prefetchSalesInvoices();
  }, 200);
};

// ─────────────────────────────────────────────────────────────────────────────
// Post-SO-selection prefetch (call when user selects a Sales Order)
// ─────────────────────────────────────────────────────────────────────────────
export const kickoffPostSoPrefetch = (salesOrderId: string): void => {
  if (!salesOrderId) return;
  setTimeout(() => {
    prefetchItemFulfillments(salesOrderId);
    prefetchSalesInvoices(salesOrderId);
  }, 200);
};