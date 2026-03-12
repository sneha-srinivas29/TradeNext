/**
 * cacheManager.ts
 * ─────────────────────────────────────────────────────────────────
 * TTL-aware, strongly-typed cache layer.
 * All pages / prefetchers use these helpers — never raw storage calls.
 */

// ── Dev logging ───────────────────────────────────────────────────────────────

const isDev   = import.meta.env.DEV;
const devLog  = (msg: string, ...args: unknown[]) => { if (isDev) console.debug(`[cacheManager] ${msg}`, ...args); };
const devWarn = (msg: string, err: unknown)        => { if (isDev) console.warn(`[cacheManager] ${msg}`, err); };

// ── TTLs ──────────────────────────────────────────────────────────────────────

export const TTL = {
  SO_LISTING:        60 * 60 * 1000,      // 1 hour
  CREATION_LOOKUPS:  60 * 60 * 1000,      // 1 hour
  ITEM_OPTIONS:      60 * 60 * 1000,      // 1 hour
  CONTRACTS:          60 * 60 * 60 * 1000, // 1 hours
  GRN_LISTING:       60 * 60 * 1000,      // 1 hour
  SALES_INVOICES:    60 * 60 * 1000,      // 1 hour
  PURCHASE_BILLS:    60 * 60 * 1000,      // 1 hour
  IF_LISTING:        60 * 60 * 1000,      // 1 hour
  MAX_SESSION_MS:     60* 60 * 60 * 1000, // 1 hours — auto-logout
} as const;

// ── Keys ──────────────────────────────────────────────────────────────────────

export const KEYS = {
  AUTH_TOKEN:            "authToken",
  LOGIN_TIMESTAMP:       "loginTimestamp",
  CONTRACTS:             "contracts",
  SELECTED_CONTRACT:     "selectedContract",
  SELECTED_CONTRACT_NO:  "selectedContractNo",
  SELECTED_CUSTOMER_ID:  "selectedCustomerId",
  SELECTED_PARENT_ID:    "selectedParentCustomerId",
  SELECTED_CLASS_ID:     "selectedClassId",
  SELECTED_ORIGIN_ID:    "selectedOriginId",
  SELECTED_EMAIL:        "selectedCustomerEmail",
  SELECTED_CLASS_NAME:   "selectedContractClass",
  SELECTED_CUSTOMER_GST: "selectedCustomerGst",

  soListing:        ():                    string => "so_listing_cache",
  creationLookups:  (contractId: string):  string => `creation_lookups_${contractId}`,
  itemOptions:      (contractId: string):  string => `itemOptions_${contractId}`,
  contractsCache:   ():                    string => "contracts_cache_v2",

  // ── New endpoints ──────────────────────────────────────────────
  grnListing:       (contractId: string):  string => `grn_listing_${contractId}`,
  salesInvoices:    (soId?: string):       string => `sales_invoice_${soId || "all"}`,
  purchaseBills:    (contractId?: string): string => `purchase_bill_${contractId || "all"}`,
  ifListing:        (soId: string):        string => `if_listing_cache_${soId}`,
} as const;

// ── Cache entry wrapper ───────────────────────────────────────────────────────

interface CacheEntry<T> {
  data:      T;
  fetchedAt: number;
}

// ── Storage helpers ───────────────────────────────────────────────────────────

const safeGet = <T>(store: Storage, key: string): T | null => {
  try {
    const raw = store.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err) { devWarn(`safeGet failed "${key}"`, err); return null; }
};

const safeSet = (store: Storage, key: string, value: unknown): void => {
  try { store.setItem(key, JSON.stringify(value)); }
  catch (err) { devWarn(`safeSet failed "${key}"`, err); }
};

const safeRemove = (store: Storage, key: string): void => {
  try { store.removeItem(key); }
  catch (err) { devWarn(`safeRemove failed "${key}"`, err); }
};

// ── TTL read / write ──────────────────────────────────────────────────────────

export const readCache = <T>(store: Storage, key: string, ttlMs: number): T | null => {
  const entry = safeGet<CacheEntry<T>>(store, key);
  if (!entry || typeof entry.fetchedAt !== "number") return null;
  if (Date.now() - entry.fetchedAt > ttlMs) {
    devLog(`Stale, removing "${key}"`);
    safeRemove(store, key);
    return null;
  }
  devLog(`Hit "${key}"`);
  return entry.data;
};

export const writeCache = <T>(store: Storage, key: string, payload: T): void => {
  safeSet(store, key, { data: payload, fetchedAt: Date.now() } as CacheEntry<T>);
  devLog(`Written "${key}"`);
};

// ── SO Listing ────────────────────────────────────────────────────────────────

export interface SoCache {
  orders: any[];
}

export const readSoCache    = (): SoCache | null =>
  readCache<SoCache>(sessionStorage, KEYS.soListing(), TTL.SO_LISTING);

export const writeSoCache   = (orders: any[]): void =>
  writeCache<SoCache>(sessionStorage, KEYS.soListing(), { orders });

