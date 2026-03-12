import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar, Plus, Search, SlidersHorizontal, X, ChevronDown, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

import { statusOptions } from "./Statusfilter";

interface MobileToolbarProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  statusFilter: Set<string>;
  setStatusFilter: (v: Set<string>) => void;
  fromDate: string;
  setFromDate: (v: string) => void;
  toDate: string;
  setToDate: (v: string) => void;
  onReset: () => void;
  showReset: boolean;
}

export const MobileToolbar = ({
  searchQuery, setSearchQuery,
  statusFilter, setStatusFilter,
  fromDate, setFromDate,
  toDate, setToDate,
  onReset, showReset,
}: MobileToolbarProps) => {
  const navigate = useNavigate();

  const [draftFrom, setDraftFrom] = useState(fromDate);
  const [draftTo,   setDraftTo]   = useState(toDate);
  const [dateOpen,  setDateOpen]  = useState(false);

  // Active only when user has explicitly chosen dates
  const isDateActive = !!(fromDate || toDate);

  const openDatePicker = (open: boolean) => {
    if (open) { setDraftFrom(fromDate); setDraftTo(toDate); }
    setDateOpen(open);
  };

  const applyDate = () => {
    setFromDate(draftFrom);
    setToDate(draftTo);
    setDateOpen(false);
  };

  const resetDate = () => {
    setDraftFrom("");
    setDraftTo("");
    setFromDate("");
    setToDate("");
    setDateOpen(false);
  };

  return (
    <div className="sm:hidden space-y-2.5 mb-5">

      {/* Row 1 — Search + Create */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[15px] w-[15px] text-zinc-400 pointer-events-none" />
          <Input
            placeholder="Search by ID, customer…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-9 pr-9 text-[13px] rounded-xl border-zinc-200 bg-zinc-50 focus:bg-white text-zinc-900 placeholder:text-zinc-400 focus-visible:ring-primary/20"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Button
          onClick={() => navigate("/sales-orders/create")}
          className="h-10 px-4 rounded-xl text-[13px] font-semibold bg-primary text-white hover:bg-primary/90 shadow-sm shrink-0"
        >
          <Plus className="h-4 w-4 mr-1" />
          Create
        </Button>
      </div>

      {/* Row 2 — Status filter + Date range */}
      <div className="flex gap-2">

        {/* Status */}
        <Popover>
          <PopoverTrigger asChild>
            <button className={cn(
              "flex items-center gap-1.5 h-9 px-3 rounded-xl border text-[13px] font-medium transition-colors shrink-0",
              statusFilter.size > 0
                ? "bg-primary text-white border-primary"
                : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300"
            )}>
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filter
              {statusFilter.size > 0 && (
                <span className="bg-white/25 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                  {statusFilter.size}
                </span>
              )}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-0 rounded-xl border-zinc-200 shadow-lg" align="start" sideOffset={6}>
            <div className="p-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 px-2 py-1.5">Status</p>
              {statusOptions.map((opt) => {
                const active = statusFilter.has(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => {
                      const n = new Set(statusFilter);
                      active ? n.delete(opt.value) : n.add(opt.value);
                      setStatusFilter(n);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors text-left",
                      active ? "bg-primary/8 text-primary" : "hover:bg-zinc-50 text-zinc-800"
                    )}
                  >
                    {opt.label}
                    {active && <Check className="h-3.5 w-3.5 text-primary" />}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        {/* Date range */}
        <Popover open={dateOpen} onOpenChange={openDatePicker}>
          <PopoverTrigger asChild>
            <button className={cn(
              "flex items-center gap-1.5 h-9 px-3 rounded-xl border text-[13px] font-medium transition-colors shrink-0",
              isDateActive
                ? "bg-primary text-white border-primary"
                : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300"
            )}>
              <Calendar className="h-3.5 w-3.5" />
              {isDateActive ? "Date filtered" : "Date"}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </button>
          </PopoverTrigger>

          <PopoverContent
            className="w-[min(calc(100vw-2rem),320px)] p-0 rounded-2xl border-zinc-200 shadow-2xl"
            align="start" sideOffset={6}
          >
            <div className="px-4 pt-3.5 pb-3 border-b border-zinc-100">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">Date Range</p>
              <p className="text-sm text-zinc-600">
                {draftFrom || draftTo
                  ? `${draftFrom || "Any"} → ${draftTo || "Any"}`
                  : "No date filter applied"}
              </p>
            </div>

            <div className="p-4 space-y-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">From</Label>
                <Input
                  type="text"
                  placeholder="dd-mm-yyyy"
                  value={draftFrom}
                  onChange={(e) => setDraftFrom(e.target.value)}
                  className="h-9 text-sm rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">To</Label>
                <Input
                  type="text"
                  placeholder="dd-mm-yyyy"
                  value={draftTo}
                  onChange={(e) => setDraftTo(e.target.value)}
                  className="h-9 text-sm rounded-lg"
                />
              </div>
            </div>

            <div className="flex gap-2 px-4 pb-4">
              <button
                onClick={resetDate}
                className="flex-1 h-9 rounded-lg border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={applyDate}
                className="flex-1 h-9 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Apply
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active filter chips */}
      {(showReset || isDateActive) && (
        <div className="flex flex-wrap gap-1.5 items-center">
          {searchQuery && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200 px-2.5 py-1 rounded-full">
              "{searchQuery}"
              <button onClick={() => setSearchQuery("")}><X className="h-2.5 w-2.5" /></button>
            </span>
          )}
          {Array.from(statusFilter).map((s) => (
            <span key={s} className="inline-flex items-center gap-1 text-[11px] font-medium bg-primary/10 text-primary border border-primary/15 px-2.5 py-1 rounded-full">
              {s}
              <button onClick={() => { const n = new Set(statusFilter); n.delete(s); setStatusFilter(n); }}>
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
          {isDateActive && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-primary/10 text-primary border border-primary/15 px-2.5 py-1 rounded-full">
              {fromDate || "Any"} → {toDate || "Any"}
              <button onClick={resetDate}><X className="h-2.5 w-2.5" /></button>
            </span>
          )}
          <button onClick={onReset} className="ml-auto text-[11px] text-zinc-400 hover:text-red-400 transition-colors">
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};