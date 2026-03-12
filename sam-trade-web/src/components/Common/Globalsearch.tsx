import { useState, useEffect, useRef } from "react";
import { Search, Loader2, X, ArrowRight, Hash, Package, Settings, Users } from "lucide-react";

interface SearchResult {
  id: number;
  title: string;
  category: string;
  description: string;
}

interface GlobalSearchProps {
  onSearch: (query: string) => Promise<SearchResult[]>;
  onSelect: (result: SearchResult) => void;
}

const categoryIcons: Record<string, React.ElementType> = {
  Product: Package,
  Vendor: Users,
  Settings: Settings,
  Default: Hash,
};

const getCategoryIcon = (category: string) => categoryIcons[category] ?? categoryIcons.Default;

const getCategoryColor = (category: string): string => {
  const map: Record<string, string> = {
    Product:  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    Vendor:   "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    Settings: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  };
  return map[category] ?? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";
};

// ─── Shared Results List ─────────────────────────────────────────────────────
const ResultsList = ({
  query, results, loading, onSelect,
}: {
  query: string;
  results: SearchResult[];
  loading: boolean;
  onSelect: (r: SearchResult) => void;
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Searching...</p>
      </div>
    );
  }

  if (query.length >= 2 && results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">No results found</p>
        <p className="text-xs text-muted-foreground">Try different keywords</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Quick Jump
        </p>
        <div className="flex flex-wrap gap-2">
          {["Products", "Vendors", "Orders", "Reports"].map((label) => (
            <button
              key={label}
              className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-foreground transition-colors border border-border/60 hover:border-border"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground border-b border-border/50">
        Results
      </p>
      <div className="divide-y divide-border/40">
        {results.map((result) => {
          const Icon = getCategoryIcon(result.category);
          return (
            <button
              key={result.id}
              onClick={() => onSelect(result)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/60 transition-colors group"
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${getCategoryColor(result.category)}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{result.title}</p>
                <p className="text-xs text-muted-foreground truncate">{result.description}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getCategoryColor(result.category)}`}>
                  {result.category}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Mobile Full-screen Overlay ──────────────────────────────────────────────
const MobileSearchOverlay = ({
  onSearch, onSelect, onClose,
}: {
  onSearch: GlobalSearchProps["onSearch"];
  onSelect: GlobalSearchProps["onSelect"];
  onClose: () => void;
}) => {
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return; }
    const h = setTimeout(async () => {
      setLoading(true);
      try { setResults(await onSearch(query)); }
      catch { /* noop */ }
      finally { setLoading(false); }
    }, 280);
    return () => clearTimeout(h);
  }, [query, onSearch]);

  const handleSelect = (r: SearchResult) => { onSelect(r); onClose(); };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm md:hidden"
      style={{ animation: "fadeIn 0.15s ease" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="absolute top-0 left-0 right-0 bg-background rounded-b-2xl shadow-2xl overflow-hidden"
        style={{ animation: "slideDown 0.25s cubic-bezier(0.16,1,0.3,1)" }}
      >
        {/* Input Row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && onClose()}
            placeholder="Search anything..."
            className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground outline-none"
          />
          {query ? (
            <button onClick={() => setQuery("")} className="p-1 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="text-xs font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[65vh] overflow-y-auto">
          <ResultsList query={query} results={results} loading={loading} onSelect={handleSelect} />
        </div>
      </div>

      <style>{`
        @keyframes fadeIn    { from { opacity:0 } to { opacity:1 } }
        @keyframes slideDown { from { transform:translateY(-100%) } to { transform:translateY(0) } }
      `}</style>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const GlobalSearch = ({ onSearch, onSelect }: GlobalSearchProps) => {
  const [query, setQuery]           = useState("");
  const [results, setResults]       = useState<SearchResult[]>([]);
  const [loading, setLoading]       = useState(false);
  const [showDropdown, setDropdown] = useState(false);
  const [focused, setFocused]       = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdown(false);
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Cmd+K
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (window.innerWidth < 768) setMobileOpen(true);
        else containerRef.current?.querySelector("input")?.focus();
      }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); setDropdown(focused); return; }
    const h = setTimeout(async () => {
      setLoading(true);
      setDropdown(true);
      try { setResults(await onSearch(query)); }
      catch { /* noop */ }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(h);
  }, [query, onSearch, focused]);

  const handleSelect = (r: SearchResult) => { onSelect(r); setDropdown(false); setQuery(""); };
  const clearSearch  = () => { setQuery(""); setResults([]); };

  return (
    <>
      {/* ── Mobile: icon-only trigger ───────────────────────── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-muted/60 hover:bg-muted border border-border/60 hover:border-border transition-all text-muted-foreground hover:text-foreground"
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
      </button>

      {mobileOpen && (
        <MobileSearchOverlay
          onSearch={onSearch}
          onSelect={onSelect}
          onClose={() => setMobileOpen(false)}
        />
      )}

      {/* ── Desktop: spotlight pill bar ─────────────────────── */}
      <div ref={containerRef} className="relative hidden md:block w-[300px] lg:w-[360px]">
        {/* Bar */}
        <div
          className={`flex items-center h-10 rounded-2xl border transition-all duration-200 overflow-visible
            ${focused
              ? "border-primary/60 bg-background shadow-[0_0_0_3px_hsl(var(--primary)/0.12)]"
              : "border-border/70 bg-muted/40 hover:bg-muted/70 hover:border-border shadow-sm"
            }`}
        >
          {/* Icon */}
          <div className={`pl-3.5 flex-shrink-0 transition-colors ${focused ? "text-primary" : "text-muted-foreground"}`}>
            {loading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Search className="h-4 w-4" />
            }
          </div>

          {/* Input */}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { setFocused(true); setDropdown(true); }}
            onKeyDown={(e) => {
              if (e.key === "Escape") { setDropdown(false); setQuery(""); setFocused(false); }
            }}
            placeholder="Search anything..."
            className="flex-1 h-full px-2.5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />

          {/* Clear */}
          {query && (
            <button
              onMouseDown={(e) => { e.preventDefault(); clearSearch(); }}
              className="mr-1 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Kbd hint when idle */}
          {!focused && !query && (
            <div className="mr-2.5 flex-shrink-0">
              <kbd className="inline-flex h-5 items-center rounded border border-border/60 bg-background/80 px-1.5 font-mono text-[10px] text-muted-foreground shadow-sm">
                ⌘K
              </kbd>
            </div>
          )}
        </div>

        {/* Dropdown */}
        {showDropdown && (
          <div
            className="absolute top-[calc(100%+8px)] left-0 right-0 z-50 bg-popover border border-border rounded-2xl shadow-xl overflow-hidden"
            style={{ animation: "dropIn 0.15s cubic-bezier(0.16,1,0.3,1)" }}
          >
            <ResultsList
              query={query}
              results={results}
              loading={loading}
              onSelect={handleSelect}
            />

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-border/50 bg-muted/30">
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <kbd className="border border-border rounded px-1 font-mono bg-background text-[9px]">↑↓</kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="border border-border rounded px-1 font-mono bg-background text-[9px]">↵</kbd>
                  select
                </span>
              </div>
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <kbd className="border border-border rounded px-1 font-mono bg-background text-[9px]">esc</kbd>
                close
              </span>
            </div>
          </div>
        )}

        <style>{`
          @keyframes dropIn {
            from { opacity:0; transform:translateY(-6px) scale(0.98); }
            to   { opacity:1; transform:translateY(0)    scale(1);    }
          }
        `}</style>
      </div>
    </>
  );
};

export default GlobalSearch;