export const isSoCacheValid = (): boolean => readSoCache() !== null;

// ── Creation lookups ──────────────────────────────────────────────────────────

export interface CreationLookupsPayload {
  gst:  unknown;
  bill: unknown;
  ship: unknown;
  sup:  unknown;
}

export const readCreationLookups = (contractId: string): CreationLookupsPayload | null =>
  readCache<CreationLookupsPayload>(
    sessionStorage,
    KEYS.creationLookups(contractId),
    TTL.CREATION_LOOKUPS
  );

export const writeCreationLookups = (contractId: string, payload: CreationLookupsPayload): void =>
  writeCache<CreationLookupsPayload>(sessionStorage, KEYS.creationLookups(contractId), payload);

// ── Item options ──────────────────────────────────────────────────────────────

export interface ItemOption {
  itemid?:           string | number;
  itemId?:           string | number;
  itemname?:         string;
  itemName?:         string;
  displayname?:      string;
  salesdescription?: string;
  [key: string]:     unknown;
}

export const readItemOptions = (contractId: string): ItemOption[] | null =>
  readCache<ItemOption[]>(sessionStorage, KEYS.itemOptions(contractId), TTL.ITEM_OPTIONS);

export const writeItemOptions = (contractId: string, items: ItemOption[]): void =>
  writeCache<ItemOption[]>(sessionStorage, KEYS.itemOptions(contractId), items);

// ── Contracts ─────────────────────────────────────────────────────────────────

export const readContracts  = (): unknown[] | null =>
  readCache<unknown[]>(localStorage, KEYS.contractsCache(), TTL.CONTRACTS);

export const writeContracts = (data: unknown[]): void =>
  writeCache<unknown[]>(localStorage, KEYS.contractsCache(), data);

// ── GRN Listing ───────────────────────────────────────────────────────────────

export const readGrnListing = (contractId: string): any[] | null =>
  readCache<any[]>(sessionStorage, KEYS.grnListing(contractId), TTL.GRN_LISTING);

export const writeGrnListing = (contractId: string, records: any[]): void => {
  if (records.length === 0) return; // never cache empty
  writeCache<any[]>(sessionStorage, KEYS.grnListing(contractId), records);
};

// ── Sales Invoice Listing ─────────────────────────────────────────────────────

export const readSalesInvoices = (soId?: string): any[] | null =>
  readCache<any[]>(sessionStorage, KEYS.salesInvoices(soId), TTL.SALES_INVOICES);

export const writeSalesInvoices = (records: any[], soId?: string): void => {
  if (records.length === 0) return; // never cache empty
  writeCache<any[]>(sessionStorage, KEYS.salesInvoices(soId), records);
};

// ── Purchase Bill Listing ─────────────────────────────────────────────────────

export const readPurchaseBills = (contractId?: string): any[] | null =>
  readCache<any[]>(sessionStorage, KEYS.purchaseBills(contractId), TTL.PURCHASE_BILLS);

export const writePurchaseBills = (records: any[], contractId?: string): void => {
  if (records.length === 0) return; // never cache empty
  writeCache<any[]>(sessionStorage, KEYS.purchaseBills(contractId), records);
};

// ── Item Fulfillment Listing ──────────────────────────────────────────────────

export const readIfListing = (soId: string): any[] | null =>
  readCache<any[]>(sessionStorage, KEYS.ifListing(soId), TTL.IF_LISTING);

export const writeIfListing = (soId: string, records: any[]): void => {
  if (records.length === 0) return; // never cache empty — avoids stale-empty bug
  writeCache<any[]>(sessionStorage, KEYS.ifListing(soId), records);
};

// ── Session / auth ────────────────────────────────────────────────────────────

export const stampLoginTime = (): void =>
  localStorage.setItem(KEYS.LOGIN_TIMESTAMP, String(Date.now()));

export const isSessionAlive = (): boolean => {
  const ts = Number(localStorage.getItem(KEYS.LOGIN_TIMESTAMP) ?? 0);
  return !!ts && Date.now() - ts < TTL.MAX_SESSION_MS;
};

export const clearAllCaches = (): void => {
  [
    KEYS.AUTH_TOKEN, KEYS.LOGIN_TIMESTAMP, KEYS.CONTRACTS,
    KEYS.SELECTED_CONTRACT, KEYS.SELECTED_CONTRACT_NO,
    KEYS.SELECTED_CUSTOMER_ID, KEYS.SELECTED_PARENT_ID,
    KEYS.SELECTED_CLASS_ID, KEYS.SELECTED_ORIGIN_ID,
    KEYS.SELECTED_EMAIL, KEYS.SELECTED_CLASS_NAME,
    KEYS.SELECTED_CUSTOMER_GST, KEYS.contractsCache(),
  ].forEach((k) => safeRemove(localStorage, k));

  try { sessionStorage.clear(); devLog("sessionStorage cleared"); }
  catch (err) { devWarn("sessionStorage.clear() failed", err); }
};