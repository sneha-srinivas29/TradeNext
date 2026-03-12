import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SimpleFilter, FilterOption } from "./Simplefilter";
import { DateRangePicker } from "../../Common/Daterangepicker";

interface ItemFulfillmentsToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: Set<string>;
  statusOptions: FilterOption[];
  onStatusFilterChange: (value: Set<string>) => void;
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

export const ItemFulfillmentsToolbar = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  statusOptions,
  onStatusFilterChange,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onDateReset,
  onCreateClick,
  onResetAll,
  showResetAll = false,
  createButtonText = "Create",
}: ItemFulfillmentsToolbarProps) => {
  return (
    <>
      {/* DESKTOP LAYOUT */}
      <div className="hidden sm:flex items-center justify-between mb-6 gap-3">
        {/* LEFT — Search */}
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 w-full"
          />
        </div>

        {/* RIGHT — Filters and Actions */}
        <div className="flex items-center gap-2">
          <SimpleFilter
            label="Status"
            options={statusOptions}
            selected={statusFilter}
            onChange={onStatusFilterChange}
          />

          <DateRangePicker
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

        {/* Row 2: Status, Date, Create */}
        <div className="flex items-center gap-2">
          <SimpleFilter
            label="Status"
            options={statusOptions}
            selected={statusFilter}
            onChange={onStatusFilterChange}
            showIcon={true}
          />

          <DateRangePicker
            fromDate={fromDate}
            toDate={toDate}
            onFromDateChange={onFromDateChange}
            onToDateChange={onToDateChange}
            onReset={onDateReset}
            compact
          />

          <Button
            size="sm"
            className="h-9 shadow-sm whitespace-nowrap"
            onClick={onCreateClick}
          >
            <Plus className="h-4 w-3 mr-1" />
            Create
          </Button>
        </div>

        {/* Reset button if filters active */}
        {showResetAll && onResetAll && (
          <Button
            variant="outline"
            size="sm"
            onClick={onResetAll}
            className="w-full h-9"
          >
            Reset Filters
          </Button>
        )}
      </div>
    </>
  );
};