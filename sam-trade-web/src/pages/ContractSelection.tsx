
//  * 1. SINGLE API call — reads from cacheManager first (TTL-aware).
//  *    The old code had BOTH a module-level variable AND localStorage,
//  *    causing double-fetch on stale check mismatch.
//  * 2. Removed the inline `kickoffPostContractPrefetch` function —
//  *    delegated to prefetchService so the logic lives in one place.
//  * 3. `ranOnce` ref still guards against React strict-mode double-effect.
//  * 4. Uses the shared KEYS constants — no magic strings.
//  */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Building2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchContractListing } from "@/components/utils/authUtils";
import { useAuth } from "@/contexts/Authcontext";

import {
  readContracts, writeContracts,
  KEYS,
} from "../components/utils/cacheManager"
import { kickoffPostContractPrefetch } from "../components/utils/prefetchService";

/* ── Constants ─────────────────────────────────────────────────── */

const getBase = () =>
  ((import.meta as any).env.VITE_API_URL || "http://localhost:3001/api").replace(/\/+$/, "");

/* ── Types ─────────────────────────────────────────────────────── */

interface Contract {
  id:            number;
  contractNo:    string;
  customer:      string;
  customerId:    number;
  customerEmail: string;
  className:     string;
  classId:       number;
  origin:        string;
  originId:      number;
  margin:        string;
}

/* ── Module-level cache (in-memory for same-session SPA navigation) */
let _memCache: Contract[] | null = null;

/* ── Helpers ───────────────────────────────────────────────────── */

