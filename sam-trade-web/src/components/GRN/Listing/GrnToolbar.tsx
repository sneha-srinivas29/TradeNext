import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { GrnFilters, FilterSection } from "./GrnFilters";
import DateRangeFilter from "@/components/Common/Daterangefilter";
import { useNavigate } from "react-router-dom";

interface GrnToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filters: Record<string, Set<string>>;
  filterSections: FilterSection[];
  onFilterChange: (key: string, value: Set<string>) => void;
  onClearAllFilters: () => void;
  fromDate: string;
  toDate: string;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
  onDateReset: () => void;
  onCreateClick: () => void;
  onResetAll?: () => void;
  showResetAll?: boolean;
  createButtonText?: string;
}


export const GrnToolbar = ({
  searchQuery,
  onSearchChange,
  filters,
  filterSections,
  onFilterChange,
  onClearAllFilters,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onDateReset,
  onCreateClick,
  onResetAll,
  showResetAll = false,
  createButtonText = "Create",
}: GrnToolbarProps) => {
  const navigate = useNavigate();
  return (
    <>
      {/* DESKTOP LAYOUT */}
      <div className="hidden sm:flex items-center justify-between mb-6 gap-3">
        {/* LEFT — Search */}
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Search GRN No, Supplier, PO No..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 w-full"
          />
        </div>

        {/* RIGHT — Filters and Actions */}
        <div className="flex items-center gap-2">
          <GrnFilters
            filters={filters}
            filterSections={filterSections}
            onFilterChange={onFilterChange}
            onClearAll={onClearAllFilters}
          />

          <DateRangeFilter
            fromDate={fromDate}
            toDate={toDate}
            onFromDateChange={onFromDateChange}
            onToDateChange={onToDateChange}
            onReset={onDateReset}
          />

          <Button size="sm" className="h-9 shadow-sm" onClick={onCreateClick}>
            <Plus className="h-4 w-3 mr-2" />
            {createButtonText}
          </Button>
        </div>
      </div>

      {/* MOBILE LAYOUT */}
      <div className="sm:hidden space-y-3 mb-6">
        {/* Row 1: Search Input */}
        <div className="w-full">
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 w-full"
          />
        </div>

        {/* Row 2: Unified Filter + Date Range */}
        <div className="flex items-center gap-2">
          <GrnFilters
            filters={filters}
            filterSections={filterSections}
            onFilterChange={onFilterChange}
            onClearAll={onClearAllFilters}
          />

          <DateRangeFilter
            fromDate={fromDate}
            toDate={toDate}
            onFromDateChange={onFromDateChange}
            onToDateChange={onToDateChange}
            onReset={onDateReset}
            
          />
        </div>

        {/* Row 3: Create Button */}
        <Button
  size="sm"
  className="h-9 w-full shadow-sm"
  onClick={() => navigate("/grn-create")}
>
  Create GRN
</Button>


        {/* Reset button if filters active */}
        {showResetAll && onResetAll && (
          <Button
            variant="outline"
            size="sm"
            onClick={onResetAll}
            className="w-full h-9"
          >
            Reset All Filters
          </Button>
        )}
      </div>
    </>
  );
};