const toNum = (v: any): number => {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

const deduplicateContracts = (data: any[]): Contract[] => {
  const seen   = new Set<number>();
  const result: Contract[] = [];

  for (const c of data) {
    const id = toNum(c.contractid || c.contractID || c.ContractID || 0);
    if (!id || seen.has(id)) continue;
    seen.add(id);

    const classId  = toNum(c.classid  || c.classID  || c.ClassID  || c.class_id  || 0);
    const originId = toNum(c.originid || c.originID || c.OriginID || c.origin_id || 0);

    result.push({
      id,
      contractNo:    String(c.contractname  || c.contractName  || c.contractNo  || id),
      customer:      String(c.customername  || c.customerName  || c.customer    || ""),
      customerId:    toNum(c.customerid     || c.customerID    || c.customerId  || 0),
      customerEmail: String(c.customerEmail || c.customeremail || c.email       || c.customerEmailId || ""),
      className:     String(c.Class || c.classname || c.className || ""),
      classId,
      originId,
      origin:        String(c.originname    || c.originName    || c.origin      || ""),
      margin:        c.overalltrademargin
        ? `${c.overalltrademargin}%`
        : c.OverallTradeMargin
        ? `${c.OverallTradeMargin}%`
        : "",
    });
  }

  return result;
};

const isStale = (contracts: Contract[]): boolean =>
  contracts.length > 0 && contracts.some((c) => !c.classId || !c.originId);

/* ── Skeletons ─────────────────────────────────────────────────── */

const ContractCardSkeleton = () => (
  <Card className="animate-pulse">
    <CardContent className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 rounded bg-muted" />
        <div className="h-4 w-32 rounded bg-muted" />
      </div>
      <div className="h-5 w-48 rounded bg-muted" />
      <div className="h-4 w-40 rounded bg-muted" />
      <div className="flex gap-2">
        <div className="h-3 w-24 rounded bg-muted" />
        <div className="h-3 w-20 rounded bg-muted" />
        <div className="h-3 w-16 rounded bg-muted" />
      </div>
    </CardContent>
  </Card>
);

const ContractGridSkeleton = () => (
  <div className="min-h-screen flex items-center justify-center p-6 bg-background">
    <div className="w-full max-w-4xl space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-64 rounded bg-muted animate-pulse" />
        <div className="h-4 w-40 rounded bg-muted animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <ContractCardSkeleton key={i} />)}
      </div>
    </div>
  </div>
);

/* ── Component ─────────────────────────────────────────────────── */

const ContractSelection = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const ranOnce  = useRef(false);

  const [contracts,        setContracts]        = useState<Contract[]>(_memCache ?? []);
  const [loading,          setLoading]          = useState(_memCache === null);
  const [selectedContract, setSelectedContract] = useState<number | null>(null);
  const [error,            setError]            = useState<string | null>(null);

  useEffect(() => {
    if (isLoading)       return;
    if (!user)           return;
    if (ranOnce.current) return;
    ranOnce.current = true;

    // ── 1. In-memory cache (same SPA session, no re-fetch on back-nav) ──
    if (_memCache !== null && !isStale(_memCache)) {
      setContracts(_memCache);
      setLoading(false);
      return;
    }

    const loadContracts = async () => {
      try {
        // ── 2. TTL-aware persistent cache (survives page refresh) ──────
        const cachedData = readContracts();
        if (cachedData && cachedData.length > 0) {
          const deduped = deduplicateContracts(cachedData);
          if (!isStale(deduped)) {
            _memCache = deduped;
            setContracts(deduped);
            setLoading(false);
            return;
          }
          // Stale — fall through to network fetch
        }

        // ── 3. Legacy "contracts" key (backwards compat on first upgrade) ─
        try {
          const legacy = localStorage.getItem("contracts");
          if (legacy) {
            const parsed = JSON.parse(legacy);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const deduped = deduplicateContracts(parsed);
              if (!isStale(deduped)) {
                _memCache = deduped;
                writeContracts(parsed); // Migrate to new TTL cache
                setContracts(deduped);
                setLoading(false);
                return;
              }
              localStorage.removeItem("contracts");
            }
          }
        } catch {}

        // ── 4. Network fetch ──────────────────────────────────────────
        const customerId = (user as any).netsuiteCustomerId || null;
        if (!customerId) {
          setError(
            "Your account does not have a NetSuite customer ID linked. " +
            "Please contact your administrator."
          );
          setLoading(false);
          return;
        }

        const data = await fetchContractListing(customerId, "BTST");

        if (Array.isArray(data) && data.length > 0) {
          const deduped = deduplicateContracts(data);
          _memCache = deduped;
          writeContracts(data);
          // Keep legacy key for CreateSalesOrder contractOptions dropdown
          localStorage.setItem(KEYS.CONTRACTS, JSON.stringify(data));
          setContracts(deduped);
        } else {
          setError("No contracts found for your account.");
        }
      } catch (err: any) {
        console.error("Contract load failed", err);
        setError("Failed to load contracts. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadContracts();
  }, [user, isLoading]);

  const handleContractSelect = (contract: Contract) => {
    const parentCustomerId = toNum((user as any).netsuiteCustomerId || 0);
    const contractId       = String(contract.id);

    // Persist selected contract info
    localStorage.setItem(KEYS.SELECTED_CONTRACT,     contractId);
    localStorage.setItem(KEYS.SELECTED_CONTRACT_NO,  contract.contractNo);
    localStorage.setItem(KEYS.SELECTED_PARENT_ID,    String(parentCustomerId));
    localStorage.setItem(KEYS.SELECTED_CUSTOMER_ID,  String(contract.customerId));
    localStorage.setItem(KEYS.SELECTED_CLASS_ID,     String(contract.classId));
    localStorage.setItem(KEYS.SELECTED_ORIGIN_ID,    String(contract.originId));
    localStorage.setItem(KEYS.SELECTED_EMAIL,        contract.customerEmail);
    localStorage.setItem(KEYS.SELECTED_CLASS_NAME,   contract.className);
    localStorage.removeItem(KEYS.SELECTED_CUSTOMER_GST);

    //   Fire prefetch BEFORE navigating — runs in background while
    //    dashboard loads.  Uses in-flight dedup so even if Login already
    //    started fetching, this won't double-fire.
    kickoffPostContractPrefetch(contractId);

    //   SPA navigation preserves sessionStorage so prefetch writes land.
    navigate("/dashboard", { replace: true });
  };

  const retry = () => {
    ranOnce.current = false;
    _memCache       = null;
    localStorage.removeItem("contracts");
    setError(null);
    setContracts([]);
    setLoading(true);
  };

  if (loading) return <ContractGridSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-background">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg text-center text-foreground">{error}</p>
        <Button onClick={retry}>Retry</Button>
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-background">
        <Building2 className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg text-foreground">No contracts found for your account.</p>
        <Button onClick={retry}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Select Your Contract</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {contracts.length} contract{contracts.length !== 1 ? "s" : ""} available
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contracts.map((contract) => (
            <Card
              key={contract.id}
              onClick={() => setSelectedContract(contract.id)}
              className={`cursor-pointer transition-all ${
                selectedContract === contract.id
                  ? "ring-2 ring-primary shadow-md"
                  : "hover:shadow-md"
              }`}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-primary">
                    {contract.className}
                  </span>
                </div>

                <h3 className="font-semibold text-foreground">{contract.contractNo}</h3>
                <p className="text-sm text-muted-foreground">{contract.customer}</p>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {contract.origin && <span>Origin: {contract.origin}</span>}
                  {contract.margin && <span>Trade Margin: {contract.margin}</span>}
                  <span>ID: {contract.id}</span>
                </div>

                {selectedContract === contract.id && (
                  <Button
                    className="w-full mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContractSelect(contract);
                    }}
                  >
                    Continue with this contract
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContractSelection;